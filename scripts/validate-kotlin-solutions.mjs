import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const contentRoot = path.join(root, "content", "playground");
const compiler = process.env.KOTLINC_BIN || "kotlinc";
const kotlinRunner = process.env.KOTLIN_RUNNER_BIN || "kotlin";
const concurrency = boundedInteger(
  process.env.KOTLIN_VALIDATION_CONCURRENCY,
  4,
  1,
  8
);
const timeoutMs = boundedInteger(
  process.env.KOTLIN_VALIDATION_TIMEOUT_MS,
  60_000,
  1_000,
  300_000
);

const junitStubs = `
package org.junit

import kotlin.math.abs
import kotlin.reflect.KClass

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class Test(val expected: KClass<out Throwable> = None::class)

class None : Throwable()

object Assert {
    @JvmStatic
    fun assertEquals(expected: Any?, actual: Any?) {
        if (expected != actual) {
            throw AssertionError("Expected <$expected> but was <$actual>")
        }
    }

    @JvmStatic
    fun assertEquals(message: String, expected: Any?, actual: Any?) {
        if (expected != actual) {
            throw AssertionError("$message: expected <$expected> but was <$actual>")
        }
    }

    @JvmStatic
    fun assertEquals(expected: Double, actual: Double, delta: Double) {
        if (expected.isNaN() != actual.isNaN() || (!expected.isNaN() && abs(expected - actual) > delta)) {
            throw AssertionError("Expected <$expected> but was <$actual> (delta <$delta>)")
        }
    }

    @JvmStatic fun assertTrue(value: Boolean) = assertTrue("Expected true", value)
    @JvmStatic fun assertTrue(message: String, value: Boolean) {
        if (!value) throw AssertionError(message)
    }

    @JvmStatic fun assertFalse(value: Boolean) = assertFalse("Expected false", value)
    @JvmStatic fun assertFalse(message: String, value: Boolean) {
        if (value) throw AssertionError(message)
    }

    @JvmStatic fun assertNull(value: Any?) {
        if (value != null) throw AssertionError("Expected null but was <$value>")
    }

    @JvmStatic fun fail(message: String): Nothing = throw AssertionError(message)
}
`;

const testRunner = `
import java.lang.reflect.InvocationTargetException
import org.junit.None
import org.junit.Test

fun main() {
    val instance = Tests::class.java.getDeclaredConstructor().newInstance()
    val methods = Tests::class.java.declaredMethods
        .filter { it.getAnnotation(Test::class.java) != null }
        .sortedBy { it.name }

    check(methods.isNotEmpty()) { "No @Test methods were found" }

    var passed = 0
    for (method in methods) {
        method.isAccessible = true
        val annotation = method.getAnnotation(Test::class.java)
        val expected = annotation.expected.java

        try {
            method.invoke(instance)
            if (expected != None::class.java) {
                throw AssertionError(
                    "\${method.name} expected \${expected.name} but no exception was thrown"
                )
            }
        } catch (error: InvocationTargetException) {
            val cause = error.targetException
            if (expected == None::class.java || !expected.isInstance(cause)) {
                throw AssertionError("\${method.name} failed: \${cause.message}", cause)
            }
        }

        passed += 1
    }

    println("FRC_TESTS_PASSED=$passed")
}
`;

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
}

async function findExerciseFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return findExerciseFiles(entryPath);
      return entry.isFile() && entry.name.endsWith(".json") ? [entryPath] : [];
    })
  );
  return nested.flat();
}

function run(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let settled = false;
    let timedOut = false;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (chunk) => (output += chunk));
    child.stderr.on("data", (chunk) => (output += chunk));
    child.on("error", (error) =>
      finish({ code: -1, output: error.message, timedOut: false })
    );
    child.on("close", (code) =>
      finish({
        code: timedOut ? -1 : code ?? -1,
        output: timedOut
          ? `${output}\nTimed out after ${timeoutMs}ms`.trim()
          : output,
        timedOut,
      })
    );
  });
}

function normalizeOutput(output) {
  return output.replace(/\r\n/g, "\n").trim();
}

function failure(file, message) {
  return { file: path.relative(root, file), output: message.trim() };
}

async function validateExercise(file, workspace) {
  const exercise = JSON.parse(await readFile(file, "utf8"));
  if (
    exercise.type !== "code-completion" &&
    exercise.type !== "fix-the-bug" &&
    exercise.type !== "write-from-scratch"
  ) {
    return { kind: "skipped" };
  }

  const exerciseDir = path.join(
    workspace,
    exercise.id.replace(/[^a-zA-Z0-9_-]/g, "_")
  );
  const outputDir = path.join(exerciseDir, "classes");
  await mkdir(outputDir, { recursive: true });

  const sourceFiles = [];
  const solutionPath = path.join(exerciseDir, "Solution.kt");
  await writeFile(solutionPath, exercise.solutionCode);
  sourceFiles.push(solutionPath);

  const hiddenCode = [exercise.hiddenPreamble, exercise.hiddenPostamble]
    .filter(Boolean)
    .join("\n\n");
  if (hiddenCode) {
    const hiddenPath = path.join(exerciseDir, "Hidden.kt");
    await writeFile(hiddenPath, hiddenCode);
    sourceFiles.push(hiddenPath);
  }

  if (exercise.validationMode === "test") {
    if (!exercise.testCode) {
      return { failure: failure(file, "Test exercise has no testCode") };
    }

    const testsPath = path.join(exerciseDir, "Tests.kt");
    const stubsPath = path.join(exerciseDir, "JunitStubs.kt");
    const runnerPath = path.join(exerciseDir, "TestRunner.kt");
    await Promise.all([
      writeFile(testsPath, exercise.testCode),
      writeFile(stubsPath, junitStubs),
      writeFile(runnerPath, testRunner),
    ]);
    sourceFiles.push(testsPath, stubsPath, runnerPath);
  }

  const compiled = await run(compiler, [...sourceFiles, "-d", outputDir]);
  if (compiled.code !== 0) {
    return { failure: failure(file, compiled.output) };
  }

  if (exercise.validationMode === "output") {
    if (typeof exercise.expectedOutput !== "string") {
      return { failure: failure(file, "Output exercise has no expectedOutput") };
    }

    const mainClass = /\bfun\s+main\s*\(/.test(hiddenCode)
      ? "HiddenKt"
      : /\bfun\s+main\s*\(/.test(exercise.solutionCode)
        ? "SolutionKt"
        : null;
    if (!mainClass) {
      return { failure: failure(file, "Output exercise has no main function") };
    }

    const executed = await run(kotlinRunner, ["-classpath", outputDir, mainClass]);
    if (executed.code !== 0) {
      return { failure: failure(file, executed.output) };
    }

    const actual = normalizeOutput(executed.output);
    const expected = normalizeOutput(exercise.expectedOutput);
    if (actual !== expected) {
      return {
        failure: failure(
          file,
          `Output mismatch\nExpected:\n${expected}\n\nActual:\n${actual}`
        ),
      };
    }

    return { kind: "output", tests: 0 };
  }

  if (exercise.validationMode === "test") {
    const executed = await run(kotlinRunner, [
      "-classpath",
      outputDir,
      "TestRunnerKt",
    ]);
    if (executed.code !== 0) {
      return { failure: failure(file, executed.output) };
    }

    const match = executed.output.match(/FRC_TESTS_PASSED=(\d+)/);
    if (!match) {
      return { failure: failure(file, "Test runner reported no results") };
    }

    return { kind: "test", tests: Number(match[1]) };
  }

  return {
    failure: failure(file, `Unknown validation mode: ${exercise.validationMode}`),
  };
}

async function main() {
  const [compilerVersion, runnerVersion] = await Promise.all([
    run(compiler, ["-version"]),
    run(kotlinRunner, ["-version"]),
  ]);
  if (compilerVersion.code !== 0) {
    throw new Error(
      `Unable to run ${compiler}. Set KOTLINC_BIN to a Kotlin compiler binary.\n${compilerVersion.output}`
    );
  }
  if (runnerVersion.code !== 0) {
    throw new Error(
      `Unable to run ${kotlinRunner}. Set KOTLIN_RUNNER_BIN to a Kotlin runner binary.\n${runnerVersion.output}`
    );
  }

  const files = await findExerciseFiles(contentRoot);
  const workspace = await mkdtemp(path.join(tmpdir(), "frc-kotlin-solutions-"));
  const failures = [];
  let validated = 0;
  let outputPrograms = 0;
  let testSuites = 0;
  let testMethods = 0;
  let nextIndex = 0;

  try {
    async function worker() {
      while (nextIndex < files.length) {
        const file = files[nextIndex++];
        const result = await validateExercise(file, workspace);
        if (result.failure) {
          failures.push(result.failure);
          continue;
        }
        if (result.kind === "skipped") continue;

        validated += 1;
        if (result.kind === "output") outputPrograms += 1;
        if (result.kind === "test") {
          testSuites += 1;
          testMethods += result.tests;
        }
        if (validated % 20 === 0) {
          console.log(`Validated ${validated} Kotlin solutions…`);
        }
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }

  if (failures.length > 0) {
    for (const item of failures) {
      console.error(`\n${item.file}\n${item.output}`);
    }
    throw new Error(`${failures.length} Kotlin solution(s) failed validation.`);
  }

  console.log(
    `Validated ${validated} Kotlin exercise solutions: ` +
      `${outputPrograms} output programs and ${testSuites} test suites ` +
      `(${testMethods} test methods).`
  );
}

await main();
