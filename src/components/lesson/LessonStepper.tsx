"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import type { LessonStep } from "@/lib/content/lesson-steps";
import type { Part } from "@/lib/progress/types";
import { FeedbackDialog } from "@/components/feedback/FeedbackDialog";

interface LessonStepperProps {
  lessonKey: string;
  steps: LessonStep[];
  completedExerciseIds?: string[];
  footer?: ReactNode;
  feedbackContext?: { lessonSlug: string; part: Part };
}

const STEP_LABELS = {
  overview: "Lesson overview",
  concept: "New concept",
  practice: "Practice",
} as const;

export function LessonStepper({
  lessonKey,
  steps,
  completedExerciseIds = [],
  footer,
  feedbackContext,
}: LessonStepperProps) {
  return (
    <LessonStepperContent
      key={lessonKey}
      steps={steps}
      completedExerciseIds={completedExerciseIds}
      footer={footer}
      feedbackContext={feedbackContext}
    />
  );
}

function LessonStepperContent({
  steps,
  completedExerciseIds = [],
  footer,
  feedbackContext,
}: Omit<LessonStepperProps, "lessonKey">) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusHeading = useRef(false);

  useEffect(() => {
    if (shouldFocusHeading.current) {
      headingRef.current?.focus();
      shouldFocusHeading.current = false;
    }
  }, [activeStepIndex]);

  if (steps.length === 0) {
    return <p className="text-muted">No content yet.</p>;
  }

  const safeIndex = Math.min(activeStepIndex, steps.length - 1);
  const activeStep = steps[safeIndex];
  const completedIds = new Set(completedExerciseIds);
  const activePracticeComplete =
    activeStep.kind === "practice" &&
    activeStep.exerciseIds.length > 0 &&
    activeStep.exerciseIds.every((id) => completedIds.has(id));
  const firstIncompletePracticeIndex = steps.findIndex(
    (step) =>
      step.kind === "practice" &&
      step.exerciseIds.some((id) => !completedIds.has(id))
  );
  const isFirstStep = safeIndex === 0;
  const isLastStep = safeIndex === steps.length - 1;
  const progressPercent = ((safeIndex + 1) / steps.length) * 100;

  function goToStep(index: number) {
    shouldFocusHeading.current = true;
    setActiveStepIndex(index);
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="border-b border-border px-5 py-4 sm:px-7">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>{STEP_LABELS[activeStep.kind]}</span>
          <span>
            {safeIndex + 1} of {steps.length}
          </span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-label="Lesson progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={safeIndex + 1}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="px-5 py-6 sm:px-7 sm:py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-bold leading-tight outline-none sm:text-2xl"
          >
            {activeStep.title}
          </h2>
          <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
            {activePracticeComplete && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                <CheckCircle2 size={14} /> Complete
              </span>
            )}
            {feedbackContext && (
              <FeedbackDialog
                lessonSlug={feedbackContext.lessonSlug}
                part={feedbackContext.part}
                stepId={activeStep.id}
              />
            )}
          </div>
        </div>

        <div className="prose prose-sm max-w-none" key={activeStep.id}>
          {activeStep.content}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-background/50 px-5 py-4 sm:px-7">
        <button
          type="button"
          onClick={() => goToStep(safeIndex - 1)}
          disabled={isFirstStep}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={17} /> Back
        </button>

        {!isLastStep ? (
          <button
            type="button"
            onClick={() => goToStep(safeIndex + 1)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            Continue <ChevronRight size={17} />
          </button>
        ) : firstIncompletePracticeIndex >= 0 &&
          firstIncompletePracticeIndex !== safeIndex ? (
          <button
            type="button"
            onClick={() => goToStep(firstIncompletePracticeIndex)}
            className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-light"
          >
            Finish practice <ChevronRight size={17} />
          </button>
        ) : (
          <span />
        )}
      </div>

      {isLastStep && footer && (
        <div className="border-t border-border px-5 py-6 sm:px-7">{footer}</div>
      )}
    </section>
  );
}
