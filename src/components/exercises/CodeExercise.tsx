"use client";

import { useCallback, useState } from "react";
import { KotlinPlayground } from "@/components/playground/KotlinPlayground";
import { useProgress } from "@/lib/progress/useProgress";
import { calculateXpAward } from "@/lib/gamification/xp";
import type { ClientCodeExercise } from "@/lib/progress/types";
import type {
  KotlinGradeResult,
  KotlinSolutionRequest,
} from "@/lib/kotlin-grader-types";
import { XpToast } from "@/components/gamification/XpToast";
import { InstructionText } from "./InstructionText";
import { CheckCircle, Lightbulb, XCircle } from "lucide-react";

const ATTEMPTS_BEFORE_SOLUTION = 3;

interface CodeExerciseProps {
  exercise: ClientCodeExercise;
}

export function CodeExercise({ exercise }: CodeExerciseProps) {
  const { progress, awardXp, completeExercise } = useProgress();
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [solutionCode, setSolutionCode] = useState<string | null>(null);
  const [isLoadingSolution, setIsLoadingSolution] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const lessonProgress = progress.lessons[exercise.lessonSlug];
  const exerciseProgress = lessonProgress?.exercises[exercise.id];
  const alreadyCompleted = exerciseProgress?.completed ?? false;

  const markSuccess = useCallback(() => {
    setResult("success");
    const xp = calculateXpAward(exercise.xpReward, exerciseProgress);
    if (xp > 0) {
      awardXp(xp, `exercise:${exercise.id}`);
      setXpAwarded(xp);
    }
    completeExercise(exercise.lessonSlug, exercise.id);
  }, [awardXp, completeExercise, exercise, exerciseProgress]);

  const handleGradeResult = useCallback(
    (gradeResult: KotlinGradeResult) => {
      if (gradeResult.passed) {
        markSuccess();
      } else {
        setResult("failure");
        setFailedAttempts((attempts) => attempts + 1);
      }
    },
    [markSuccess]
  );

  async function handleRevealSolution() {
    setIsLoadingSolution(true);
    const request: KotlinSolutionRequest = {
      action: "solution",
      lessonSlug: exercise.lessonSlug,
      exerciseId: exercise.id,
    };

    try {
      const response = await fetch("/api/kotlin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      const data = (await response.json()) as { solutionCode?: string };
      if (response.ok && data.solutionCode) setSolutionCode(data.solutionCode);
    } finally {
      setIsLoadingSolution(false);
    }
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-background/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">{exercise.title}</h4>
          {alreadyCompleted && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle size={14} /> Completed
            </span>
          )}
        </div>
        <InstructionText text={exercise.instructions} />
      </div>

      <KotlinPlayground
        code={exercise.starterCode}
        exerciseId={exercise.id}
        lessonSlug={exercise.lessonSlug}
        onGradeResult={handleGradeResult}
      />

      {result && (
        <div
          className={`border-t px-4 py-3 ${
            result === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {result === "success" ? (
              <>
                <CheckCircle size={16} /> Correct! Nice work.
              </>
            ) : (
              <>
                <XCircle size={16} /> Not yet. Use the grader details above,
                then try again.
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-2">
        {exercise.hint && (
          <button
            type="button"
            onClick={() => setShowHint((visible) => !visible)}
            className="flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
          >
            <Lightbulb size={14} />
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        )}
        {failedAttempts >= ATTEMPTS_BEFORE_SOLUTION && !solutionCode && (
          <button
            type="button"
            onClick={handleRevealSolution}
            disabled={isLoadingSolution}
            className="text-xs text-muted underline hover:text-foreground disabled:opacity-50"
          >
            {isLoadingSolution ? "Loading solution…" : "Show one solution"}
          </button>
        )}
      </div>

      {showHint && exercise.hint && (
        <p className="border-t border-border px-4 py-3 text-sm text-muted">
          {exercise.hint}
        </p>
      )}

      {solutionCode && (
        <div className="border-t border-border bg-slate-900 p-4 text-slate-100">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            One possible solution
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">
            <code>{solutionCode}</code>
          </pre>
        </div>
      )}

      <XpToast amount={xpAwarded} onComplete={() => setXpAwarded(null)} />
    </div>
  );
}
