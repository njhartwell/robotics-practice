import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  ProgressContext,
  type ProgressContextValue,
} from "@/lib/progress/ProgressProvider";
import { canAccessLesson } from "@/lib/progress/lesson-access";
import { createDefaultProgress, type LessonMeta } from "@/lib/progress/types";
import { LessonView } from "./LessonView";

const lesson: LessonMeta = {
  slug: "15-classes",
  part: "playground",
  section: "oop-basics",
  sectionTitle: "Object-Oriented Programming",
  sectionOrder: 4,
  title: "Classes and Objects",
  description: "Create your own types with classes",
  order: 15,
  requiredLevel: 2,
  xpReward: 70,
  estimatedMinutes: 15,
  exerciseCount: 1,
  tags: ["classes"],
};

const previousLesson = {
  slug: "14-arrays",
  part: "playground" as const,
  title: "Arrays",
};

const nextLesson = {
  slug: "16-constructors",
  part: "playground" as const,
  title: "Constructors",
};

function contextValue(
  configure?: (progress: ReturnType<typeof createDefaultProgress>) => void
): ProgressContextValue {
  const progress = createDefaultProgress();
  configure?.(progress);

  return {
    progress,
    isLoaded: true,
    awardXp: vi.fn(),
    completeExercise: vi.fn(),
    completeLesson: vi.fn(),
    startLesson: vi.fn(),
    resetProgress: vi.fn(),
    isLessonUnlocked: (requiredLevel, previousLessonSlug) =>
      canAccessLesson(progress, requiredLevel, previousLessonSlug),
  };
}

function renderLesson(value: ProgressContextValue) {
  return render(
    <ProgressContext.Provider value={value}>
      <LessonView
        lesson={lesson}
        exerciseIds={["15-classes/ex-01"]}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
      >
        <p>Private lesson material</p>
      </LessonView>
    </ProgressContext.Provider>
  );
}

describe("LessonView access", () => {
  it("hides lesson material when the lesson is locked", () => {
    renderLesson(contextValue());

    expect(screen.getByRole("heading", { name: "Lesson locked" })).toBeVisible();
    expect(screen.queryByText("Private lesson material")).not.toBeInTheDocument();
  });

  it("hides forward navigation until the current lesson is complete", () => {
    renderLesson(
      contextValue((progress) => {
        progress.lessons[previousLesson.slug] = {
          lessonSlug: previousLesson.slug,
          part: "playground",
          started: true,
          completed: true,
          exercises: {},
        };
      })
    );

    expect(screen.getByText("Private lesson material")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Constructors/ })).not.toBeInTheDocument();
  });

  it("shows completion and forward navigation after finishing the lesson", () => {
    renderLesson(
      contextValue((progress) => {
        progress.profile.currentLevel = 2;
        progress.lessons[lesson.slug] = {
          lessonSlug: lesson.slug,
          part: "playground",
          started: true,
          completed: true,
          exercises: {
            "15-classes/ex-01": {
              exerciseId: "15-classes/ex-01",
              completed: true,
              attempts: 1,
            },
          },
        };
      })
    );

    expect(screen.getByText("Lesson Complete!")).toBeVisible();
    expect(screen.getAllByRole("link", { name: /Constructors/ })).toHaveLength(2);
  });
});
