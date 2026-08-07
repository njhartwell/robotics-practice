import type { UserProgress, Part } from "./types";
import { createDefaultProgress } from "./types";
import { getLevelForXp } from "@/lib/gamification/levels";

export type ProgressAction =
  | { type: "AWARD_XP"; payload: { amount: number; source: string } }
  | {
      type: "COMPLETE_EXERCISE";
      payload: { lessonSlug: string; exerciseId: string };
    }
  | { type: "COMPLETE_LESSON"; payload: { lessonSlug: string } }
  | { type: "START_LESSON"; payload: { lessonSlug: string; part: Part } }
  | { type: "RESET_PROGRESS" }
  | { type: "UNLOCK_BADGES"; payload: { badgeIds: string[] } }
  | { type: "LOAD_PROGRESS"; payload: { progress: UserProgress } };

export function progressReducer(
  state: UserProgress,
  action: ProgressAction
): UserProgress {
  switch (action.type) {
    case "AWARD_XP": {
      const newXp = state.profile.totalXp + action.payload.amount;
      const newLevel = getLevelForXp(newXp);
      return {
        ...state,
        profile: {
          ...state.profile,
          totalXp: newXp,
          currentLevel: newLevel.level,
        },
        xpHistory: [
          ...state.xpHistory,
          {
            amount: action.payload.amount,
            source: action.payload.source,
            timestamp: new Date().toISOString(),
          },
        ],
      };
    }

    case "COMPLETE_EXERCISE": {
      const { lessonSlug, exerciseId } = action.payload;
      const existingLesson = state.lessons[lessonSlug] ?? {
        lessonSlug,
        part: "playground" as Part,
        started: true,
        startedAt: new Date().toISOString(),
        completed: false,
        exercises: {},
      };

      const existingExercise = existingLesson.exercises[exerciseId];
      const wasAlreadyCompleted = existingExercise?.completed ?? false;

      return {
        ...state,
        profile: {
          ...state.profile,
          exercisesCompleted: wasAlreadyCompleted
            ? state.profile.exercisesCompleted
            : state.profile.exercisesCompleted + 1,
        },
        lessons: {
          ...state.lessons,
          [lessonSlug]: {
            ...existingLesson,
            started: true,
            exercises: {
              ...existingLesson.exercises,
              [exerciseId]: {
                exerciseId,
                completed: true,
                completedAt: new Date().toISOString(),
                attempts: (existingExercise?.attempts ?? 0) + 1,
                bestCode: existingExercise?.bestCode,
              },
            },
          },
        },
      };
    }

    case "COMPLETE_LESSON": {
      const { lessonSlug } = action.payload;
      const lesson = state.lessons[lessonSlug] ?? {
        lessonSlug,
        part: "playground" as Part,
        started: true,
        completed: false,
        exercises: {},
      };

      if (lesson.completed) return state;

      return {
        ...state,
        profile: {
          ...state.profile,
          lessonsCompleted: state.profile.lessonsCompleted + 1,
        },
        lessons: {
          ...state.lessons,
          [lessonSlug]: {
            ...lesson,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        },
      };
    }

    case "START_LESSON": {
      const { lessonSlug, part } = action.payload;
      if (state.lessons[lessonSlug]?.started) {
        return state;
      }
      return {
        ...state,
        lessons: {
          ...state.lessons,
          [lessonSlug]: {
            lessonSlug,
            part,
            started: true,
            startedAt: new Date().toISOString(),
            completed: false,
            exercises: {},
          },
        },
      };
    }

    case "RESET_PROGRESS":
      return createDefaultProgress();

    case "UNLOCK_BADGES": {
      const newBadges = action.payload.badgeIds.filter(
        (id) => !state.badges.includes(id)
      );
      return {
        ...state,
        badges: [...state.badges, ...newBadges],
      };
    }

    case "LOAD_PROGRESS":
      return action.payload.progress;

    default:
      return state;
  }
}
