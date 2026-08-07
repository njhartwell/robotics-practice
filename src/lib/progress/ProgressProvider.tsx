"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Part, UserProgress } from "./types";
import { createDefaultProgress } from "./types";
import { progressReducer } from "./reducer";
import type { StorageAdapter } from "./storage-adapter";
import { LocalStorageAdapter } from "./local-storage-adapter";
import { checkBadgeUnlocks } from "@/lib/gamification/badges";
import { canAccessLesson } from "./lesson-access";

export interface ProgressContextValue {
  progress: UserProgress;
  isLoaded: boolean;
  awardXp: (amount: number, source: string) => void;
  completeExercise: (lessonSlug: string, exerciseId: string) => void;
  completeLesson: (lessonSlug: string) => void;
  startLesson: (lessonSlug: string, part: Part) => void;
  resetProgress: () => void;
  isLessonUnlocked: (
    requiredLevel: number,
    previousLessonSlug?: string
  ) => boolean;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProgressProviderProps {
  children: ReactNode;
  adapter?: StorageAdapter;
}

export function ProgressProvider({
  children,
  adapter,
}: ProgressProviderProps) {
  const storageRef = useRef<StorageAdapter>(
    adapter ?? new LocalStorageAdapter()
  );
  const [progress, dispatch] = useReducer(
    progressReducer,
    createDefaultProgress()
  );
  const isLoadedRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load on mount
  useEffect(() => {
    let isActive = true;

    async function loadProgress() {
      try {
        const saved = await storageRef.current.load();
        if (isActive && saved) {
          dispatch({ type: "LOAD_PROGRESS", payload: { progress: saved } });
        }
      } catch (error) {
        console.warn(
          "Could not load saved tutorial progress; starting with local defaults.",
          error
        );
      } finally {
        if (isActive) {
          isLoadedRef.current = true;
          setIsLoaded(true);
        }
      }
    }

    void loadProgress();

    return () => {
      isActive = false;
    };
  }, []);

  // Auto-save on changes (skip initial load)
  useEffect(() => {
    if (isLoadedRef.current) {
      storageRef.current.save(progress);
    }
  }, [progress]);

  const awardXp = useCallback((amount: number, source: string) => {
    dispatch({ type: "AWARD_XP", payload: { amount, source } });
  }, []);

  const completeExercise = useCallback(
    (lessonSlug: string, exerciseId: string) => {
      dispatch({
        type: "COMPLETE_EXERCISE",
        payload: { lessonSlug, exerciseId },
      });
    },
    []
  );

  const completeLesson = useCallback((lessonSlug: string) => {
    dispatch({ type: "COMPLETE_LESSON", payload: { lessonSlug } });
  }, []);

  const startLesson = useCallback((lessonSlug: string, part: Part) => {
    dispatch({ type: "START_LESSON", payload: { lessonSlug, part } });
  }, []);

  const resetProgress = useCallback(() => {
    dispatch({ type: "RESET_PROGRESS" });
    storageRef.current.clear();
  }, []);

  const isLessonUnlocked = useCallback(
    (requiredLevel: number, previousLessonSlug?: string) => {
      return canAccessLesson(progress, requiredLevel, previousLessonSlug);
    },
    [progress]
  );

  // Check for new badges after state changes
  useEffect(() => {
    if (!isLoadedRef.current) return;
    const newBadges = checkBadgeUnlocks(progress);
    if (newBadges.length > 0) {
      dispatch({ type: "UNLOCK_BADGES", payload: { badgeIds: newBadges } });
    }
  }, [progress]);

  const value: ProgressContextValue = {
    progress,
    isLoaded,
    awardXp,
    completeExercise,
    completeLesson,
    startLesson,
    resetProgress,
    isLessonUnlocked,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}
