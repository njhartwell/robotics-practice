import { describe, it, expect } from "vitest";
import { progressReducer, type ProgressAction } from "./reducer";
import { createDefaultProgress } from "./types";

describe("progressReducer", () => {
  describe("AWARD_XP", () => {
    it("adds XP to totalXp", () => {
      const state = createDefaultProgress();
      const action: ProgressAction = {
        type: "AWARD_XP",
        payload: { amount: 25, source: "exercise:01/ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.profile.totalXp).toBe(25);
    });

    it("updates currentLevel when threshold crossed", () => {
      const state = createDefaultProgress();
      state.profile.totalXp = 90;

      const action: ProgressAction = {
        type: "AWARD_XP",
        payload: { amount: 15, source: "exercise:01/ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.profile.totalXp).toBe(105);
      expect(next.profile.currentLevel).toBe(1);
    });

    it("appends to xpHistory", () => {
      const state = createDefaultProgress();
      const action: ProgressAction = {
        type: "AWARD_XP",
        payload: { amount: 10, source: "exercise:01/ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.xpHistory).toHaveLength(1);
      expect(next.xpHistory[0].amount).toBe(10);
      expect(next.xpHistory[0].source).toBe("exercise:01/ex-01");
    });

    it("does not mutate original state", () => {
      const state = createDefaultProgress();
      const action: ProgressAction = {
        type: "AWARD_XP",
        payload: { amount: 25, source: "test" },
      };

      progressReducer(state, action);
      expect(state.profile.totalXp).toBe(0);
    });
  });

  describe("COMPLETE_EXERCISE", () => {
    it("marks exercise as completed", () => {
      const state = createDefaultProgress();
      state.lessons["01-hello"] = {
        lessonSlug: "01-hello",
        part: "playground",
        started: true,
        completed: false,
        exercises: {},
      };

      const action: ProgressAction = {
        type: "COMPLETE_EXERCISE",
        payload: { lessonSlug: "01-hello", exerciseId: "ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.lessons["01-hello"].exercises["ex-01"].completed).toBe(true);
      expect(next.lessons["01-hello"].exercises["ex-01"].completedAt).toBeTruthy();
    });

    it("increments attempts", () => {
      const state = createDefaultProgress();
      state.lessons["01-hello"] = {
        lessonSlug: "01-hello",
        part: "playground",
        started: true,
        completed: false,
        exercises: {
          "ex-01": {
            exerciseId: "ex-01",
            completed: false,
            attempts: 2,
          },
        },
      };

      const action: ProgressAction = {
        type: "COMPLETE_EXERCISE",
        payload: { lessonSlug: "01-hello", exerciseId: "ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.lessons["01-hello"].exercises["ex-01"].attempts).toBe(3);
    });

    it("increments exercisesCompleted counter", () => {
      const state = createDefaultProgress();
      state.lessons["01-hello"] = {
        lessonSlug: "01-hello",
        part: "playground",
        started: true,
        completed: false,
        exercises: {},
      };

      const action: ProgressAction = {
        type: "COMPLETE_EXERCISE",
        payload: { lessonSlug: "01-hello", exerciseId: "ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.profile.exercisesCompleted).toBe(1);
    });

    it("creates lesson entry if it does not exist", () => {
      const state = createDefaultProgress();

      const action: ProgressAction = {
        type: "COMPLETE_EXERCISE",
        payload: { lessonSlug: "01-hello", exerciseId: "ex-01" },
      };

      const next = progressReducer(state, action);
      expect(next.lessons["01-hello"]).toBeDefined();
      expect(next.lessons["01-hello"].started).toBe(true);
    });
  });

  describe("COMPLETE_LESSON", () => {
    it("marks lesson as completed", () => {
      const state = createDefaultProgress();
      state.lessons["01-hello"] = {
        lessonSlug: "01-hello",
        part: "playground",
        started: true,
        completed: false,
        exercises: {},
      };

      const action: ProgressAction = {
        type: "COMPLETE_LESSON",
        payload: { lessonSlug: "01-hello" },
      };

      const next = progressReducer(state, action);
      expect(next.lessons["01-hello"].completed).toBe(true);
      expect(next.lessons["01-hello"].completedAt).toBeTruthy();
    });

    it("increments lessonsCompleted counter", () => {
      const state = createDefaultProgress();
      state.lessons["01-hello"] = {
        lessonSlug: "01-hello",
        part: "playground",
        started: true,
        completed: false,
        exercises: {},
      };

      const action: ProgressAction = {
        type: "COMPLETE_LESSON",
        payload: { lessonSlug: "01-hello" },
      };

      const next = progressReducer(state, action);
      expect(next.profile.lessonsCompleted).toBe(1);
    });
  });

  describe("START_LESSON", () => {
    it("creates and marks lesson as started", () => {
      const state = createDefaultProgress();

      const action: ProgressAction = {
        type: "START_LESSON",
        payload: { lessonSlug: "01-hello", part: "playground" },
      };

      const next = progressReducer(state, action);
      expect(next.lessons["01-hello"].started).toBe(true);
      expect(next.lessons["01-hello"].startedAt).toBeTruthy();
    });
  });

  describe("RESET_PROGRESS", () => {
    it("returns default progress", () => {
      const state = createDefaultProgress();
      state.profile.totalXp = 500;
      state.badges = ["first-exercise"];

      const action: ProgressAction = { type: "RESET_PROGRESS" };

      const next = progressReducer(state, action);
      expect(next.profile.totalXp).toBe(0);
      expect(next.badges).toEqual([]);
    });
  });

  describe("UNLOCK_BADGES", () => {
    it("adds new badge IDs", () => {
      const state = createDefaultProgress();

      const action: ProgressAction = {
        type: "UNLOCK_BADGES",
        payload: { badgeIds: ["first-exercise", "first-lesson"] },
      };

      const next = progressReducer(state, action);
      expect(next.badges).toEqual(["first-exercise", "first-lesson"]);
    });

    it("does not duplicate existing badges", () => {
      const state = createDefaultProgress();
      state.badges = ["first-exercise"];

      const action: ProgressAction = {
        type: "UNLOCK_BADGES",
        payload: { badgeIds: ["first-exercise", "first-lesson"] },
      };

      const next = progressReducer(state, action);
      expect(next.badges).toEqual(["first-exercise", "first-lesson"]);
    });
  });
});
