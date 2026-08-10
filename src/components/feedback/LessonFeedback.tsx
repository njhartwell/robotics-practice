import type { Part } from "@/lib/progress/types";
import { FeedbackForm } from "./FeedbackForm";

export function LessonFeedback({
  lessonSlug,
  part,
}: {
  lessonSlug: string;
  part: Part;
}) {
  return (
    <section className="mt-5 rounded-xl border border-border bg-surface p-5 text-left">
      <h2 className="text-lg font-bold">How was this lesson?</h2>
      <p className="mt-1 text-sm text-muted">
        A quick rating helps us improve the course for the next student.
      </p>
      <div className="mt-4">
        <FeedbackForm lessonSlug={lessonSlug} part={part} kind="lesson" />
      </div>
    </section>
  );
}
