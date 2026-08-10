import type { UserProgress } from "./types";

export function isUserProgress(value: unknown): value is UserProgress {
  if (!value || typeof value !== "object") return false;
  const progress = value as Partial<UserProgress>;
  return (
    progress.version === 1 &&
    isUserProfile(progress.profile) &&
    isRecord(progress.lessons) &&
    Object.values(progress.lessons).every(isLessonProgress) &&
    Array.isArray(progress.badges) &&
    progress.badges.every((badge) => typeof badge === "string") &&
    Array.isArray(progress.xpHistory) &&
    progress.xpHistory.every(isXpEvent)
  );
}

function isUserProfile(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.displayName === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.totalXp === "number" &&
    typeof value.currentLevel === "number" &&
    typeof value.currentStreak === "number" &&
    typeof value.lastActiveDate === "string" &&
    typeof value.lessonsCompleted === "number" &&
    typeof value.exercisesCompleted === "number"
  );
}

function isLessonProgress(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.exercises)) return false;
  return (
    typeof value.lessonSlug === "string" &&
    (value.part === "playground" || value.part === "ide-projects") &&
    typeof value.started === "boolean" &&
    typeof value.completed === "boolean" &&
    Object.values(value.exercises).every(isExerciseProgress)
  );
}

function isExerciseProgress(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.exerciseId === "string" &&
    typeof value.completed === "boolean" &&
    typeof value.attempts === "number"
  );
}

function isXpEvent(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.amount === "number" &&
    typeof value.source === "string" &&
    typeof value.timestamp === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
