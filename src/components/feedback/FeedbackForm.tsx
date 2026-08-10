"use client";

import { useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import type { Part } from "@/lib/progress/types";
import { MAX_FEEDBACK_COMMENT_LENGTH } from "@/lib/feedback";

interface FeedbackFormProps {
  lessonSlug: string;
  part: Part;
  stepId?: string;
  kind: "lesson" | "inline";
  onSubmitted?: () => void;
}

export function FeedbackForm({
  lessonSlug,
  part,
  stepId,
  kind,
  onSubmitted,
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (rating === null && !comment.trim()) {
      setError("Choose a rating or add a comment.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        lessonSlug,
        part,
        stepId: stepId ?? null,
        kind,
        rating,
        comment,
      }),
    });
    setIsSubmitting(false);
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      setError(result.error ?? "Could not send your feedback.");
      return;
    }

    setSubmitted(true);
    onSubmitted?.();
  }

  if (submitted) {
    return (
      <div role="status" className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        Thanks—your feedback was sent to the course team.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset>
        <legend className="text-sm font-semibold">How helpful was this?</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              aria-pressed={rating === value}
              onClick={() => setRating(value)}
              className="rounded p-1 text-amber-500 hover:bg-amber-50 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Star
                size={24}
                aria-hidden="true"
                fill={rating !== null && value <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-semibold">
        Comment <span className="font-normal text-muted">(optional)</span>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          maxLength={MAX_FEEDBACK_COMMENT_LENGTH}
          rows={4}
          placeholder="What worked well? What was confusing?"
          className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-normal"
        />
      </label>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-muted">
          {comment.length}/{MAX_FEEDBACK_COMMENT_LENGTH}
        </span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light disabled:opacity-60"
        >
          {isSubmitting ? "Sending…" : "Send feedback"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
