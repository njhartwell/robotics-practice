import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  runLocalKotlin,
  runLocalKotlinTests,
} from "../src/lib/local-kotlin-runner.ts";
import { getPersistentKotlinCompiler } from "../src/lib/local-kotlin-compiler.ts";

const root = process.cwd();
const contentRoot = path.join(root, "content", "playground");

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

function isCodeExercise(exercise) {
  return (
    exercise.type === "code-completion" ||
    exercise.type === "fix-the-bug" ||
    exercise.type === "write-from-scratch"
  );
}

function normalizeOutput(output) {
  return output.replace(/\r\n/g, "\n").trim();
}

function describeFailure(file, message) {
  return `${path.relative(root, file)}\n${message.trim()}`;
}

const files = (await findExerciseFiles(contentRoot)).sort();
const failures = [];
let validated = 0;
let outputPrograms = 0;
let testSuites = 0;
let testMethods = 0;

try {
  for (const file of files) {
    const exercise = JSON.parse(await readFile(file, "utf8"));
    if (!isCodeExercise(exercise)) continue;

    if (exercise.validationMode === "output") {
      const hiddenCode = [exercise.hiddenPreamble, exercise.hiddenPostamble]
        .filter(Boolean)
        .join("\n\n");
      const result = await runLocalKotlin(
        exercise.solutionCode,
        hiddenCode || undefined
      );
      if (!result.success) {
        failures.push(describeFailure(file, result.errors.join("\n")));
        continue;
      }
      if (
        normalizeOutput(result.output) !== normalizeOutput(exercise.expectedOutput)
      ) {
        failures.push(
          describeFailure(
            file,
            `Output mismatch\nExpected:\n${exercise.expectedOutput}\n\nActual:\n${result.output}`
          )
        );
        continue;
      }
      outputPrograms += 1;
    } else if (exercise.validationMode === "test" && exercise.testCode) {
      const result = await runLocalKotlinTests(
        exercise.solutionCode,
        exercise.testCode
      );
      if (!result.passed) {
        const testFailures = result.tests
          .filter((test) => !test.passed)
          .map((test) => `${test.name}: ${test.message ?? "failed"}`);
        failures.push(
          describeFailure(
            file,
            [...result.errors, ...testFailures].join("\n") || "Tests failed"
          )
        );
        continue;
      }
      testSuites += 1;
      testMethods += result.tests.length;
    } else {
      failures.push(describeFailure(file, "Invalid validation configuration"));
      continue;
    }

    validated += 1;
    if (validated % 20 === 0) {
      console.log(`Validated ${validated} Kotlin solutions…`);
    }
  }
} finally {
  getPersistentKotlinCompiler().stop();
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`\n${failure}`);
  throw new Error(`${failures.length} Kotlin solution(s) failed validation.`);
}

console.log(
  `Validated ${validated} Kotlin exercise solutions with the persistent worker: ` +
    `${outputPrograms} output programs and ${testSuites} test suites ` +
    `(${testMethods} test methods).`
);
