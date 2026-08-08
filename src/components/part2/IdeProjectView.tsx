"use client";

import { useEffect } from "react";
import { useProgress } from "@/lib/progress/useProgress";
import type { LessonMeta } from "@/lib/progress/types";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";
import { LessonStepper } from "@/components/lesson/LessonStepper";
import type { LessonStep } from "@/lib/content/lesson-steps";

interface IdeProjectViewProps {
  lesson: LessonMeta;
  steps: LessonStep[];
}

export function IdeProjectView({ lesson, steps }: IdeProjectViewProps) {
  const { startLesson } = useProgress();

  useEffect(() => {
    startLesson(lesson.slug, lesson.part);
  }, [lesson, startLesson]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/ide-projects"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-3"
        >
          <ChevronLeft size={16} />
          Back to projects
        </Link>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-muted mt-1">{lesson.description}</p>
      </div>

      <div className="mb-6">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors">
          <Download size={16} />
          Download Starter Project
        </button>
      </div>

      <LessonStepper lessonKey={lesson.slug} steps={steps} />
    </div>
  );
}
