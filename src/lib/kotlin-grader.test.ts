import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CodeExercise } from "@/lib/progress/types";
import { gradeKotlinExercise } from "./kotlin-grader";

const baseExercise: CodeExercise = {
  id: "example-exercise",
  lessonSlug: "example-lesson",
  type: "write-from-scratch",
  order: 1,
  title: "Example",
  instructions: "Write code",
  xpReward: 10,
  starterCode: "",
  solutionCode: "",
  validationMode: "output",
  expectedOutput: "Hello",
};

describe("gradeKotlinExercise", () => {
  const originalExecutionMode = process.env.KOTLIN_EXECUTION_MODE;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.KOTLIN_EXECUTION_MODE = "remote";
  });

  afterEach(() => {
    if (originalExecutionMode === undefined) {
      delete process.env.KOTLIN_EXECUTION_MODE;
    } else {
      process.env.KOTLIN_EXECUTION_MODE = originalExecutionMode;
    }
  });

  it("requires successful execution and matching output", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "<outStream>Hello</outStream>",
          errors: { "File.kt": [] },
          exception: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await gradeKotlinExercise(baseExercise, "fun main() {} ");
    expect(result.passed).toBe(true);
    expect(result.output).toBe("Hello");
  });

  it("does not pass matching output when execution reports an error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          text: "<outStream>Hello</outStream>",
          errors: {
            "File.kt": [{ severity: "ERROR", message: "Compilation failed" }],
          },
          exception: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const result = await gradeKotlinExercise(baseExercise, "bad code");
    expect(result.passed).toBe(false);
    expect(result.errors).toContain("Compilation failed");
  });

  it("fails when a test exercise has no configured tests", async () => {
    const result = await gradeKotlinExercise(
      { ...baseExercise, validationMode: "test", testCode: undefined },
      "code"
    );
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("no tests configured");
  });
});
