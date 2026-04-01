export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 0, name: "Rookie", xpRequired: 0 },
  { level: 1, name: "Trainee", xpRequired: 100 },
  { level: 2, name: "Apprentice", xpRequired: 250 },
  { level: 3, name: "Coder", xpRequired: 500 },
  { level: 4, name: "Programmer", xpRequired: 800 },
  { level: 5, name: "Developer", xpRequired: 1200 },
  { level: 6, name: "Engineer", xpRequired: 1700 },
  { level: 7, name: "Senior Engineer", xpRequired: 2300 },
  { level: 8, name: "Lead Developer", xpRequired: 3000 },
  { level: 9, name: "Architect", xpRequired: 3800 },
  { level: 10, name: "FRC Legend", xpRequired: 5000 },
];

export function getLevelForXp(xp: number): LevelDefinition {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

export function getXpToNextLevel(xp: number): {
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const currentLevel = getLevelForXp(xp);

  if (currentLevel.level === LEVELS.length - 1) {
    return {
      currentLevelXp: currentLevel.xpRequired,
      nextLevelXp: currentLevel.xpRequired,
      progress: 1,
    };
  }

  const nextLevel = LEVELS[currentLevel.level + 1];
  const xpIntoLevel = xp - currentLevel.xpRequired;
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;

  return {
    currentLevelXp: currentLevel.xpRequired,
    nextLevelXp: nextLevel.xpRequired,
    progress: xpIntoLevel / xpNeeded,
  };
}
