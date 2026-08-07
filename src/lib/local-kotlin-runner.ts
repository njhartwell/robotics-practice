import { spawn } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { KotlinTestCase } from "./kotlin-grader-types";
import type { KotlinRunResult, KotlinTestResult } from "./kotlin-api";
import { getPersistentKotlinCompiler } from "./local-kotlin-compiler";

const DEFAULT_EXECUTION_TIMEOUT_MS = 3_000;
const MAX_PROCESS_OUTPUT = 128_000;

interface ProcessResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  outputLimitExceeded: boolean;
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(minimum, Math.min(parsed, maximum));
}

function compilerErrors(diagnostics: string): string[] {
  const lines = diagnostics
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length > 0 ? lines : ["Kotlin compilation failed."];
}

function executionError(result: ProcessResult): string {
  if (result.timedOut) {
    return `Kotlin program timed out after ${boundedInteger(
      process.env.KOTLIN_LOCAL_EXECUTION_TIMEOUT_MS,
      DEFAULT_EXECUTION_TIMEOUT_MS,
      500,
      15_000
    )}ms.`;
  }
  if (result.outputLimitExceeded) {
    return "Kotlin program produced too much output and was stopped.";
  }
  return (
    result.stderr.trim() ||
    result.stdout.trim() ||
    `Kotlin program exited with code ${result.code}.`
  );
}

function runtimeClasspath(
  outputDirectory: string,
  kotlinHome: string,
  additionalEntries: string[] = []
): string {
  const kotlinLibrary = (name: string) =>
    `${kotlinHome}${path.sep}lib${path.sep}${name}`;
  return [
    outputDirectory,
    ...additionalEntries,
    kotlinLibrary("kotlin-stdlib.jar"),
    kotlinLibrary("kotlin-stdlib-jdk7.jar"),
    kotlinLibrary("kotlin-stdlib-jdk8.jar"),
    kotlinLibrary("kotlin-reflect.jar"),
  ].join(path.delimiter);
}

function executeClass(
  java: string,
  classpath: string,
  mainClass: string
): Promise<ProcessResult> {
  const timeoutMs = boundedInteger(
    process.env.KOTLIN_LOCAL_EXECUTION_TIMEOUT_MS,
    DEFAULT_EXECUTION_TIMEOUT_MS,
    500,
    15_000
  );

  return new Promise((resolve, reject) => {
    const child = spawn(
      java,
      [
        "-Xmx128m",
        "-Dfile.encoding=UTF-8",
        "-cp",
        classpath,
        mainClass,
      ],
      { stdio: ["ignore", "pipe", "pipe"] }
    );
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let outputLimitExceeded = false;
    let settled = false;

    const stopForOutputLimit = () => {
      if (stdout.length + stderr.length <= MAX_PROCESS_OUTPUT) return;
      outputLimitExceeded = true;
      child.kill("SIGKILL");
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      stopForOutputLimit();
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
      stopForOutputLimit();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        code: code ?? -1,
        stdout: stdout.slice(0, MAX_PROCESS_OUTPUT),
        stderr: stderr.slice(0, MAX_PROCESS_OUTPUT),
        timedOut,
        outputLimitExceeded,
      });
    });
  });
}

function hasMainFunction(code: string | undefined): boolean {
  return typeof code === "string" && /\bfun\s+main\s*\(/.test(code);
}

function decode(value: string): string | undefined {
  if (!value) return undefined;
  return Buffer.from(value, "base64").toString("utf8");
}

export function parseLocalTestOutput(output: string): KotlinTestResult {
  const tests: KotlinTestCase[] = [];
  let reportedCount: number | null = null;

  for (const line of output.split(/\r?\n/)) {
    if (line.startsWith("FRC_TESTS_DONE=")) {
      reportedCount = Number(line.slice("FRC_TESTS_DONE=".length));
      continue;
    }
    if (!line.startsWith("FRC_TEST\t")) continue;

    const [, encodedName, status, message, expected, actual] = line.split("\t");
    tests.push({
      name: decode(encodedName) ?? "unnamed test",
      passed: status === "OK",
      message: decode(message),
      expected: decode(expected),
      actual: decode(actual),
    });
  }

  if (
    reportedCount === null ||
    reportedCount === 0 ||
    reportedCount !== tests.length
  ) {
    return {
      passed: false,
      tests,
      errors: ["The local Kotlin test runner did not report valid results."],
    };
  }

  return {
    passed: tests.every((test) => test.passed),
    tests,
    errors: [],
  };
}

export async function runLocalKotlin(
  code: string,
  hiddenCode?: string
): Promise<KotlinRunResult> {
  const workspace = await mkdtemp(
    path.join(/*turbopackIgnore: true*/ tmpdir(), "frc-kotlin-run-")
  );
  const outputDirectory = path.join(
    /*turbopackIgnore: true*/ workspace,
    "classes"
  );
  await mkdir(outputDirectory);

  try {
    const studentPath = path.join(
      /*turbopackIgnore: true*/ workspace,
      "File.kt"
    );
    const sourcePaths = [studentPath];
    await writeFile(studentPath, code);

    if (hiddenCode) {
      const hiddenPath = path.join(
        /*turbopackIgnore: true*/ workspace,
        "Hidden.kt"
      );
      await writeFile(hiddenPath, hiddenCode);
      sourcePaths.push(hiddenPath);
    }

    const compiler = getPersistentKotlinCompiler();
    const compiled = await compiler.compile(sourcePaths, outputDirectory);
    if (!compiled.success) {
      return {
        output: "",
        errors: compilerErrors(compiled.diagnostics),
        success: false,
      };
    }

    const mainClass = hasMainFunction(hiddenCode)
      ? "HiddenKt"
      : hasMainFunction(code)
        ? "FileKt"
        : null;
    if (!mainClass) {
      return {
        output: "",
        errors: ["Kotlin program has no main function."],
        success: false,
      };
    }

    const config = compiler.getConfig();
    const executed = await executeClass(
      config.java,
      runtimeClasspath(outputDirectory, config.kotlinHome),
      mainClass
    );
    if (executed.code !== 0) {
      return {
        output: executed.stdout.trim(),
        errors: [executionError(executed)],
        success: false,
      };
    }

    return {
      output: executed.stdout.trim(),
      errors: [],
      success: true,
    };
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}

export async function runLocalKotlinTests(
  code: string,
  testCode: string
): Promise<KotlinTestResult> {
  const workspace = await mkdtemp(
    path.join(/*turbopackIgnore: true*/ tmpdir(), "frc-kotlin-test-")
  );
  const outputDirectory = path.join(
    /*turbopackIgnore: true*/ workspace,
    "classes"
  );
  await mkdir(outputDirectory);

  try {
    const files = [
      ["File.kt", code],
      ["Tests.kt", testCode],
    ] as const;
    const sourcePaths = await Promise.all(
      files.map(async ([name, source]) => {
        const filePath = path.join(
          /*turbopackIgnore: true*/ workspace,
          name
        );
        await writeFile(filePath, source);
        return filePath;
      })
    );

    const compiler = getPersistentKotlinCompiler();
    const config = await compiler.loadConfig();
    const compiled = await compiler.compile(sourcePaths, outputDirectory, [
      config.testSupport,
    ]);
    if (!compiled.success) {
      return {
        passed: false,
        tests: [],
        errors: compilerErrors(compiled.diagnostics),
      };
    }

    const executed = await executeClass(
      config.java,
      runtimeClasspath(outputDirectory, config.kotlinHome, [config.testSupport]),
      "TestRunnerKt"
    );
    if (executed.code !== 0) {
      return {
        passed: false,
        tests: [],
        errors: [executionError(executed)],
      };
    }

    return parseLocalTestOutput(executed.stdout);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
}
