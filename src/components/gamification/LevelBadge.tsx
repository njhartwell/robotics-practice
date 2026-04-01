"use client";

import { useProgress } from "@/lib/progress/useProgress";
import { LEVELS } from "@/lib/gamification/levels";

export function LevelBadge() {
  const { progress } = useProgress();
  const level = LEVELS[progress.profile.currentLevel];

  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white font-bold text-sm">
      {level.level}
    </div>
  );
}
