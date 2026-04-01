import { describe, it, expect } from "vitest";
import { parseLessonMeta, sortLessons, getExercisesForLesson } from "./loader";
import type { LessonMeta } from "@/lib/progress/types";

describe("parseLessonMeta", () => {
  it("parses a valid meta.json object", () => {
    const raw = {
      slug: "01-hello-kotlin",
      section: "getting-started",
      sectionTitle: "Getting Started",
      sectionOrder: 1,
      title: "Hello Kotlin",
      description: "Your first Kotlin program",
      order: 1,
      requiredLevel: 0,
      xpReward: 50,
      estimatedMinutes: 5,
      tags: ["basics"],
    };

    const result = parseLessonMeta(raw, "playground");
    expect(result).toEqual({
      slug: "01-hello-kotlin",
      part: "playground",
      section: "getting-started",
      sectionTitle: "Getting Started",
      sectionOrder: 1,
      title: "Hello Kotlin",
      description: "Your first Kotlin program",
      order: 1,
      requiredLevel: 0,
      xpReward: 50,
      estimatedMinutes: 5,
      exerciseCount: 0,
      tags: ["basics"],
    });
  });

  it("defaults exerciseCount to 0", () => {
    const raw = {
      slug: "01-hello-kotlin",
      section: "getting-started",
      sectionTitle: "Getting Started",
      sectionOrder: 1,
      title: "Hello Kotlin",
      description: "Test",
      order: 1,
      requiredLevel: 0,
      xpReward: 50,
      estimatedMinutes: 5,
      tags: [],
    };

    const result = parseLessonMeta(raw, "playground");
    expect(result.exerciseCount).toBe(0);
  });
});

function makeMeta(overrides: Partial<LessonMeta>): LessonMeta {
  return {
    slug: "test",
    part: "playground",
    section: "test-section",
    sectionTitle: "Test",
    sectionOrder: 1,
    title: "",
    description: "",
    order: 1,
    requiredLevel: 0,
    xpReward: 0,
    estimatedMinutes: 0,
    exerciseCount: 0,
    tags: [],
    ...overrides,
  };
}

describe("sortLessons", () => {
  it("sorts lessons by sectionOrder then order ascending", () => {
    const lessons: LessonMeta[] = [
      makeMeta({ slug: "02-variables", sectionOrder: 1, order: 2 }),
      makeMeta({ slug: "01-hello", sectionOrder: 1, order: 1 }),
      makeMeta({ slug: "07-while", sectionOrder: 2, order: 1 }),
    ];

    const sorted = sortLessons(lessons);
    expect(sorted[0].slug).toBe("01-hello");
    expect(sorted[1].slug).toBe("02-variables");
    expect(sorted[2].slug).toBe("07-while");
  });

  it("does not mutate original array", () => {
    const lessons: LessonMeta[] = [
      makeMeta({ slug: "02", order: 2 }),
      makeMeta({ slug: "01", order: 1 }),
    ];

    sortLessons(lessons);
    expect(lessons[0].slug).toBe("02");
  });
});

describe("getExercisesForLesson", () => {
  it("returns exercises sorted by order", () => {
    const exercises = [
      { id: "ex-02", order: 2, title: "Second" },
      { id: "ex-01", order: 1, title: "First" },
    ];

    const sorted = getExercisesForLesson(exercises as any);
    expect(sorted[0].id).toBe("ex-01");
    expect(sorted[1].id).toBe("ex-02");
  });
});
