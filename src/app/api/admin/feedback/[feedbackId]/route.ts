import { eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { adminSession } from "@/lib/request-auth";

const STATUSES = new Set(["new", "reviewed", "resolved"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ feedbackId: string }> }
) {
  if (!(await adminSession(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload: unknown = await request.json();
  const status =
    typeof payload === "object" && payload !== null && "status" in payload
      ? String(payload.status)
      : "";
  if (!STATUSES.has(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const { feedbackId } = await context.params;
  const [updated] = await db
    .update(feedback)
    .set({
      status: status as "new" | "reviewed" | "resolved",
      updatedAt: new Date(),
    })
    .where(eq(feedback.id, feedbackId))
    .returning({ id: feedback.id, status: feedback.status });

  if (!updated) {
    return Response.json({ error: "Feedback not found" }, { status: 404 });
  }
  return Response.json(updated);
}
