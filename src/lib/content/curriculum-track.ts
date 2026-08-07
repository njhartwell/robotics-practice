import type { LessonMeta } from "@/lib/progress/types";

export type CurriculumTrack = "core" | "further";

const CORE_LESSON_SLUGS = new Set([
  "01-hello-kotlin",
  "02-variables",
  "03-types-and-operations",
  "04-reading-input",
  "05-arithmetic",
  "06-conditionals",
  "07-while-loops",
  "08-for-loops",
  "09-functions-basics",
  "10-functions-return",
  "11-lists",
  "12-mutable-lists",
  "13-strings-revisited",
  "14-arrays",
  "15-classes",
  "16-constructors",
  "17-methods",
  "18-properties",
  "25-inheritance-basics",
  "26-interfaces",
  "29-lambdas",
  "31-collection-operations",
  "32-nullable-types",
  "33-safe-calls",
  "35-enums",
]);

export function getCurriculumTrack(
  lesson: Pick<LessonMeta, "slug">
): CurriculumTrack {
  return CORE_LESSON_SLUGS.has(lesson.slug) ? "core" : "further";
}

export function orderLessonsByTrack(lessons: LessonMeta[]): LessonMeta[] {
  return [
    ...lessons.filter((lesson) => getCurriculumTrack(lesson) === "core"),
    ...lessons.filter((lesson) => getCurriculumTrack(lesson) === "further"),
  ];
}
