"use client";

import Link from "next/link";
import type { LessonMeta } from "@/lib/progress/types";
import { useProgress } from "@/lib/progress/useProgress";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle, Clock, ChevronRight } from "lucide-react";

interface LessonCardProps {
  lesson: LessonMeta;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const { progress, isLessonUnlocked } = useProgress();
  const unlocked = isLessonUnlocked(lesson.requiredLevel);
  const lessonProgress = progress.lessons[lesson.slug];
  const completed = lessonProgress?.completed ?? false;

  const href = `/${lesson.part}/${lesson.slug}`;

  if (!unlocked) {
    return (
      <div className="relative bg-surface border border-border rounded-xl p-5 opacity-60">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-foreground/50">{lesson.title}</h3>
            <p className="text-sm text-muted mt-1">{lesson.description}</p>
          </div>
          <Lock size={20} className="text-muted flex-shrink-0 mt-1" />
        </div>
        <div className="mt-3 text-xs text-muted">
          Requires Level {lesson.requiredLevel}
        </div>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div
        className={cn(
          "relative bg-surface border rounded-xl p-5 transition-all hover:shadow-md hover:border-primary/30",
          completed ? "border-success/30" : "border-border"
        )}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{lesson.title}</h3>
              {completed && (
                <CheckCircle size={16} className="text-success flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted mt-1">{lesson.description}</p>
          </div>
          <ChevronRight size={18} className="text-muted flex-shrink-0 mt-1" />
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {lesson.estimatedMinutes} min
          </span>
          <span className="text-accent font-semibold">
            +{lesson.xpReward} XP
          </span>
          {lesson.exerciseCount > 0 && (
            <span>{lesson.exerciseCount} exercises</span>
          )}
        </div>
      </div>
    </Link>
  );
}
