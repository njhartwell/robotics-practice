import { describe, it, expect } from "vitest";
import { parseLessonMeta, sortLessons, getExercisesForLesson } from "./loader";
import type { LessonMeta } from "@/lib/progress/types";

describe("parseLessonMeta", () => {
  it("parses a valid meta.json object", () => {
    const raw = {
      slug: "01-hello-kotlin",
      title: "Hello Kotlin",
      description: "Your first Kotlin program",
      order: 1,
      requiredLevel: 0,
      xpReward: 50,
      estimatedMinutes: 5,
      tags: ["basics"],
    };

    const result = parseLessonMeta(raw, "part1");
    expect(result).toEqual({
      slug: "01-hello-kotlin",
      part: "part1",
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
      title: "Hello Kotlin",
      description: "Test",
      order: 1,
      requiredLevel: 0,
      xpReward: 50,
      estimatedMinutes: 5,
      tags: [],
    };

    const result = parseLessonMeta(raw, "part1");
    expect(result.exerciseCount).toBe(0);
  });
});

describe("sortLessons", () => {
  it("sorts lessons by order ascending", () => {
    const lessons: LessonMeta[] = [
      {
        slug: "02-variables",
        part: "part1",
        title: "Variables",
        description: "",
        order: 2,
        requiredLevel: 0,
        xpReward: 50,
        estimatedMinutes: 5,
        exerciseCount: 0,
        tags: [],
      },
      {
        slug: "01-hello",
        part: "part1",
        title: "Hello",
        description: "",
        order: 1,
        requiredLevel: 0,
        xpReward: 50,
        estimatedMinutes: 5,
        exerciseCount: 0,
        tags: [],
      },
    ];

    const sorted = sortLessons(lessons);
    expect(sorted[0].slug).toBe("01-hello");
    expect(sorted[1].slug).toBe("02-variables");
  });

  it("does not mutate original array", () => {
    const lessons: LessonMeta[] = [
      {
        slug: "02",
        part: "part1",
        title: "",
        description: "",
        order: 2,
        requiredLevel: 0,
        xpReward: 0,
        estimatedMinutes: 0,
        exerciseCount: 0,
        tags: [],
      },
      {
        slug: "01",
        part: "part1",
        title: "",
        description: "",
        order: 1,
        requiredLevel: 0,
        xpReward: 0,
        estimatedMinutes: 0,
        exerciseCount: 0,
        tags: [],
      },
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
