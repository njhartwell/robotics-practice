import { describe, expect, it } from "vitest";
import { orderLessonsByTrack } from "./curriculum-track";
import type { LessonMeta } from "@/lib/progress/types";

function lesson(slug: string, order: number): LessonMeta {
  return {
    slug,
    part: "playground",
    section: "test",
    sectionTitle: "Test",
    sectionOrder: 1,
    title: slug,
    description: slug,
    order,
    requiredLevel: 0,
    xpReward: 0,
    estimatedMinutes: 1,
    exerciseCount: 0,
    tags: [],
  };
}

describe("curriculum track order", () => {
  it("places the complete core path before further topics", () => {
    const lessons = [
      lesson("18-properties", 18),
      lesson("19-searching", 19),
      lesson("25-inheritance-basics", 25),
    ];

    expect(orderLessonsByTrack(lessons).map((item) => item.slug)).toEqual([
      "18-properties",
      "25-inheritance-basics",
      "19-searching",
    ]);
  });
});
