import { describe, it, expect } from "vitest";
import { LEVELS, getLevelForXp, getXpToNextLevel } from "./levels";

describe("LEVELS", () => {
  it("has 20 levels (0-19)", () => {
    expect(LEVELS).toHaveLength(20);
    expect(LEVELS[0].level).toBe(0);
    expect(LEVELS[19].level).toBe(19);
  });

  it("starts at 0 XP", () => {
    expect(LEVELS[0].xpRequired).toBe(0);
  });

  it("ends at 8500 XP", () => {
    expect(LEVELS[19].xpRequired).toBe(8500);
  });

  it("has strictly increasing XP thresholds", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it("has themed names", () => {
    expect(LEVELS[0].name).toBe("Rookie");
    expect(LEVELS[19].name).toBe("FRC Legend");
  });
});

describe("getLevelForXp", () => {
  it("returns level 0 for 0 XP", () => {
    expect(getLevelForXp(0)).toEqual(LEVELS[0]);
  });

  it("returns level 0 for 74 XP", () => {
    expect(getLevelForXp(74)).toEqual(LEVELS[0]);
  });

  it("returns level 1 for exactly 75 XP", () => {
    expect(getLevelForXp(75)).toEqual(LEVELS[1]);
  });

  it("returns max level for 8500 XP", () => {
    expect(getLevelForXp(8500)).toEqual(LEVELS[19]);
  });

  it("returns max level for XP beyond 8500", () => {
    expect(getLevelForXp(99999)).toEqual(LEVELS[19]);
  });

  it("returns level 5 for 1000 XP (exact threshold)", () => {
    expect(getLevelForXp(1000)).toEqual(LEVELS[5]);
  });

  it("returns level 4 for 999 XP (one below threshold)", () => {
    expect(getLevelForXp(999)).toEqual(LEVELS[4]);
  });
});

describe("getXpToNextLevel", () => {
  it("returns progress toward level 1 when at 0 XP", () => {
    const result = getXpToNextLevel(0);
    expect(result.currentLevelXp).toBe(0);
    expect(result.nextLevelXp).toBe(75);
    expect(result.progress).toBe(0);
  });

  it("returns 50% progress when halfway to level 1", () => {
    const result = getXpToNextLevel(37);
    expect(result.currentLevelXp).toBe(0);
    expect(result.nextLevelXp).toBe(75);
    expect(result.progress).toBeCloseTo(37 / 75);
  });

  it("returns 0% progress at exact level boundary", () => {
    const result = getXpToNextLevel(75);
    expect(result.currentLevelXp).toBe(75);
    expect(result.nextLevelXp).toBe(200);
    expect(result.progress).toBe(0);
  });

  it("returns 100% progress at max level", () => {
    const result = getXpToNextLevel(8500);
    expect(result.currentLevelXp).toBe(8500);
    expect(result.nextLevelXp).toBe(8500);
    expect(result.progress).toBe(1);
  });

  it("returns 100% progress beyond max level", () => {
    const result = getXpToNextLevel(99999);
    expect(result.progress).toBe(1);
  });
});
