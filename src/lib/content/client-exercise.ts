import type {
  ClientExercise,
  CodeExercise,
  Exercise,
} from "@/lib/progress/types";

const CODE_EXERCISE_TYPES = new Set([
  "code-completion",
  "fix-the-bug",
  "write-from-scratch",
]);

export function isCodeExercise(exercise: Exercise): exercise is CodeExercise {
  return CODE_EXERCISE_TYPES.has(exercise.type);
}

/** Strip private grader inputs before an exercise is serialized to the browser. */
export function toClientExercise(exercise: Exercise): ClientExercise {
  if (!isCodeExercise(exercise)) return exercise;

  return {
    id: exercise.id,
    lessonSlug: exercise.lessonSlug,
    type: exercise.type,
    order: exercise.order,
    title: exercise.title,
    instructions: exercise.instructions,
    hint: exercise.hint,
    xpReward: exercise.xpReward,
    starterCode: exercise.starterCode,
    validationMode: exercise.validationMode,
  };
}
