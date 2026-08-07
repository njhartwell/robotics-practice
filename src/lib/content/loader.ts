import type { LessonMeta, Part, Exercise } from "@/lib/progress/types";

function requireString(
  raw: Record<string, unknown>,
  key: string,
  source: string
): string {
  const value = raw[key];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${source}: ${key} must be a non-empty string`);
  }
  return value;
}

function requireNumber(
  raw: Record<string, unknown>,
  key: string,
  source: string
): number {
  const value = raw[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${source}: ${key} must be a finite number`);
  }
  return value;
}

export function parseLessonMeta(
  raw: Record<string, unknown>,
  part: Part,
  source = "lesson metadata"
): LessonMeta {
  const tags = raw.tags ?? [];
  if (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string")) {
    throw new Error(`${source}: tags must be an array of strings`);
  }

  return {
    slug: requireString(raw, "slug", source),
    part,
    section: requireString(raw, "section", source),
    sectionTitle: requireString(raw, "sectionTitle", source),
    sectionOrder: requireNumber(raw, "sectionOrder", source),
    title: requireString(raw, "title", source),
    description: requireString(raw, "description", source),
    order: requireNumber(raw, "order", source),
    requiredLevel: requireNumber(raw, "requiredLevel", source),
    xpReward: requireNumber(raw, "xpReward", source),
    estimatedMinutes: requireNumber(raw, "estimatedMinutes", source),
    exerciseCount:
      raw.exerciseCount === undefined
        ? 0
        : requireNumber(raw, "exerciseCount", source),
    tags,
  };
}

export function parseExercise(
  raw: Record<string, unknown>,
  source = "exercise"
): Exercise {
  const type = requireString(raw, "type", source);
  const base = {
    id: requireString(raw, "id", source),
    lessonSlug: requireString(raw, "lessonSlug", source),
    type,
    order: requireNumber(raw, "order", source),
    title: requireString(raw, "title", source),
    instructions: requireString(raw, "instructions", source),
    hint: typeof raw.hint === "string" ? raw.hint : undefined,
    xpReward: requireNumber(raw, "xpReward", source),
  };

  if (
    type === "code-completion" ||
    type === "fix-the-bug" ||
    type === "write-from-scratch"
  ) {
    const validationMode = requireString(raw, "validationMode", source);
    if (validationMode !== "output" && validationMode !== "test") {
      throw new Error(`${source}: validationMode must be output or test`);
    }
    if (validationMode === "output" && typeof raw.expectedOutput !== "string") {
      throw new Error(`${source}: output exercises require expectedOutput`);
    }
    if (validationMode === "test" && typeof raw.testCode !== "string") {
      throw new Error(`${source}: test exercises require testCode`);
    }

    return {
      ...base,
      type,
      starterCode: requireString(raw, "starterCode", source),
      solutionCode: requireString(raw, "solutionCode", source),
      validationMode,
      expectedOutput:
        typeof raw.expectedOutput === "string" ? raw.expectedOutput : undefined,
      testCode: typeof raw.testCode === "string" ? raw.testCode : undefined,
      hiddenPreamble:
        typeof raw.hiddenPreamble === "string" ? raw.hiddenPreamble : undefined,
      hiddenPostamble:
        typeof raw.hiddenPostamble === "string"
          ? raw.hiddenPostamble
          : undefined,
    };
  }

  if (type === "multiple-choice") {
    if (
      !Array.isArray(raw.options) ||
      !raw.options.every(
        (option) =>
          typeof option === "object" &&
          option !== null &&
          typeof (option as Record<string, unknown>).id === "string" &&
          typeof (option as Record<string, unknown>).text === "string"
      )
    ) {
      throw new Error(`${source}: multiple-choice options are invalid`);
    }

    const correctOptionId = requireString(raw, "correctOptionId", source);
    if (
      !raw.options.some(
        (option) =>
          (option as Record<string, unknown>).id === correctOptionId
      )
    ) {
      throw new Error(`${source}: correctOptionId must match an option`);
    }

    return {
      ...base,
      type,
      options: raw.options as { id: string; text: string }[],
      correctOptionId,
      explanation: requireString(raw, "explanation", source),
    };
  }

  if (type === "fill-in-the-blank") {
    if (
      !Array.isArray(raw.acceptedAnswers) ||
      raw.acceptedAnswers.length === 0 ||
      !raw.acceptedAnswers.every(
        (answer) => typeof answer === "string" && answer.trim() !== ""
      )
    ) {
      throw new Error(`${source}: acceptedAnswers must contain strings`);
    }

    return {
      ...base,
      type,
      prompt: requireString(raw, "prompt", source),
      acceptedAnswers: raw.acceptedAnswers,
      explanation: requireString(raw, "explanation", source),
    };
  }

  throw new Error(`${source}: unknown exercise type ${type}`);
}

export function sortLessons(lessons: LessonMeta[]): LessonMeta[] {
  return [...lessons].sort(
    (a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order
  );
}

export function getExercisesForLesson(exercises: Exercise[]): Exercise[] {
  return [...exercises].sort((a, b) => a.order - b.order);
}
