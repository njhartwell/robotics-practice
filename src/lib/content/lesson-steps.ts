import type { ReactNode } from "react";

export type LessonStepKind = "overview" | "concept" | "practice";

export interface ExerciseStepInfo {
  id: string;
  order: number;
  title: string;
}

export interface LessonStepSource {
  id: string;
  title: string;
  kind: LessonStepKind;
  exerciseIds: string[];
  source: string;
}

export interface LessonStep extends Omit<LessonStepSource, "source"> {
  content: ReactNode;
}

interface MdxSection {
  title?: string;
  source: string;
}

const EXERCISE_PATTERN = /<Exercise\s+id=["'](\d+)["']\s*\/>/g;

/**
 * Break a lesson into short screens. Markdown level-two headings introduce a
 * concept, while each exercise gets a dedicated practice screen.
 */
export function splitLessonIntoSteps(
  source: string,
  exercises: ExerciseStepInfo[] = []
): LessonStepSource[] {
  const exerciseByOrder = new Map(
    exercises.map((exercise) => [exercise.order, exercise])
  );
  const sections = splitAtLevelTwoHeadings(source);
  const steps: LessonStepSource[] = [];
  let conceptNumber = 0;

  for (const section of sections) {
    if (!section.title) {
      const overview = removeTopLevelHeading(section.source).trim();
      if (overview) {
        steps.push({
          id: "overview",
          title: "Overview",
          kind: "overview",
          exerciseIds: [],
          source: overview,
        });
      }
      continue;
    }

    conceptNumber += 1;
    const matches = Array.from(section.source.matchAll(EXERCISE_PATTERN));
    const firstExerciseIndex = matches[0]?.index ?? section.source.length;
    const conceptSource = section.source.slice(0, firstExerciseIndex).trim();

    if (conceptSource) {
      steps.push({
        id: `concept-${conceptNumber}`,
        title: cleanHeading(section.title),
        kind: "concept",
        exerciseIds: [],
        source: conceptSource,
      });
    }

    matches.forEach((match, index) => {
      const order = Number(match[1]);
      const exercise = exerciseByOrder.get(order);
      const previousEnd = index === 0 ? match.index : matches[index - 1].index! + matches[index - 1][0].length;
      const transition = section.source.slice(previousEnd, match.index).trim();
      const isLastExercise = index === matches.length - 1;
      const trailing = isLastExercise
        ? section.source.slice(match.index! + match[0].length).trim()
        : "";

      steps.push({
        id: `practice-${order}`,
        title: exercise?.title ?? `Exercise ${order}`,
        kind: "practice",
        exerciseIds: exercise ? [exercise.id] : [],
        source: [transition, match[0], trailing].filter(Boolean).join("\n\n"),
      });
    });
  }

  if (steps.length === 0) {
    return [
      {
        id: "lesson",
        title: "Lesson",
        kind: "concept",
        exerciseIds: [],
        source: removeTopLevelHeading(source).trim(),
      },
    ];
  }

  return steps;
}

function splitAtLevelTwoHeadings(source: string): MdxSection[] {
  const lines = source.split(/\r?\n/);
  const sections: MdxSection[] = [];
  let current: MdxSection = { source: "" };
  let fenceMarker: "```" | "~~~" | undefined;

  function finishCurrentSection() {
    if (current.source.trim()) {
      sections.push({ ...current, source: current.source.trim() });
    }
  }

  for (const line of lines) {
    const fence = line.match(/^\s*(```|~~~)/)?.[1] as
      | "```"
      | "~~~"
      | undefined;
    if (fence) {
      fenceMarker = fenceMarker === fence ? undefined : fenceMarker ?? fence;
    }

    const heading = !fenceMarker ? line.match(/^##\s+(.+?)\s*$/) : null;
    if (heading) {
      finishCurrentSection();
      current = { title: heading[1], source: "" };
      continue;
    }

    current.source += `${line}\n`;
  }

  finishCurrentSection();
  return sections;
}

function removeTopLevelHeading(source: string): string {
  return source.replace(/^#\s+.+?(?:\r?\n|$)/, "");
}

function cleanHeading(title: string): string {
  return title
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .trim();
}
