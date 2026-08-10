import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { parseFeedbackInput } from "@/lib/feedback";
import { approvedSession } from "@/lib/request-auth";

export async function POST(request: Request) {
  const session = await approvedSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const input = parseFeedbackInput(payload);
  if (!input) {
    return Response.json(
      { error: "Add a 1–5 rating or a comment up to 4,000 characters" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(feedback)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      ...input,
    })
    .returning({ id: feedback.id, createdAt: feedback.createdAt });

  return Response.json(created, { status: 201 });
}
