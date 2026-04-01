"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { getLessonBySlug } from "@/lib/content/curriculum";
import { useProgress } from "@/lib/progress/useProgress";
import { ProjectChecklist } from "@/components/part2/ProjectChecklist";
import Link from "next/link";
import { ChevronLeft, Download } from "lucide-react";

const PART2_DATA: Record<
  string,
  { content: React.ReactNode; checklist: string[] }
> = {
  "01-project-setup": {
    content: (
      <div className="space-y-4">
        <p>
          In this lesson, you&apos;ll set up a WPILib project in IntelliJ and
          understand the key files.
        </p>
        <h2 className="text-xl font-bold mt-6">Prerequisites</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>IntelliJ IDEA installed</li>
          <li>WPILib VS Code extension installed (for project generation)</li>
        </ul>
        <h2 className="text-xl font-bold mt-6">Project Layout</h2>
        <p>A WPILib command-based project has this structure:</p>
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
          <code>{`src/main/java/frc/robot/
├── Robot.kt           # Robot lifecycle
├── RobotContainer.kt  # Wire subsystems to commands
├── Constants.kt       # Robot-wide constants
├── subsystems/        # Hardware abstractions
└── commands/          # Robot behaviors`}</code>
        </pre>
        <p>
          Download the starter project and open it in IntelliJ. Explore the file
          structure and identify each file&apos;s role.
        </p>
      </div>
    ),
    checklist: [
      "Downloaded and opened the starter project",
      "Identified Robot.kt and its lifecycle methods",
      "Found RobotContainer.kt and understand its role",
      "Located the subsystems and commands directories",
    ],
  },
};

export default function Part2LessonPage() {
  const params = useParams();
  const slug = params.lessonSlug as string;
  const lesson = getLessonBySlug(slug);
  const { startLesson } = useProgress();

  useEffect(() => {
    if (lesson) {
      startLesson(lesson.slug, lesson.part);
    }
  }, [lesson, startLesson]);

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
        <Link href="/part2" className="text-primary hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  const data = PART2_DATA[slug];
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Content coming soon</h1>
        <Link href="/part2" className="text-primary hover:underline">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/part2"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-3"
        >
          <ChevronLeft size={16} />
          Back to projects
        </Link>
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        <p className="text-muted mt-1">{lesson.description}</p>
      </div>

      {/* Download button */}
      <div className="mb-6">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors">
          <Download size={16} />
          Download Starter Project
        </button>
      </div>

      <div className="prose prose-sm max-w-none">{data.content}</div>

      <ProjectChecklist
        lessonSlug={lesson.slug}
        items={data.checklist}
        xpReward={lesson.xpReward}
      />
    </div>
  );
}
