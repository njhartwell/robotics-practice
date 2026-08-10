"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/useProgress";
import type { LessonMeta } from "@/lib/progress/types";
import { calculateXpAward } from "@/lib/gamification/xp";
import Link from "next/link";
import { ChevronLeft, CheckCircle, Lock } from "lucide-react";
import { LessonStepper } from "./LessonStepper";
import type { LessonStep } from "@/lib/content/lesson-steps";
import { LessonFeedback } from "@/components/feedback/LessonFeedback";

interface LessonViewProps {
  lesson: LessonMeta;
  exerciseIds: string[];
  previousLesson?: Pick<LessonMeta, "slug" | "part" | "title">;
  nextLesson?: Pick<LessonMeta, "slug" | "part" | "title">;
  steps: LessonStep[];
}

export function LessonView({
  lesson,
  exerciseIds,
  previousLesson,
  nextLesson,
  steps,
}: LessonViewProps) {
  const {
    progress,
    isLoaded,
    awardXp,
    completeLesson,
    startLesson,
    isLessonUnlocked,
  } = useProgress();
  const isUnlocked = isLessonUnlocked(
    lesson.requiredLevel,
    previousLesson?.slug
  );

  useEffect(() => {
    if (isLoaded && isUnlocked) {
      startLesson(lesson.slug, lesson.part);
    }
  }, [isLoaded, isUnlocked, lesson.slug, lesson.part, startLesson]);

  const lessonProgress = progress.lessons[lesson.slug];
  const allCompleted =
    exerciseIds.length > 0 &&
    exerciseIds.every((exerciseId) =>
      Boolean(lessonProgress?.exercises[exerciseId]?.completed)
    );
  const isLessonDone = lessonProgress?.completed ?? false;
  const completedExerciseIds = exerciseIds.filter((exerciseId) =>
    Boolean(lessonProgress?.exercises[exerciseId]?.completed)
  );

  useEffect(() => {
    if (isLoaded && isUnlocked && allCompleted && !isLessonDone) {
      const xp = calculateXpAward(lesson.xpReward, undefined);
      if (xp > 0) {
        awardXp(xp, `lesson:${lesson.slug}`);
      }
      completeLesson(lesson.slug);
    }
  }, [
    allCompleted,
    isLessonDone,
    isLoaded,
    isUnlocked,
    lesson,
    awardXp,
    completeLesson,
  ]);

  if (!isLoaded) {
    return (
      <div
        role="status"
        className="mx-auto max-w-3xl py-16 text-center text-muted"
      >
        Loading your progress…
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <Lock className="mx-auto mb-4 text-muted" size={32} />
        <h1 className="text-2xl font-bold">Lesson locked</h1>
        <p className="mt-2 text-muted">
          Complete the previous lesson or reach Level {lesson.requiredLevel} to
          unlock {lesson.title}.
        </p>
        <Link
          href={`/${lesson.part}`}
          className="mt-5 inline-block rounded-lg bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-light"
        >
          Back to lessons
        </Link>
      </div>
    );
  }

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

      <LessonStepper
        lessonKey={lesson.slug}
        steps={steps}
        completedExerciseIds={completedExerciseIds}
        feedbackContext={{ lessonSlug: lesson.slug, part: lesson.part }}
        footer={
          <>
            {isLessonDone && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <div className="mb-2 flex items-center justify-center gap-2 text-lg font-bold text-green-800">
                  <CheckCircle size={24} /> Lesson Complete!
                </div>
                <p className="text-sm text-green-700">
                  You earned {lesson.xpReward} XP for completing this lesson.
                </p>
                {nextLesson ? (
                  <Link
                    href={`/${nextLesson.part}/${nextLesson.slug}`}
                    className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    Next: {nextLesson.title}
                  </Link>
                ) : (
                  <Link
                    href={`/${lesson.part}`}
                    className="mt-4 inline-block rounded-lg bg-primary px-6 py-2 font-semibold text-white transition-colors hover:bg-primary-light"
                  >
                    Back to Lessons
                  </Link>
                )}
              </div>
            )}

            {isLessonDone && (
              <LessonFeedback lessonSlug={lesson.slug} part={lesson.part} />
            )}

            <nav
              aria-label="Lesson navigation"
              className="mt-5 flex items-center justify-between gap-4 text-sm"
            >
              {previousLesson ? (
                <Link
                  href={`/${previousLesson.part}/${previousLesson.slug}`}
                  className="text-primary hover:underline"
                >
                  ← {previousLesson.title}
                </Link>
              ) : (
                <span />
              )}
              {nextLesson && isLessonDone && (
                <Link
                  href={`/${nextLesson.part}/${nextLesson.slug}`}
                  className="ml-auto text-right text-primary hover:underline"
                >
                  {nextLesson.title} →
                </Link>
              )}
            </nav>
          </>
        }
      />
    </div>
  );
}
