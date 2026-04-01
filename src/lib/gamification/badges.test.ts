import { describe, it, expect } from "vitest";
import { checkBadgeUnlocks, BADGE_DEFINITIONS } from "./badges";
import type { UserProgress } from "@/lib/progress/types";
import { createDefaultProgress } from "@/lib/progress/types";

describe("BADGE_DEFINITIONS", () => {
  it("has badge definitions", () => {
    expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
  });

  it("each badge has an id, name, description, and check function", () => {
    for (const badge of BADGE_DEFINITIONS) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(typeof badge.check).toBe("function");
    }
  });
});

describe("checkBadgeUnlocks", () => {
  it("returns empty array for fresh progress", () => {
    const progress = createDefaultProgress();
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).toEqual([]);
  });

  it("returns 'first-exercise' when first exercise completed", () => {
    const progress = createDefaultProgress();
    progress.profile.exercisesCompleted = 1;
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).toContain("first-exercise");
  });

  it("returns 'first-lesson' when first lesson completed", () => {
    const progress = createDefaultProgress();
    progress.profile.lessonsCompleted = 1;
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).toContain("first-lesson");
  });

  it("does not return badges already earned", () => {
    const progress = createDefaultProgress();
    progress.profile.exercisesCompleted = 1;
    progress.badges = ["first-exercise"];
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).not.toContain("first-exercise");
  });

  it("returns 'streak-3' for 3-day streak", () => {
    const progress = createDefaultProgress();
    progress.profile.currentStreak = 3;
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).toContain("streak-3");
  });

  it("returns 'streak-7' for 7-day streak", () => {
    const progress = createDefaultProgress();
    progress.profile.currentStreak = 7;
    const newBadges = checkBadgeUnlocks(progress);
    expect(newBadges).toContain("streak-7");
  });
});
