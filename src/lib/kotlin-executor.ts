import type { KotlinRunResult, KotlinTestResult } from "./kotlin-api";
import {
  runKotlin as runRemoteKotlin,
  runKotlinTests as runRemoteKotlinTests,
} from "./kotlin-api";
import {
  runLocalKotlin,
  runLocalKotlinTests,
} from "./local-kotlin-runner";

type ExecutionMode = "auto" | "local" | "remote";

function executionMode(): ExecutionMode {
  const configured = process.env.KOTLIN_EXECUTION_MODE;
  return configured === "local" || configured === "remote"
    ? configured
    : "auto";
}

function localFailure(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return `The local Kotlin compiler is unavailable: ${detail}`;
}

export async function runKotlin(
  code: string,
  hiddenCode?: string
): Promise<KotlinRunResult> {
  const mode = executionMode();
  if (mode !== "remote") {
    try {
      return await runLocalKotlin(code, hiddenCode);
    } catch (error) {
      if (mode === "local") {
        return { output: "", errors: [localFailure(error)], success: false };
      }
      console.warn("Local Kotlin compiler unavailable; using remote fallback.", error);
    }
  }

  return runRemoteKotlin(code, hiddenCode);
}

export async function runKotlinTests(
  code: string,
  testCode: string
): Promise<KotlinTestResult> {
  const mode = executionMode();
  if (mode !== "remote") {
    try {
      return await runLocalKotlinTests(code, testCode);
    } catch (error) {
      if (mode === "local") {
        return { passed: false, tests: [], errors: [localFailure(error)] };
      }
      console.warn("Local Kotlin compiler unavailable; using remote fallback.", error);
    }
  }

  return runRemoteKotlinTests(code, testCode);
}
