import type { LessonMeta, Part, Exercise } from "@/lib/progress/types";

export function parseLessonMeta(
  raw: Record<string, unknown>,
  part: Part
): LessonMeta {
  return {
    slug: raw.slug as string,
    part,
    title: raw.title as string,
    description: raw.description as string,
    order: raw.order as number,
    requiredLevel: raw.requiredLevel as number,
    xpReward: raw.xpReward as number,
    estimatedMinutes: raw.estimatedMinutes as number,
    exerciseCount: (raw.exerciseCount as number) ?? 0,
    tags: (raw.tags as string[]) ?? [],
  };
}

export function sortLessons(lessons: LessonMeta[]): LessonMeta[] {
  return [...lessons].sort((a, b) => a.order - b.order);
}

export function getExercisesForLesson(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}
