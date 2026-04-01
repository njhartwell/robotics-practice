import { describe, it, expect } from "vitest";
import { LEVELS, getLevelForXp, getXpToNextLevel } from "./levels";

describe("LEVELS", () => {
  it("has 11 levels (0-10)", () => {
    expect(LEVELS).toHaveLength(11);
    expect(LEVELS[0].level).toBe(0);
    expect(LEVELS[10].level).toBe(10);
  });

  it("starts at 0 XP", () => {
    expect(LEVELS[0].xpRequired).toBe(0);
  });

  it("ends at 5000 XP", () => {
    expect(LEVELS[10].xpRequired).toBe(5000);
  });

  it("has strictly increasing XP thresholds", () => {
    for (let i = 1; i < LEVELS.length; i++) {
      expect(LEVELS[i].xpRequired).toBeGreaterThan(LEVELS[i - 1].xpRequired);
    }
  });

  it("has FRC-themed names", () => {
    expect(LEVELS[0].name).toBe("Rookie");
    expect(LEVELS[10].name).toBe("FRC Legend");
  });
});

describe("getLevelForXp", () => {
  it("returns level 0 for 0 XP", () => {
    expect(getLevelForXp(0)).toEqual(LEVELS[0]);
  });

  it("returns level 0 for 99 XP", () => {
    expect(getLevelForXp(99)).toEqual(LEVELS[0]);
  });

  it("returns level 1 for exactly 100 XP", () => {
    expect(getLevelForXp(100)).toEqual(LEVELS[1]);
  });

  it("returns level 10 for 5000 XP", () => {
    expect(getLevelForXp(5000)).toEqual(LEVELS[10]);
  });

  it("returns level 10 for XP beyond 5000", () => {
    expect(getLevelForXp(9999)).toEqual(LEVELS[10]);
  });

  it("returns level 5 for 1200 XP (exact threshold)", () => {
    expect(getLevelForXp(1200)).toEqual(LEVELS[5]);
  });

  it("returns level 4 for 1199 XP (one below threshold)", () => {
    expect(getLevelForXp(1199)).toEqual(LEVELS[4]);
  });
});

describe("getXpToNextLevel", () => {
  it("returns progress toward level 1 when at 0 XP", () => {
    const result = getXpToNextLevel(0);
    expect(result.currentLevelXp).toBe(0);
    expect(result.nextLevelXp).toBe(100);
    expect(result.progress).toBe(0);
  });

  it("returns 50% progress when halfway to level 1", () => {
    const result = getXpToNextLevel(50);
    expect(result.currentLevelXp).toBe(0);
    expect(result.nextLevelXp).toBe(100);
    expect(result.progress).toBeCloseTo(0.5);
  });

  it("returns 0% progress at exact level boundary", () => {
    const result = getXpToNextLevel(100);
    expect(result.currentLevelXp).toBe(100);
    expect(result.nextLevelXp).toBe(250);
    expect(result.progress).toBe(0);
  });

  it("returns 100% progress at max level", () => {
    const result = getXpToNextLevel(5000);
    expect(result.currentLevelXp).toBe(5000);
    expect(result.nextLevelXp).toBe(5000);
    expect(result.progress).toBe(1);
  });

  it("returns 100% progress beyond max level", () => {
    const result = getXpToNextLevel(9999);
    expect(result.progress).toBe(1);
  });
});
