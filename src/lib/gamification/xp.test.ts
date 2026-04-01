import { describe, it, expect } from "vitest";
import { calculateXpAward, isExerciseCompleted } from "./xp";
import type { ExerciseProgress } from "@/lib/progress/types";

describe("calculateXpAward", () => {
  it("returns full XP for first-time completion", () => {
    const exerciseXp = 20;
    const progress: ExerciseProgress = {
      exerciseId: "01-variables/ex-01",
      completed: false,
      attempts: 0,
    };
    expect(calculateXpAward(exerciseXp, progress)).toBe(20);
  });

  it("returns 0 XP for already-completed exercise", () => {
    const exerciseXp = 20;
    const progress: ExerciseProgress = {
      exerciseId: "01-variables/ex-01",
      completed: true,
      completedAt: "2024-01-01T00:00:00Z",
      attempts: 1,
    };
    expect(calculateXpAward(exerciseXp, progress)).toBe(0);
  });

  it("returns full XP for exercise with attempts but not yet completed", () => {
    const exerciseXp = 15;
    const progress: ExerciseProgress = {
      exerciseId: "01-variables/ex-01",
      completed: false,
      attempts: 3,
    };
    expect(calculateXpAward(exerciseXp, progress)).toBe(15);
  });

  it("returns full XP when no prior progress exists", () => {
    expect(calculateXpAward(25, undefined)).toBe(25);
  });
});

describe("isExerciseCompleted", () => {
  it("returns false when no progress exists", () => {
    expect(isExerciseCompleted(undefined)).toBe(false);
  });

  it("returns false when exercise is not completed", () => {
    expect(
      isExerciseCompleted({
        exerciseId: "test",
        completed: false,
        attempts: 0,
      })
    ).toBe(false);
  });

  it("returns true when exercise is completed", () => {
    expect(
      isExerciseCompleted({
        exerciseId: "test",
        completed: true,
        completedAt: "2024-01-01T00:00:00Z",
        attempts: 1,
      })
    ).toBe(true);
  });
});
