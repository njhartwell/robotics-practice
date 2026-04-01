"use client";

import { useProgress } from "@/lib/progress/useProgress";
import { LEVELS } from "@/lib/gamification/levels";
import { BADGE_DEFINITIONS } from "@/lib/gamification/badges";
import { Trophy, Zap, BookOpen, Target, Award } from "lucide-react";

export default function ProfilePage() {
  const { progress, isLoaded, resetProgress } = useProgress();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  const { totalXp, currentLevel, currentStreak, lessonsCompleted, exercisesCompleted } =
    progress.profile;
  const levelDef = LEVELS[currentLevel];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Your Profile</h1>
        <p className="text-muted mt-1">Track your progress and achievements.</p>
      </div>

      {/* Stats */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg">Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <Stat icon={<Zap size={16} />} label="Total XP" value={totalXp} />
          <Stat icon={<Trophy size={16} />} label="Level" value={`${currentLevel} - ${levelDef.name}`} />
          <Stat icon={<BookOpen size={16} />} label="Lessons Completed" value={lessonsCompleted} />
          <Stat icon={<Target size={16} />} label="Exercises Completed" value={exercisesCompleted} />
          <Stat icon={<Zap size={16} />} label="Day Streak" value={currentStreak} />
        </div>
      </div>

      {/* Badges */}
      <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Award size={20} /> Badges
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {BADGE_DEFINITIONS.map((badge) => {
            const earned = progress.badges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-lg border ${
                  earned
                    ? "border-accent/30 bg-accent/5"
                    : "border-border opacity-40"
                }`}
              >
                <div className="font-medium text-sm">{badge.name}</div>
                <div className="text-xs text-muted">{badge.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="font-semibold text-lg mb-2">Danger Zone</h2>
        <p className="text-sm text-muted mb-4">
          Reset all progress. This cannot be undone.
        </p>
        <button
          onClick={() => {
            if (confirm("Are you sure? This will erase all your progress.")) {
              resetProgress();
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Reset Progress
        </button>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted">{icon}</span>
      <div>
        <div className="text-xs text-muted">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
