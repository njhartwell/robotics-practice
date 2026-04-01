"use client";

import { getLessonsForPart } from "@/lib/content/curriculum";
import { LessonCard } from "@/components/lesson/LessonCard";

export default function Part1Index() {
  const lessons = getLessonsForPart("part1");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Part 1: Kotlin Basics</h1>
        <p className="text-muted mt-1">
          Master Kotlin fundamentals with interactive exercises right in your
          browser.
        </p>
      </div>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
