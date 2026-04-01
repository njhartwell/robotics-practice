"use client";

import { useParams } from "next/navigation";
import { getLessonBySlug } from "@/lib/content/curriculum";
import { LessonRenderer } from "@/components/lesson/LessonRenderer";
import { useEffect, useState } from "react";
import type { Exercise } from "@/lib/progress/types";
import Link from "next/link";

// Exercise data — in a full setup this would be loaded from content/ JSON files.
// For now, inline the stub exercises mapped by lesson slug.
const EXERCISE_DATA: Record<string, Exercise[]> = {
  "01-hello-kotlin": [
    {
      id: "01-hello-kotlin/ex-01",
      lessonSlug: "01-hello-kotlin",
      type: "code-completion",
      order: 1,
      title: "Print Hello World",
      instructions:
        'Complete the program to print "Hello, World!" to the console.',
      hint: "Use the println() function with a string argument.",
      xpReward: 15,
      starterCode:
        'fun main() {\n    // Print "Hello, World!" here\n    \n}',
      solutionCode: 'fun main() {\n    println("Hello, World!")\n}',
      validationMode: "output",
      expectedOutput: "Hello, World!",
    },
    {
      id: "01-hello-kotlin/ex-02",
      lessonSlug: "01-hello-kotlin",
      type: "code-completion",
      order: 2,
      title: "Team Greeting",
      instructions:
        'Print your FRC team number. Make the output say exactly: "Team 4488"',
      hint: "Use println() with the exact string.",
      xpReward: 15,
      starterCode: "fun main() {\n    // Print your team number\n    \n}",
      solutionCode: 'fun main() {\n    println("Team 4488")\n}',
      validationMode: "output",
      expectedOutput: "Team 4488",
    },
    {
      id: "01-hello-kotlin/ex-03",
      lessonSlug: "01-hello-kotlin",
      type: "multiple-choice",
      order: 3,
      title: "What does println do?",
      instructions:
        "What is the difference between `print()` and `println()`?",
      xpReward: 10,
      options: [
        { id: "a", text: "There is no difference" },
        { id: "b", text: "println adds a newline at the end" },
        { id: "c", text: "print adds a newline at the end" },
        { id: "d", text: "println can only print strings" },
      ],
      correctOptionId: "b",
      explanation:
        "println (print line) adds a newline character at the end of the output, while print does not.",
    },
  ],
  "02-variables": [
    {
      id: "02-variables/ex-01",
      lessonSlug: "02-variables",
      type: "code-completion",
      order: 1,
      title: "Declare an Immutable Variable",
      instructions:
        'Declare an immutable variable called `teamName` with the value "RoboRavens", then print it.',
      hint: "Use `val` to declare an immutable variable.",
      xpReward: 15,
      starterCode:
        "fun main() {\n    // Declare teamName here\n    \n    println(teamName)\n}",
      solutionCode:
        'fun main() {\n    val teamName = "RoboRavens"\n    println(teamName)\n}',
      validationMode: "output",
      expectedOutput: "RoboRavens",
    },
    {
      id: "02-variables/ex-02",
      lessonSlug: "02-variables",
      type: "fill-in-the-blank",
      order: 2,
      title: "val or var?",
      instructions:
        "Which keyword declares a variable that CANNOT be reassigned?",
      xpReward: 10,
      prompt:
        "The keyword _____ declares an immutable variable in Kotlin.",
      acceptedAnswers: ["val"],
      explanation:
        "`val` (short for value) declares an immutable variable. `var` (short for variable) declares a mutable one.",
    },
  ],
};

export default function Part1LessonPage() {
  const params = useParams();
  const slug = params.lessonSlug as string;
  const lesson = getLessonBySlug(slug);

  if (!lesson) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold mb-2">Lesson not found</h1>
        <Link href="/part1" className="text-primary hover:underline">
          Back to lessons
        </Link>
      </div>
    );
  }

  const exercises = EXERCISE_DATA[slug] ?? [];

  const mdxContent = (
    <div className="space-y-4">
      {slug === "01-hello-kotlin" && (
        <>
          <p>
            Welcome to your first Kotlin lesson! Kotlin is the language used by
            many FRC teams to program their robots. Let&apos;s start with the
            basics.
          </p>
          <p>
            Every Kotlin program starts with a <code>main</code> function:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`fun main() {\n    println("Hello, World!")\n}`}</code>
          </pre>
          <p>
            The <code>println</code> function prints text to the console,
            followed by a new line.
          </p>
        </>
      )}
      {slug === "02-variables" && (
        <>
          <p>
            In Kotlin, you declare variables using <code>val</code> (immutable)
            or <code>var</code> (mutable).
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm overflow-x-auto">
            <code>{`val teamNumber = 4488    // Cannot be changed\nvar matchCount = 0       // Can be changed\nmatchCount = matchCount + 1  // OK!`}</code>
          </pre>
        </>
      )}
    </div>
  );

  return (
    <LessonRenderer
      lesson={lesson}
      exercises={exercises}
      mdxContent={mdxContent}
    />
  );
}
