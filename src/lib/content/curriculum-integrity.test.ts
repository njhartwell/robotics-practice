import { describe, expect, it } from "vitest";
import path from "path";
import {
  getAllLessonMetas,
  getExercisesForLesson,
  getLessonMdx,
} from "./fs-loader";
import { isCodeExercise, toClientExercise } from "./client-exercise";
import { splitLessonIntoSteps } from "./lesson-steps";

const CONTENT_DIR = path.resolve(process.cwd(), "content");

describe("complete curriculum integrity", () => {
  it("loads every lesson and validates its exercise references", async () => {
    const lessons = await getAllLessonMetas("playground", CONTENT_DIR);
    const exerciseIds = new Set<string>();
    let exerciseCount = 0;

    expect(lessons).toHaveLength(41);

    for (const lesson of lessons) {
      const [exercises, mdx] = await Promise.all([
        getExercisesForLesson("playground", lesson.slug, CONTENT_DIR),
        getLessonMdx("playground", lesson.slug, CONTENT_DIR),
      ]);

      expect(mdx.trim(), `${lesson.slug} needs lesson content`).not.toBe("");
      expect(exercises, `${lesson.slug} exercise count`).toHaveLength(
        lesson.exerciseCount
      );

      const referencedOrders = Array.from(
        mdx.matchAll(/<Exercise id="(\d+)"\s*\/>/g),
        (match) => Number(match[1])
      );
      expect(referencedOrders, `${lesson.slug} MDX exercise references`).toEqual(
        exercises.map((exercise) => exercise.order)
      );

      const lessonSteps = splitLessonIntoSteps(mdx, exercises);
      const practiceSteps = lessonSteps.filter(
        (step) => step.kind === "practice"
      );
      expect(lessonSteps.length, `${lesson.slug} lesson screens`).toBeGreaterThan(
        1
      );
      expect(practiceSteps, `${lesson.slug} practice screens`).toHaveLength(
        exercises.length
      );
      expect(
        practiceSteps.flatMap((step) => step.exerciseIds),
        `${lesson.slug} exercises assigned to screens`
      ).toEqual(exercises.map((exercise) => exercise.id));

      for (const exercise of exercises) {
        expect(exercise.lessonSlug).toBe(lesson.slug);
        expect(exerciseIds.has(exercise.id), `duplicate ID ${exercise.id}`).toBe(
          false
        );
        exerciseIds.add(exercise.id);
        exerciseCount += 1;

        if (isCodeExercise(exercise)) {
          expect(exercise.solutionCode.trim()).not.toBe("");
          if (exercise.validationMode === "test") {
            expect(exercise.testCode).toContain("@Test");
          } else {
            expect(exercise.expectedOutput).toBeDefined();
          }

          const clientExercise = toClientExercise(exercise);
          expect(clientExercise).not.toHaveProperty("solutionCode");
          expect(clientExercise).not.toHaveProperty("testCode");
          expect(clientExercise).not.toHaveProperty("expectedOutput");
          expect(clientExercise).not.toHaveProperty("hiddenPostamble");
        }
      }
    }

    expect(exerciseCount).toBe(185);
    expect(exerciseIds.size).toBe(exerciseCount);
  });
});
