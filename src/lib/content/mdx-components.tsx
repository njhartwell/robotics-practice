import type { Exercise } from "@/lib/progress/types";
import { toClientExercise } from "./client-exercise";
import { Callout } from "@/components/mdx/Callout";
import { FrcContext } from "@/components/mdx/FrcContext";
import { Checklist } from "@/components/mdx/Checklist";
import { ExerciseInline } from "@/components/mdx/ExerciseInline";

/**
 * Build the MDX component map for a lesson page.
 * The Exercise component is bound to the loaded exercises array
 * so that `<Exercise id="01" />` renders the actual interactive exercise.
 */
export function buildMdxComponents(exercises: Exercise[]) {
  function Exercise({ id }: { id: string }) {
    const exercise = exercises.find((e) => {
      // Match by order number (id="01" matches order 1)
      const orderNum = parseInt(id, 10);
      return e.order === orderNum;
    });

    if (!exercise) {
      return (
        <div className="my-4 p-3 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">
          Exercise {id} not found
        </div>
      );
    }

    return <ExerciseInline exercise={toClientExercise(exercise)} />;
  }

  // Hide h1 from MDX since LessonView already renders the lesson title
  function h1() {
    return null;
  }

  return {
    h1,
    Callout,
    FrcContext,
    Checklist,
    Exercise,
  };
}
