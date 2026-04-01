/**
 * MDX Exercise placeholder. Exercises are rendered by LessonView
 * below the MDX content. This component shows a visual marker
 * in the lesson text indicating where an exercise belongs.
 */
interface ExerciseProps {
  id: string;
}

export function Exercise({ id }: ExerciseProps) {
  return (
    <div className="my-4 py-3 px-4 bg-primary/5 border border-primary/20 rounded-lg text-sm text-primary font-medium">
      ✏️ Exercise {id} — see below
    </div>
  );
}
