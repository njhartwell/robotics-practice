import type { LessonMeta, UserProgress } from "./types";

export function buildPreviousLessonMap(
  lessons: readonly Pick<LessonMeta, "slug">[]
): Map<string, string> {
  const previousLessons = new Map<string, string>();

  for (let index = 1; index < lessons.length; index += 1) {
    previousLessons.set(lessons[index].slug, lessons[index - 1].slug);
  }

  return previousLessons;
}

export function canAccessLesson(
  progress: UserProgress,
  requiredLevel: number,
  previousLessonSlug?: string
): boolean {
  if (progress.profile.currentLevel >= requiredLevel) return true;

  return previousLessonSlug
    ? progress.lessons[previousLessonSlug]?.completed === true
    : false;
}
