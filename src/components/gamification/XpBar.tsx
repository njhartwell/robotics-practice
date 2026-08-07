"use client";

import { useProgress } from "@/lib/progress/useProgress";
import { getXpToNextLevel } from "@/lib/gamification/levels";
import { LEVELS } from "@/lib/gamification/levels";

export function XpBar() {
  const { progress } = useProgress();
  const { totalXp, currentLevel } = progress.profile;
  const { progress: levelProgress } = getXpToNextLevel(totalXp);
  const levelDef = LEVELS[currentLevel];

  return (
    <div className="flex items-center gap-3 w-full max-w-xs">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-bold text-accent">{levelDef.name}</span>
        <span className="text-xs text-muted">Lv.{currentLevel}</span>
      </div>
      <div className="flex-1 h-2.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.round(levelProgress * 100)}%` }}
        />
      </div>
      <span className="text-xs text-muted tabular-nums">{totalXp} XP</span>
    </div>
  );
}
