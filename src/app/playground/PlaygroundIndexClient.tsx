"use client";

import { LessonCard } from "@/components/lesson/LessonCard";
import type { LessonMeta } from "@/lib/progress/types";

function groupBySection(
  lessons: LessonMeta[]
): { section: string; sectionTitle: string; lessons: LessonMeta[] }[] {
  const groups: Map<
    string,
    { sectionTitle: string; lessons: LessonMeta[] }
  > = new Map();

  for (const lesson of lessons) {
    const existing = groups.get(lesson.section);
    if (existing) {
      existing.lessons.push(lesson);
    } else {
      groups.set(lesson.section, {
        sectionTitle: lesson.sectionTitle,
        lessons: [lesson],
      });
    }
  }

  return Array.from(groups.entries()).map(([section, data]) => ({
    section,
    ...data,
  }));
}

export function PlaygroundIndexClient({
  lessons,
}: {
  lessons: LessonMeta[];
}) {
  const sections = groupBySection(lessons);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Kotlin Playground</h1>
        <p className="text-muted mt-1">
          Master Kotlin fundamentals with interactive exercises right in your
          browser.
        </p>
      </div>
      {sections.map((section) => (
        <div key={section.section}>
          <h2 className="text-lg font-semibold mb-3">{section.sectionTitle}</h2>
          <div className="space-y-3">
            {section.lessons.map((lesson) => (
              <LessonCard key={lesson.slug} lesson={lesson} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
