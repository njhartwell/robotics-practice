export interface LevelDefinition {
  level: number;
  name: string;
  xpRequired: number;
}

export const LEVELS: LevelDefinition[] = [
  { level: 0, name: "Rookie", xpRequired: 0 },
  { level: 1, name: "Trainee", xpRequired: 75 },
  { level: 2, name: "Apprentice", xpRequired: 200 },
  { level: 3, name: "Coder", xpRequired: 400 },
  { level: 4, name: "Programmer", xpRequired: 650 },
  { level: 5, name: "Developer", xpRequired: 1000 },
  { level: 6, name: "Craftsman", xpRequired: 1400 },
  { level: 7, name: "Engineer", xpRequired: 1900 },
  { level: 8, name: "Architect", xpRequired: 2500 },
  { level: 9, name: "Specialist", xpRequired: 3200 },
  { level: 10, name: "Expert", xpRequired: 4000 },
  { level: 11, name: "Kotlin Adept", xpRequired: 4500 },
  { level: 12, name: "Kotlin Guru", xpRequired: 5200 },
  { level: 13, name: "Master", xpRequired: 5800 },
  { level: 14, name: "Grand Master", xpRequired: 6500 },
  { level: 15, name: "IDE Rookie", xpRequired: 6800 },
  { level: 16, name: "IDE Builder", xpRequired: 7200 },
  { level: 17, name: "Robot Programmer", xpRequired: 7600 },
  { level: 18, name: "Robot Engineer", xpRequired: 8000 },
  { level: 19, name: "FRC Legend", xpRequired: 8500 },
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
