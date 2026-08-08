import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonStepper } from "./LessonStepper";
import type { LessonStep } from "@/lib/content/lesson-steps";

const steps: LessonStep[] = [
  {
    id: "overview",
    title: "Overview",
    kind: "overview",
    exerciseIds: [],
    content: <p>Welcome material</p>,
  },
  {
    id: "concept-1",
    title: "Variables",
    kind: "concept",
    exerciseIds: [],
    content: <p>Variable material</p>,
  },
  {
    id: "practice-1",
    title: "Store a value",
    kind: "practice",
    exerciseIds: ["variables/ex-01"],
    content: <p>Practice material</p>,
  },
];

describe("LessonStepper", () => {
  it("shows one screen at a time and moves forward and back", () => {
    render(<LessonStepper lessonKey="variables" steps={steps} />);

    expect(screen.getByText("Welcome material")).toBeVisible();
    expect(screen.queryByText("Variable material")).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");

    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(screen.getByText("Variable material")).toBeVisible();
    expect(screen.queryByText("Welcome material")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Welcome material")).toBeVisible();
  });

  it("marks a finished practice screen complete", () => {
    render(
      <LessonStepper
        lessonKey="variables"
        steps={[steps[2]]}
        completedExerciseIds={["variables/ex-01"]}
      />
    );

    expect(screen.getByText("Complete")).toBeVisible();
  });

  it("returns to unfinished practice from the final screen", () => {
    const { container } = render(
      <LessonStepper
        lessonKey="variables"
        steps={[steps[2], steps[1]]}
      />
    );
    const stepper = within(container);

    fireEvent.click(stepper.getByRole("button", { name: /continue/i }));
    fireEvent.click(
      stepper.getByRole("button", { name: /finish practice/i })
    );

    expect(stepper.getByText("Practice material")).toBeVisible();
  });
});
