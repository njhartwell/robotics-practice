import type { UserProgress } from "@/lib/progress/types";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  check: (progress: UserProgress) => boolean;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "first-exercise",
    name: "First Steps",
    description: "Complete your first exercise",
    check: (p) => p.profile.exercisesCompleted >= 1,
  },
  {
    id: "first-lesson",
    name: "Lesson Learned",
    description: "Complete your first lesson",
    check: (p) => p.profile.lessonsCompleted >= 1,
  },
  {
    id: "streak-3",
    name: "On a Roll",
    description: "Maintain a 3-day streak",
    check: (p) => p.profile.currentStreak >= 3,
  },
  {
    id: "streak-7",
    name: "Unstoppable",
    description: "Maintain a 7-day streak",
    check: (p) => p.profile.currentStreak >= 7,
  },
];

export function checkBadgeUnlocks(progress: UserProgress): string[] {
  return BADGE_DEFINITIONS.filter(
    (badge) => !progress.badges.includes(badge.id) && badge.check(progress)
  ).map((badge) => badge.id);
}
