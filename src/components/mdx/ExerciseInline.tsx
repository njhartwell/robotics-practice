"use client";

import type { Exercise } from "@/lib/progress/types";
import { ExerciseRouter } from "@/components/exercises/ExerciseRouter";

interface ExerciseInlineProps {
  exercise: Exercise;
}

export function ExerciseInline({ exercise }: ExerciseInlineProps) {
  return <ExerciseRouter exercise={exercise} />;
}
