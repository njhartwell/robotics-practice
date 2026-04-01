import type { ExerciseProgress } from "@/lib/progress/types";

export function calculateXpAward(
  exerciseXp: number,
  progress: ExerciseProgress | undefined
): number {
  if (progress?.completed) {
    return 0;
  }
  return exerciseXp;
}

export function isExerciseCompleted(
  progress: ExerciseProgress | undefined
): boolean {
  return progress?.completed ?? false;
}
