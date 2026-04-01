export type Part = "playground" | "ide-projects";

export type ExerciseType =
  | "code-completion"
  | "fix-the-bug"
  | "write-from-scratch"
  | "multiple-choice"
  | "fill-in-the-blank";

export interface LessonMeta {
  slug: string;
  part: Part;
  section: string;
  sectionTitle: string;
  sectionOrder: number;
  title: string;
  description: string;
  order: number;
  requiredLevel: number;
  xpReward: number;
  estimatedMinutes: number;
  exerciseCount: number;
  tags: string[];
}

export interface ExerciseBase {
  id: string;
  lessonSlug: string;
  type: ExerciseType;
  order: number;
  title: string;
  instructions: string;
  hint?: string;
  xpReward: number;
}

export interface CodeExercise extends ExerciseBase {
  type: "code-completion" | "fix-the-bug" | "write-from-scratch";
  starterCode: string;
  solutionCode: string;
  validationMode: "output" | "test";
  expectedOutput?: string;
  testCode?: string;
  hiddenPreamble?: string;
  hiddenPostamble?: string;
}

export interface MultipleChoiceExercise extends ExerciseBase {
  type: "multiple-choice";
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export interface FillInTheBlankExercise extends ExerciseBase {
  type: "fill-in-the-blank";
  prompt: string;
  acceptedAnswers: string[];
  explanation: string;
}

export type Exercise =
  | CodeExercise
  | MultipleChoiceExercise
  | FillInTheBlankExercise;

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  completedAt?: string;
  attempts: number;
  bestCode?: string;
}

export interface LessonProgress {
  lessonSlug: string;
  part: Part;
  started: boolean;
  startedAt?: string;
  completed: boolean;
  completedAt?: string;
  exercises: Record<string, ExerciseProgress>;
}

export interface UserProfile {
  displayName: string;
  createdAt: string;
  totalXp: number;
  currentLevel: number;
  currentStreak: number;
  lastActiveDate: string;
  lessonsCompleted: number;
  exercisesCompleted: number;
}

export interface XpEvent {
  amount: number;
  source: string;
  timestamp: string;
}

export interface UserProgress {
  version: number;
  profile: UserProfile;
  lessons: Record<string, LessonProgress>;
  badges: string[];
  xpHistory: XpEvent[];
}

export function createDefaultProgress(): UserProgress {
  return {
    version: 1,
    profile: {
      displayName: "Rookie",
      createdAt: new Date().toISOString(),
      totalXp: 0,
      currentLevel: 0,
      currentStreak: 0,
      lastActiveDate: new Date().toISOString().split("T")[0],
      lessonsCompleted: 0,
      exercisesCompleted: 0,
    },
    lessons: {},
    badges: [],
    xpHistory: [],
  };
}
