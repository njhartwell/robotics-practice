"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress/useProgress";
import { calculateXpAward } from "@/lib/gamification/xp";
import { validateMultipleChoice } from "@/lib/content/exercise-validator";
import type { MultipleChoiceExercise as MCExerciseType } from "@/lib/progress/types";
import { XpToast } from "@/components/gamification/XpToast";
import { CheckCircle, XCircle } from "lucide-react";
import { InstructionText } from "./InstructionText";
import { cn } from "@/lib/utils";

interface MultipleChoiceExerciseProps {
  exercise: MCExerciseType;
}

export function MultipleChoiceExercise({
  exercise,
}: MultipleChoiceExerciseProps) {
  const { progress, awardXp, completeExercise } = useProgress();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const lessonProgress = progress.lessons[exercise.lessonSlug];
  const exerciseProgress = lessonProgress?.exercises[exercise.id];
  const alreadyCompleted = exerciseProgress?.completed ?? false;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    const correct = validateMultipleChoice(selected, exercise.correctOptionId);
    setIsCorrect(correct);

    if (correct) {
      const xp = calculateXpAward(exercise.xpReward, exerciseProgress);
      if (xp > 0) {
        awardXp(xp, `exercise:${exercise.id}`);
        setXpAwarded(xp);
      }
      completeExercise(exercise.lessonSlug, exercise.id);
    }
  }

  function handleRetry() {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(false);
  }

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

      <div className="p-4 space-y-2">
        {exercise.options.map((option) => (
          <button
            key={option.id}
            onClick={() => !submitted && setSelected(option.id)}
            disabled={submitted}
            className={cn(
              "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all",
              selected === option.id && !submitted && "border-primary bg-primary/5",
              submitted && option.id === exercise.correctOptionId && "border-success bg-green-50 text-green-800",
              submitted && selected === option.id && !isCorrect && "border-red-400 bg-red-50 text-red-800",
              !submitted && selected !== option.id && "border-border hover:border-primary/30"
            )}
          >
            {option.text}
          </button>
        ))}
      </div>

      {!submitted ? (
        <div className="px-4 py-3 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!selected}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary-light transition-colors"
          >
            Check Answer
          </button>
        </div>
      ) : (
        <div
          className={`px-4 py-3 border-t ${
            isCorrect
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {isCorrect ? (
                <>
                  <CheckCircle size={16} /> Correct!
                </>
              ) : (
                <>
                  <XCircle size={16} /> Not quite.
                </>
              )}
            </div>
            {!isCorrect && (
              <button
                onClick={handleRetry}
                className="text-sm font-medium underline"
              >
                Try again
              </button>
            )}
          </div>
          {submitted && (
            <p className="text-sm mt-1.5">{exercise.explanation}</p>
          )}
        </div>
      )}

      <XpToast amount={xpAwarded} onComplete={() => setXpAwarded(null)} />
    </div>
  );
}
