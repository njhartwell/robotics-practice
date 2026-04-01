"use client";

import { useState, useEffect, useRef } from "react";
import { useProgress } from "@/lib/progress/useProgress";
import { XpToast } from "@/components/gamification/XpToast";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";
import type { Exercise, LessonMeta } from "@/lib/progress/types";
import { calculateXpAward } from "@/lib/gamification/xp";
import Link from "next/link";
import { ChevronLeft, CheckCircle } from "lucide-react";

interface LessonViewProps {
  lesson: LessonMeta;
  exercises: Exercise[];
  children: React.ReactNode;
}

export function LessonView({ lesson, exercises, children }: LessonViewProps) {
  const { progress, isLoaded, awardXp, completeLesson, startLesson } =
    useProgress();
  const [lessonXpAwarded, setLessonXpAwarded] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  // Track the level after initial load so we don't fire on page reload
  const prevLevelRef = useRef<number | null>(null);

  useEffect(() => {
    startLesson(lesson.slug, lesson.part);
  }, [lesson.slug, lesson.part, startLesson]);

  // Initialize prevLevel only after progress is loaded from storage
  useEffect(() => {
    if (isLoaded && prevLevelRef.current === null) {
      prevLevelRef.current = progress.profile.currentLevel;
    }
  }, [isLoaded, progress.profile.currentLevel]);

  // Detect level up only after initial load is settled
  useEffect(() => {
    if (!isLoaded || prevLevelRef.current === null) return;
    if (progress.profile.currentLevel > prevLevelRef.current) {
      setLevelUp(progress.profile.currentLevel);
    }
    prevLevelRef.current = progress.profile.currentLevel;
  }, [isLoaded, progress.profile.currentLevel]);

  const lessonProgress = progress.lessons[lesson.slug];
  const allCompleted =
    exercises.length > 0 &&
    exercises.every((ex) => lessonProgress?.exercises[ex.id]?.completed);
  const isLessonDone = lessonProgress?.completed ?? false;

  useEffect(() => {
    if (allCompleted && !isLessonDone) {
      const xp = calculateXpAward(lesson.xpReward, undefined);
      if (xp > 0) {
        awardXp(xp, `lesson:${lesson.slug}`);
        setLessonXpAwarded(xp);
      }
      completeLesson(lesson.slug);
    }
  }, [allCompleted, isLessonDone, lesson, awardXp, completeLesson]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/${lesson.part}`}
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-3"
        >
          <ChevronLeft size={16} />
          Back to lessons
        </Link>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-muted mt-1">{lesson.description}</p>
      </div>

      <div className="prose prose-sm max-w-none">{children}</div>

      {isLessonDone && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-green-800 font-bold text-lg mb-2">
            <CheckCircle size={24} /> Lesson Complete!
          </div>
          <p className="text-green-700 text-sm">
            You earned {lesson.xpReward} XP for completing this lesson.
          </p>
          <Link
            href={`/${lesson.part}`}
            className="inline-block mt-4 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-light transition-colors"
          >
            Continue Learning
          </Link>
        </div>
      )}

      <XpToast
        amount={lessonXpAwarded}
        onComplete={() => setLessonXpAwarded(null)}
      />
      <LevelUpModal newLevel={levelUp} onClose={() => setLevelUp(null)} />
    </div>
  );
}
