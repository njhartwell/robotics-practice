"use client";

import { LessonCard } from "@/components/lesson/LessonCard";
import { buildPreviousLessonMap } from "@/lib/progress/lesson-access";
import type { LessonMeta } from "@/lib/progress/types";

export function IdeProjectsIndexClient({
  lessons,
}: {
  lessons: LessonMeta[];
}) {
  const previousLessons = buildPreviousLessonMap(lessons);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">IDE Projects</h1>
        <p className="text-muted mt-1">
          Build real WPILib robot code with guided IDE projects.
        </p>
      </div>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <LessonCard
            key={lesson.slug}
            lesson={lesson}
            previousLessonSlug={previousLessons.get(lesson.slug)}
          />
        ))}
      </div>
    </div>
  );
}
