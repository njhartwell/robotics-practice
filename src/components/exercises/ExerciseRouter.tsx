"use client";

import type { Exercise } from "@/lib/progress/types";
import { CodeExercise } from "./CodeExercise";
import { MultipleChoiceExercise } from "./MultipleChoiceExercise";
import { FillInTheBlankExercise } from "./FillInTheBlankExercise";

interface ExerciseRouterProps {
  exercise: Exercise;
}

export function ExerciseRouter({ exercise }: ExerciseRouterProps) {
  switch (exercise.type) {
    case "code-completion":
    case "fix-the-bug":
    case "write-from-scratch":
      return <CodeExercise exercise={exercise} />;
    case "multiple-choice":
      return <MultipleChoiceExercise exercise={exercise} />;
    case "fill-in-the-blank":
      return <FillInTheBlankExercise exercise={exercise} />;
    default:
      return (
        <div className="my-6 p-4 border border-red-200 rounded-xl bg-red-50 text-red-800 text-sm">
          Unknown exercise type: {(exercise as Exercise).type}
        </div>
      );
  }
}
