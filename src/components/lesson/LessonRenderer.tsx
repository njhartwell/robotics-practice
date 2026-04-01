"use client";

import { useState, useEffect, useCallback } from "react";
import { ExerciseRouter } from "@/components/exercises/ExerciseRouter";
import { useProgress } from "@/lib/progress/useProgress";
import { XpToast } from "@/components/gamification/XpToast";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";
import type { Exercise, LessonMeta } from "@/lib/progress/types";
import { calculateXpAward } from "@/lib/gamification/xp";
import Link from "next/link";
import { ChevronLeft, CheckCircle, PartyPopper } from "lucide-react";

interface LessonRendererProps {
  lesson: LessonMeta;
  exercises: Exercise[];
  mdxContent: React.ReactNode;
}

export function LessonRenderer({
  lesson,
  exercises,
  mdxContent,
}: LessonRendererProps) {
  const { progress, awardXp, completeLesson, startLesson } = useProgress();
  const [lessonXpAwarded, setLessonXpAwarded] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [prevLevel, setPrevLevel] = useState(progress.profile.currentLevel);

  // Start lesson on mount
  useEffect(() => {
    startLesson(lesson.slug, lesson.part);
  }, [lesson.slug, lesson.part, startLesson]);

  // Detect level up
  useEffect(() => {
    if (progress.profile.currentLevel > prevLevel) {
      setLevelUp(progress.profile.currentLevel);
    }
    setPrevLevel(progress.profile.currentLevel);
  }, [progress.profile.currentLevel, prevLevel]);

  const lessonProgress = progress.lessons[lesson.slug];
  const allCompleted =
    exercises.length > 0 &&
    exercises.every(
      (ex) => lessonProgress?.exercises[ex.id]?.completed
    );
  const isLessonDone = lessonProgress?.completed ?? false;

  // Auto-complete lesson when all exercises done
  useEffect(() => {
    if (allCompleted && !isLessonDone) {
      const xp = calculateXpAward(
        lesson.xpReward,
        undefined // lesson bonus always awards
      );
      if (xp > 0) {
        awardXp(xp, `lesson:${lesson.slug}`);
        setLessonXpAwarded(xp);
      }
      completeLesson(lesson.slug);
    }
  }, [allCompleted, isLessonDone, lesson, awardXp, completeLesson]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
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

      {/* MDX Content + Exercises */}
      <div className="prose prose-sm max-w-none">{mdxContent}</div>

      {/* Exercise list (rendered below MDX for now) */}
      {exercises.length > 0 && (
        <div className="mt-8 space-y-2">
          {exercises.map((exercise) => (
            <ExerciseRouter key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}

      {/* Lesson complete banner */}
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
