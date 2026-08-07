import type { KotlinTestCase } from "./kotlin-grader-types";

const API_SERVER = process.env.KOTLIN_API_SERVER ?? "https://api.kotlinlang.org";
const COMPILER_VERSION = process.env.KOTLIN_COMPILER_VERSION ?? "2.0.21";
const REQUEST_TIMEOUT_MS = Number(
  process.env.KOTLIN_API_TIMEOUT_MS ?? "15000"
);

interface KotlinFile {
  name: string;
  text: string;
  publicId: string;
}

export interface KotlinRunResult {
  output: string;
  errors: string[];
  success: boolean;
}

export interface KotlinTestResult {
  passed: boolean;
  tests: KotlinTestCase[];
  errors: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectCompilerErrors(value: unknown): string[] {
  if (!isRecord(value)) return [];

  const errors: string[] = [];
  for (const fileErrors of Object.values(value)) {
    if (!Array.isArray(fileErrors)) continue;
    for (const fileError of fileErrors) {
      if (
        isRecord(fileError) &&
        fileError.severity === "ERROR" &&
        typeof fileError.message === "string"
      ) {
        errors.push(fileError.message);
      }
    }
  }
  return errors;
}

async function postToCompiler(
  endpoint: "run" | "test",
  body: Record<string, unknown>
): Promise<{ data: unknown } | { error: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${API_SERVER}/api/${COMPILER_VERSION}/compiler/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      return {
        error: `Kotlin compiler service returned ${response.status} ${response.statusText}`.trim(),
      };
    }

    try {
      return { data: await response.json() };
    } catch {
      return { error: "Kotlin compiler service returned an invalid response" };
    }
  } catch (error) {
    if (controller.signal.aborted) {
      return { error: "Kotlin compiler service timed out. Try again." };
    }
    return {
      error:
        error instanceof Error && error.message
          ? error.message
          : "Unable to reach the Kotlin compiler service",
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse the JetBrains compiler output text.
 * Output is wrapped in <outStream>...</outStream> and <errStream>...</errStream> tags.
 * We extract only stdout (outStream) content.
 */
export function parseOutput(raw: string): string {
  if (!raw) return "";

  // Check if the output contains stream tags
  const hasStreamTags = raw.includes("<outStream>") || raw.includes("<errStream>");

  if (!hasStreamTags) {
    return raw.trim();
  }

  // Extract all <outStream> content
  const parts: string[] = [];
  const regex = /<outStream>([\s\S]*?)<\/outStream>/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    parts.push(match[1]);
  }

  let result = parts.join("");

  // Decode HTML entities
  result = result
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');

  return result.trim();
}

/**
 * Build the files array for the API request.
 * The main code goes in File.kt, hidden dependencies go in hiddenDependency0.kt, etc.
 */
export function buildFiles(code: string, hiddenCode?: string): KotlinFile[] {
  const files: KotlinFile[] = [
    { name: "File.kt", text: code, publicId: "" },
  ];

  if (hiddenCode) {
    files.push({
      name: "hiddenDependency0.kt",
      text: hiddenCode,
      publicId: "",
    });
  }

  return files;
}

/**
 * Run Kotlin code via the JetBrains compiler API.
 * Optionally include hidden code (e.g. a main function that calls the student's code).
 */
export async function runKotlin(
  code: string,
  hiddenCode?: string
): Promise<KotlinRunResult> {
  const files = buildFiles(code, hiddenCode);

  const response = await postToCompiler("run", {
    args: "",
    files,
    confType: "java",
  });
  if ("error" in response) {
    return {
      output: "",
      errors: [response.error],
      success: false,
    };
  }

  if (!isRecord(response.data)) {
    return {
      output: "",
      errors: ["Kotlin compiler service returned an invalid response"],
      success: false,
    };
  }

  const data = response.data;

  const errors = collectCompilerErrors(data.errors);

  // Check for runtime exception
  if (isRecord(data.exception)) {
    const msg =
      (typeof data.exception.message === "string" && data.exception.message) ||
      (typeof data.exception.fullName === "string" && data.exception.fullName) ||
      "Runtime error";
    errors.push(msg);
  }

  const output = parseOutput(typeof data.text === "string" ? data.text : "");
  const success = errors.length === 0;

  return { output, errors, success };
}

/**
 * Build files array for a JUnit test request.
 * Student code in File.kt, test code in Tests.kt.
 */
export function buildTestFiles(code: string, testCode: string): KotlinFile[] {
  return [
    { name: "File.kt", text: code, publicId: "" },
    { name: "Tests.kt", text: testCode, publicId: "" },
  ];
}

/**
 * Parse the raw testResults object from the JetBrains API into a clean result.
 */
export function parseTestResults(
  raw: Record<
    string,
    {
      status: string;
      methodName: string;
      comparisonFailure?: { message?: string; expected?: string; actual?: string } | null;
      exception?: { message?: string } | null;
    }[]
  >
): KotlinTestResult {
  const tests: KotlinTestCase[] = [];

  for (const classTests of Object.values(raw)) {
    for (const t of classTests) {
      const passed = t.status === "OK";
      const testCase: KotlinTestCase = {
        name: t.methodName,
        passed,
      };

      if (!passed) {
        if (t.comparisonFailure) {
          testCase.message = t.comparisonFailure.message ?? "Assertion failed";
          testCase.expected = t.comparisonFailure.expected;
          testCase.actual = t.comparisonFailure.actual;
        } else if (t.exception) {
          testCase.message = t.exception.message ?? "Test error";
        }
      }

      tests.push(testCase);
    }
  }

  return {
    passed: tests.length > 0 && tests.every((t) => t.passed),
    tests,
    errors:
      tests.length > 0
        ? []
        : ["The Kotlin compiler service did not return any test results."],
  };
}

/**
 * Run student code against JUnit tests via the JetBrains compiler API.
 */
export async function runKotlinTests(
  code: string,
  testCode: string
): Promise<KotlinTestResult> {
  const files = buildTestFiles(code, testCode);

  const response = await postToCompiler("test", {
    args: "",
    files,
    confType: "junit",
  });
  if ("error" in response) {
    return {
      passed: false,
      tests: [],
      errors: [response.error],
    };
  }

  if (!isRecord(response.data)) {
    return {
      passed: false,
      tests: [],
      errors: ["Kotlin compiler service returned an invalid response"],
    };
  }

  const data = response.data;

  const errors = collectCompilerErrors(data.errors);

  if (errors.length > 0) {
    return { passed: false, tests: [], errors };
  }

  if (!isRecord(data.testResults)) {
    return {
      passed: false,
      tests: [],
      errors: ["The Kotlin compiler service did not return any test results."],
    };
  }

  return parseTestResults(
    data.testResults as Parameters<typeof parseTestResults>[0]
  );
}
