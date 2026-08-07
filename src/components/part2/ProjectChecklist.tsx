"use client";

import { useState } from "react";
import { ChecklistItem } from "./ChecklistItem";
import { useProgress } from "@/lib/progress/useProgress";
import { XpToast } from "@/components/gamification/XpToast";
import { CheckCircle } from "lucide-react";

interface ProjectChecklistProps {
  lessonSlug: string;
  items: string[];
  xpReward: number;
}

export function ProjectChecklist({
  lessonSlug,
  items,
  xpReward,
}: ProjectChecklistProps) {
  const { progress, awardXp, completeLesson, completeExercise } = useProgress();
  const [checked, setChecked] = useState<boolean[]>(
    new Array(items.length).fill(false)
  );
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const lessonProgress = progress.lessons[lessonSlug];
  const isLessonDone = lessonProgress?.completed ?? false;
  function toggleItem(index: number, value: boolean) {
    if (isLessonDone) return;
    const next = [...checked];
    next[index] = value;
    setChecked(next);

    if (items.length > 0 && next.every(Boolean)) {
      items.forEach((_, itemIndex) => {
        completeExercise(lessonSlug, `checklist-${itemIndex}`);
      });
      awardXp(xpReward, `lesson:${lessonSlug}`);
      setXpAwarded(xpReward);
      completeLesson(lessonSlug);
    }
  }

  return (
    <div className="my-6 border border-border rounded-xl overflow-hidden bg-surface">
      <div className="px-4 py-3 border-b border-border bg-background/50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Task Checklist</h4>
          {isLessonDone && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle size={14} /> Completed
            </span>
          )}
        </div>
        <p className="text-sm text-muted mt-1">
          Check off each task as you complete it in your IDE.
        </p>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item, i) => (
          <ChecklistItem
            key={i}
            label={item}
            checked={isLessonDone || checked[i]}
            onChange={(val) => toggleItem(i, val)}
          />
        ))}
      </div>

      <XpToast amount={xpAwarded} onComplete={() => setXpAwarded(null)} />
    </div>
  );
}
