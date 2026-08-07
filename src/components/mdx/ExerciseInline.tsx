"use client";

import type { ClientExercise } from "@/lib/progress/types";
import { ExerciseRouter } from "@/components/exercises/ExerciseRouter";

interface ExerciseInlineProps {
  exercise: ClientExercise;
}

export function ExerciseInline({ exercise }: ExerciseInlineProps) {
  return <ExerciseRouter exercise={exercise} />;
}
