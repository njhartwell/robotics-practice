import type { CodeExercise } from "@/lib/progress/types";
import { validateOutput } from "@/lib/content/exercise-validator";
import { runKotlin, runKotlinTests } from "./kotlin-executor";
import type { KotlinGradeResult } from "./kotlin-grader-types";

export async function gradeKotlinExercise(
  exercise: CodeExercise,
  code: string
): Promise<KotlinGradeResult> {
  if (exercise.validationMode === "test") {
    if (!exercise.testCode) {
      return graderConfigurationError("This exercise has no tests configured.");
    }

    const result = await runKotlinTests(code, exercise.testCode);
    return {
      passed: result.passed,
      output: "",
      errors: result.errors,
      tests: result.tests,
    };
  }

  if (exercise.expectedOutput === undefined) {
    return graderConfigurationError(
      "This exercise has no expected output configured."
    );
  }

  const hiddenCode = [exercise.hiddenPreamble, exercise.hiddenPostamble]
    .filter((part): part is string => Boolean(part))
    .join("\n\n");
  const result = await runKotlin(code, hiddenCode || undefined);

  return {
    passed:
      result.success && validateOutput(result.output, exercise.expectedOutput),
    output: result.output,
    errors: result.errors,
    tests: [],
  };
}

function graderConfigurationError(message: string): KotlinGradeResult {
  return {
    passed: false,
    output: "",
    errors: [message],
    tests: [],
  };
}
