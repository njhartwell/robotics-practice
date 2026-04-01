"use client";

import Link from "next/link";
import { useProgress } from "@/lib/progress/useProgress";
import { LEVELS } from "@/lib/gamification/levels";
import { getXpToNextLevel } from "@/lib/gamification/levels";
import { BookOpen, Wrench, Trophy, Zap } from "lucide-react";

export default function Dashboard() {
  const { progress, isLoaded } = useProgress();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  const { totalXp, currentLevel, lessonsCompleted, exercisesCompleted } =
    progress.profile;
  const levelDef = LEVELS[currentLevel];
  const { progress: levelProgress } = getXpToNextLevel(totalXp);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome to FRC Kotlin!</h1>
        <p className="text-muted mt-2">
          Learn Kotlin programming for FIRST Robotics Competition
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap size={20} className="text-accent" />}
          label="Total XP"
          value={totalXp.toString()}
        />
        <StatCard
          icon={<Trophy size={20} className="text-accent" />}
          label="Level"
          value={`${currentLevel} - ${levelDef.name}`}
        />
        <StatCard
          icon={<BookOpen size={20} className="text-primary" />}
          label="Lessons"
          value={lessonsCompleted.toString()}
        />
        <StatCard
          icon={<Wrench size={20} className="text-primary" />}
          label="Exercises"
          value={exercisesCompleted.toString()}
        />
      </div>

      {/* Level Progress */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold">
            Level {currentLevel}: {levelDef.name}
          </span>
          <span className="text-sm text-muted">
            {Math.round(levelProgress * 100)}% to next level
          </span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-700"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/playground">
          <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <BookOpen size={24} className="text-primary" />
              <h2 className="text-xl font-bold">Kotlin Playground</h2>
            </div>
            <p className="text-muted text-sm">
              Learn Kotlin fundamentals with interactive browser-based
              exercises. No IDE needed!
            </p>
          </div>
        </Link>
        <Link href="/ide-projects">
          <div className="bg-surface border border-border rounded-xl p-6 hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Wrench size={24} className="text-primary" />
              <h2 className="text-xl font-bold">IDE Projects</h2>
            </div>
            <p className="text-muted text-sm">
              Build real WPILib robot code in IntelliJ with guided projects and
              starter templates.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
