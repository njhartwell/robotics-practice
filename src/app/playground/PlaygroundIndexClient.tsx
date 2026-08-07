"use client";

import { LessonCard } from "@/components/lesson/LessonCard";
import type { LessonMeta } from "@/lib/progress/types";
import {
  getCurriculumTrack,
  orderLessonsByTrack,
  type CurriculumTrack,
} from "@/lib/content/curriculum-track";
import { buildPreviousLessonMap } from "@/lib/progress/lesson-access";

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
  const previousLessons = buildPreviousLessonMap(orderLessonsByTrack(lessons));
  const tracks: {
    id: CurriculumTrack;
    title: string;
    description: string;
    lessons: LessonMeta[];
  }[] = [
    {
      id: "core",
      title: "Core Kotlin for FRC",
      description:
        "The recommended path for a new programmer. Finish this before starting the robot projects.",
      lessons: lessons.filter((lesson) => getCurriculumTrack(lesson) === "core"),
    },
    {
      id: "further",
      title: "Further Kotlin",
      description:
        "Optional topics to deepen your Kotlin skills after the core path.",
      lessons: lessons.filter(
        (lesson) => getCurriculumTrack(lesson) === "further"
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Kotlin Playground</h1>
        <p className="text-muted mt-1">
          Master Kotlin fundamentals with interactive exercises right in your
          browser.
        </p>
      </div>
      {tracks.map((track) => (
        <section key={track.id} aria-labelledby={`${track.id}-track`}>
          <div className="mb-4">
            <h2 id={`${track.id}-track`} className="text-xl font-bold">
              {track.title}
            </h2>
            <p className="mt-1 text-sm text-muted">{track.description}</p>
          </div>
          <div className="space-y-7">
            {groupBySection(track.lessons).map((section) => (
              <div key={section.section}>
                <h3 className="mb-3 text-base font-semibold text-muted">
                  {section.sectionTitle}
                </h3>
                <div className="space-y-3">
                  {section.lessons.map((lesson) => (
                    <LessonCard
                      key={lesson.slug}
                      lesson={lesson}
                      previousLessonSlug={previousLessons.get(lesson.slug)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
