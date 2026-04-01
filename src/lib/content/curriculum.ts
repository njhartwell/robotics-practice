import type { LessonMeta, Part } from "@/lib/progress/types";

// Static curriculum definition — will be replaced by fs-loader scanning
// content/ directories once we have more lessons.

export const CURRICULUM: LessonMeta[] = [
  {
    slug: "01-hello-kotlin",
    part: "playground",
    section: "getting-started",
    sectionTitle: "Getting Started",
    sectionOrder: 1,
    title: "Hello, Kotlin!",
    description: "Write your first Kotlin program and learn about fun main()",
    order: 1,
    requiredLevel: 0,
    xpReward: 50,
    estimatedMinutes: 5,
    exerciseCount: 3,
    tags: ["basics", "hello-world"],
  },
  {
    slug: "02-variables",
    part: "playground",
    section: "getting-started",
    sectionTitle: "Getting Started",
    sectionOrder: 1,
    title: "Variables: val vs var",
    description:
      "Learn to declare variables and understand mutability in Kotlin",
    order: 2,
    requiredLevel: 0,
    xpReward: 50,
    estimatedMinutes: 8,
    exerciseCount: 2,
    tags: ["basics", "variables", "mutability"],
  },
  {
    slug: "01-project-setup",
    part: "ide-projects",
    section: "wpilib-basics",
    sectionTitle: "WPILib Basics",
    sectionOrder: 1,
    title: "WPILib Project Structure",
    description:
      "Set up your first WPILib Kotlin project and understand the file layout",
    order: 1,
    requiredLevel: 5,
    xpReward: 75,
    estimatedMinutes: 15,
    exerciseCount: 0,
    tags: ["wpilib", "project-setup"],
  },
];

export function getLessonsForPart(part: Part): LessonMeta[] {
  return CURRICULUM.filter((l) => l.part === part).sort(
    (a, b) => a.sectionOrder - b.sectionOrder || a.order - b.order
  );
}

export function getLessonBySlug(slug: string): LessonMeta | undefined {
  return CURRICULUM.find((l) => l.slug === slug);
}

export function getAllSlugs(): string[] {
  return CURRICULUM.map((l) => l.slug);
}
