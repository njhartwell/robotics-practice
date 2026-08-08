import { describe, expect, it } from "vitest";
import { splitLessonIntoSteps } from "./lesson-steps";

const exercises = [
  { id: "sample/ex-01", order: 1, title: "Print a Message" },
  { id: "sample/ex-02", order: 2, title: "Fix the Robot" },
];

describe("splitLessonIntoSteps", () => {
  it("turns the introduction, concepts, and exercises into separate screens", () => {
    const source = `# Sample Lesson

Welcome to the lesson.

## First \`Concept\`

Learn one thing.

<Exercise id="01" />

Try a harder version.

<Exercise id="02" />

## Second Concept

Learn another thing.`;

    const steps = splitLessonIntoSteps(source, exercises);

    expect(steps.map(({ title, kind }) => ({ title, kind }))).toEqual([
      { title: "Overview", kind: "overview" },
      { title: "First Concept", kind: "concept" },
      { title: "Print a Message", kind: "practice" },
      { title: "Fix the Robot", kind: "practice" },
      { title: "Second Concept", kind: "concept" },
    ]);
    expect(steps[0].source).toBe("Welcome to the lesson.");
    expect(steps[2].exerciseIds).toEqual(["sample/ex-01"]);
    expect(steps[3].source).toContain("Try a harder version.");
    expect(steps[3].source).toContain('<Exercise id="02" />');
  });

  it("does not treat headings inside code fences as lesson boundaries", () => {
    const steps = splitLessonIntoSteps(`## Real Concept

\`\`\`markdown
## Printed heading
\`\`\`

Still the same concept.`);

    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe("Real Concept");
    expect(steps[0].source).toContain("## Printed heading");
  });

  it("falls back to one screen when a lesson has no level-two headings", () => {
    const steps = splitLessonIntoSteps("# A title\n\nA short lesson.");

    expect(steps).toEqual([
      {
        id: "overview",
        title: "Overview",
        kind: "overview",
        exerciseIds: [],
        source: "A short lesson.",
      },
    ]);
  });
});
