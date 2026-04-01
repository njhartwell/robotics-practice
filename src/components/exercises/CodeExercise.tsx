"use client";

import { useState, useCallback } from "react";
import { KotlinPlayground } from "@/components/playground/KotlinPlayground";
import { validateOutput } from "@/lib/content/exercise-validator";
import { useProgress } from "@/lib/progress/useProgress";
import { calculateXpAward } from "@/lib/gamification/xp";
import type { CodeExercise as CodeExerciseType } from "@/lib/progress/types";
import { XpToast } from "@/components/gamification/XpToast";
import { InstructionText } from "./InstructionText";
import { CheckCircle, XCircle, Lightbulb } from "lucide-react";

interface CodeExerciseProps {
  exercise: CodeExerciseType;
}

export function CodeExercise({ exercise }: CodeExerciseProps) {
  const { progress, awardXp, completeExercise } = useProgress();
  const [result, setResult] = useState<"success" | "failure" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const lessonProgress = progress.lessons[exercise.lessonSlug];
  const exerciseProgress = lessonProgress?.exercises[exercise.id];
  const alreadyCompleted = exerciseProgress?.completed ?? false;

  const handleExecutionEnd = useCallback(
    (output: string) => {
      if (exercise.validationMode === "output" && exercise.expectedOutput) {
        if (validateOutput(output, exercise.expectedOutput)) {
          setResult("success");
          const xp = calculateXpAward(exercise.xpReward, exerciseProgress);
          if (xp > 0) {
            awardXp(xp, `exercise:${exercise.id}`);
            setXpAwarded(xp);
          }
          completeExercise(exercise.lessonSlug, exercise.id);
        } else {
          setResult("failure");
        }
      }
    },
    [exercise, exerciseProgress, awardXp, completeExercise]
  );

  const handleTestPassed = useCallback(() => {
    setResult("success");
    const xp = calculateXpAward(exercise.xpReward, exerciseProgress);
    if (xp > 0) {
      awardXp(xp, `exercise:${exercise.id}`);
      setXpAwarded(xp);
    }
    completeExercise(exercise.lessonSlug, exercise.id);
  }, [exercise, exerciseProgress, awardXp, completeExercise]);

  const handleTestFailed = useCallback((error: string) => {
    setResult("failure");
  }, []);

  return (
    <div className="my-6 border border-border rounded-xl overflow-hidden bg-surface">
      <div className="px-4 py-3 border-b border-border bg-background/50">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{exercise.title}</h4>
          {alreadyCompleted && (
            <span className="flex items-center gap-1 text-xs text-success">
              <CheckCircle size={14} /> Completed
            </span>
          )}
        </div>
        <InstructionText text={exercise.instructions} />
      </div>

      <div className="p-4">
        <KotlinPlayground
          code={exercise.starterCode}
          exerciseId={exercise.id}
          onExecutionEnd={handleExecutionEnd}
          onTestPassed={handleTestPassed}
          onTestFailed={handleTestFailed}
          targetPlatform={exercise.validationMode === "test" ? "junit" : "jvm"}
          hiddenDependency={exercise.testCode}
        />
      </div>

      {/* Result feedback */}
      {result && (
        <div
          className={`px-4 py-3 border-t ${
            result === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            {result === "success" ? (
              <>
                <CheckCircle size={16} /> Correct!
              </>
            ) : (
              <>
                <XCircle size={16} /> Not quite. Check your output and try
                again.
              </>
            )}
          </div>
        </div>
      )}

      {/* Hint */}
      {exercise.hint && (
        <div className="px-4 py-2 border-t border-border">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <Lightbulb size={14} />
            {showHint ? "Hide hint" : "Show hint"}
          </button>
          {showHint && (
            <p className="text-sm text-muted mt-1.5 pl-5">{exercise.hint}</p>
          )}
        </div>
      )}

      <XpToast amount={xpAwarded} onComplete={() => setXpAwarded(null)} />
    </div>
  );
}
