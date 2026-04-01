"use client";

import { useState } from "react";
import { useProgress } from "@/lib/progress/useProgress";
import { calculateXpAward } from "@/lib/gamification/xp";
import { validateFillInTheBlank } from "@/lib/content/exercise-validator";
import type { FillInTheBlankExercise as FITBType } from "@/lib/progress/types";
import { XpToast } from "@/components/gamification/XpToast";
import { InstructionText } from "./InstructionText";
import { CheckCircle, XCircle } from "lucide-react";

interface FillInTheBlankExerciseProps {
  exercise: FITBType;
}

export function FillInTheBlankExercise({
  exercise,
}: FillInTheBlankExerciseProps) {
  const { progress, awardXp, completeExercise } = useProgress();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const lessonProgress = progress.lessons[exercise.lessonSlug];
  const exerciseProgress = lessonProgress?.exercises[exercise.id];
  const alreadyCompleted = exerciseProgress?.completed ?? false;

  function handleSubmit() {
    if (!answer.trim()) return;
    setSubmitted(true);
    const correct = validateFillInTheBlank(answer, exercise.acceptedAnswers);
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
    setAnswer("");
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

      <div className="p-4">
        <p className="text-sm mb-3 font-mono">{exercise.prompt}</p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitted && handleSubmit()}
            disabled={submitted && isCorrect}
            className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono bg-background focus:outline-none focus:border-primary"
            placeholder="Type your answer..."
          />
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary-light transition-colors"
            >
              Check
            </button>
          ) : !isCorrect ? (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-light transition-colors"
            >
              Retry
            </button>
          ) : null}
        </div>
      </div>

      {submitted && (
        <div
          className={`px-4 py-3 border-t ${
            isCorrect
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
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
          <p className="text-sm mt-1.5">{exercise.explanation}</p>
        </div>
      )}

      <XpToast amount={xpAwarded} onComplete={() => setXpAwarded(null)} />
    </div>
  );
}
