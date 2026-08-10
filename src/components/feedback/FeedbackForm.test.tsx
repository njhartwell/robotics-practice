import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FeedbackForm } from "./FeedbackForm";

describe("FeedbackForm", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("requires a rating or comment", () => {
    render(
      <FeedbackForm
        lessonSlug="01-hello-kotlin"
        part="playground"
        stepId="concept-1"
        kind="inline"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a rating or add a comment."
    );
  });

  it("submits the lesson and step context", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "feedback-1" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);
    render(
      <FeedbackForm
        lessonSlug="01-hello-kotlin"
        part="playground"
        stepId="concept-1"
        kind="inline"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "4 stars" }));
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Clear robot example" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body).toEqual({
      lessonSlug: "01-hello-kotlin",
      part: "playground",
      stepId: "concept-1",
      kind: "inline",
      rating: 4,
      comment: "Clear robot example",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Thanks—your feedback was sent"
    );
  });
});
