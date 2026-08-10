import type { Part } from "./progress/types";

export const MAX_FEEDBACK_COMMENT_LENGTH = 4000;

export interface FeedbackInput {
  lessonSlug: string;
  part: Part;
  stepId: string | null;
  kind: "lesson" | "inline";
  rating: number | null;
  comment: string | null;
}

export function parseFeedbackInput(payload: unknown): FeedbackInput | null {
  if (typeof payload !== "object" || payload === null) return null;
  const input = payload as Record<string, unknown>;
  const lessonSlug = typeof input.lessonSlug === "string" ? input.lessonSlug.trim() : "";
  const part = input.part;
  const kind = input.kind;
  const stepId = typeof input.stepId === "string" ? input.stepId.trim() : null;
  const rating = input.rating === null || input.rating === undefined ? null : Number(input.rating);
  const comment = typeof input.comment === "string" ? input.comment.trim() : null;

  if (!lessonSlug || lessonSlug.length > 200) return null;
  if (part !== "playground" && part !== "ide-projects") return null;
  if (kind !== "lesson" && kind !== "inline") return null;
  if (stepId && stepId.length > 200) return null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    return null;
  }
  if (comment && comment.length > MAX_FEEDBACK_COMMENT_LENGTH) return null;
  if (rating === null && !comment) return null;

  return { lessonSlug, part, stepId, kind, rating, comment: comment || null };
}
