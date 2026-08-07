import { describe, expect, it } from "vitest";
import { buildPreviousLessonMap, canAccessLesson } from "./lesson-access";
import { createDefaultProgress } from "./types";

describe("lesson access", () => {
  it("unlocks a lesson when the student meets its required level", () => {
    const progress = createDefaultProgress();
    progress.profile.currentLevel = 2;

    expect(canAccessLesson(progress, 2, "14-arrays")).toBe(true);
  });

  it("unlocks the next lesson when the preceding lesson is complete", () => {
    const progress = createDefaultProgress();
    progress.lessons["14-arrays"] = {
      lessonSlug: "14-arrays",
      part: "playground",
      started: true,
      completed: true,
      exercises: {},
    };

    expect(canAccessLesson(progress, 2, "14-arrays")).toBe(true);
  });

  it("keeps a lesson locked when neither requirement is satisfied", () => {
    const progress = createDefaultProgress();

    expect(canAccessLesson(progress, 2, "14-arrays")).toBe(false);
    expect(canAccessLesson(progress, 2)).toBe(false);
  });

  it("builds prerequisites from the supplied learning-path order", () => {
    const previousLessons = buildPreviousLessonMap([
      { slug: "14-arrays" },
      { slug: "15-classes" },
      { slug: "16-constructors" },
    ]);

    expect(previousLessons.get("14-arrays")).toBeUndefined();
    expect(previousLessons.get("15-classes")).toBe("14-arrays");
    expect(previousLessons.get("16-constructors")).toBe("15-classes");
  });
});
