import { describe, expect, it } from "vitest";
import { MAX_FEEDBACK_COMMENT_LENGTH, parseFeedbackInput } from "./feedback";

describe("feedback input", () => {
  const valid = {
    lessonSlug: "01-hello-kotlin",
    part: "playground",
    stepId: "concept-1",
    kind: "inline",
    rating: 4,
    comment: "The robot example helped.",
  };

  it("accepts ratings, comments, or both", () => {
    expect(parseFeedbackInput(valid)).toEqual(valid);
    expect(parseFeedbackInput({ ...valid, rating: null })).not.toBeNull();
    expect(parseFeedbackInput({ ...valid, comment: "" })).not.toBeNull();
  });

  it("requires useful content and a valid context", () => {
    expect(parseFeedbackInput({ ...valid, rating: null, comment: "" })).toBeNull();
    expect(parseFeedbackInput({ ...valid, rating: 0 })).toBeNull();
    expect(parseFeedbackInput({ ...valid, rating: 6 })).toBeNull();
    expect(parseFeedbackInput({ ...valid, part: "unknown" })).toBeNull();
  });

  it("limits comment size", () => {
    expect(
      parseFeedbackInput({
        ...valid,
        rating: null,
        comment: "x".repeat(MAX_FEEDBACK_COMMENT_LENGTH + 1),
      })
    ).toBeNull();
  });
});
