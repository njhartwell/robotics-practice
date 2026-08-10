"use client";

import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

interface FeedbackEntry {
  id: string;
  lessonSlug: string;
  part: "playground" | "ide-projects";
  stepId: string | null;
  kind: "lesson" | "inline";
  rating: number | null;
  comment: string | null;
  status: "new" | "reviewed" | "resolved";
  createdAt: string;
  userName: string;
  userEmail: string;
}

export function AdminFeedbackClient({
  initialEntries,
}: {
  initialEntries: FeedbackEntry[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [error, setError] = useState("");

  async function setStatus(
    feedbackId: string,
    status: FeedbackEntry["status"]
  ) {
    setError("");
    const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setError("Could not update this feedback item.");
      return;
    }
    setEntries((current) =>
      current.map((entry) =>
        entry.id === feedbackId ? { ...entry, status } : entry
      )
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Administration
        </p>
        <h1 className="mt-1 text-3xl font-bold">Lesson feedback</h1>
        <p className="mt-2 text-muted">
          Review the latest 100 comments and ratings from students.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {entries.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-muted">
          No feedback has been submitted yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link
                    href={`/${entry.part}/${entry.lessonSlug}`}
                    className="font-bold text-primary hover:underline"
                  >
                    {entry.lessonSlug}
                  </Link>
                  <p className="mt-1 text-xs text-muted">
                    {entry.kind === "inline" && entry.stepId
                      ? `During step ${entry.stepId}`
                      : "End-of-lesson review"}
                    {" · "}
                    {entry.userName} ({entry.userEmail})
                  </p>
                </div>
                <select
                  aria-label={`Status for feedback from ${entry.userName}`}
                  value={entry.status}
                  onChange={(event) =>
                    setStatus(
                      entry.id,
                      event.target.value as FeedbackEntry["status"]
                    )
                  }
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm capitalize"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              {entry.rating !== null && (
                <div
                  className="mt-3 flex gap-0.5 text-amber-500"
                  aria-label={`${entry.rating} out of 5 stars`}
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={17}
                      aria-hidden="true"
                      fill={value <= entry.rating! ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              )}
              {entry.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {entry.comment}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
