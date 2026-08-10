"use client";

import { useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import type { Part } from "@/lib/progress/types";
import { FeedbackForm } from "./FeedbackForm";

interface FeedbackDialogProps {
  lessonSlug: string;
  part: Part;
  stepId: string;
}

export function FeedbackDialog({ lessonSlug, part, stepId }: FeedbackDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-background hover:text-foreground"
      >
        <MessageCircle size={15} /> Feedback
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="feedback-dialog-title"
        className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-black/40"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="feedback-dialog-title" className="text-xl font-bold">
                Send lesson feedback
              </h2>
              <p className="mt-1 text-sm text-muted">
                Tell us about the concept currently on screen.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close feedback"
              onClick={() => dialogRef.current?.close()}
              className="rounded-lg p-1.5 text-muted hover:bg-background"
            >
              <X size={19} />
            </button>
          </div>
          <FeedbackForm
            lessonSlug={lessonSlug}
            part={part}
            stepId={stepId}
            kind="inline"
          />
        </div>
      </dialog>
    </>
  );
}
