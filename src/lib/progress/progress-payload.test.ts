import { describe, expect, it } from "vitest";
import { createDefaultProgress } from "./types";
import { isUserProgress } from "./progress-payload";

describe("isUserProgress", () => {
  it("accepts a complete progress document", () => {
    expect(isUserProgress(createDefaultProgress())).toBe(true);
  });

  it("rejects malformed progress documents", () => {
    expect(isUserProgress({ version: 1, profile: {} })).toBe(false);
    expect(
      isUserProgress({
        ...createDefaultProgress(),
        lessons: { bad: { lessonSlug: "bad" } },
      })
    ).toBe(false);
    expect(isUserProgress(null)).toBe(false);
  });
});
