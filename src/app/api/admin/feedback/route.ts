import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { feedback, user } from "@/db/schema";
import { adminSession } from "@/lib/request-auth";

export async function GET(request: Request) {
  if (!(await adminSession(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const entries = await db
    .select({
      id: feedback.id,
      lessonSlug: feedback.lessonSlug,
      part: feedback.part,
      stepId: feedback.stepId,
      kind: feedback.kind,
      rating: feedback.rating,
      comment: feedback.comment,
      status: feedback.status,
      createdAt: feedback.createdAt,
      userName: user.name,
      userEmail: user.email,
    })
    .from(feedback)
    .innerJoin(user, eq(feedback.userId, user.id))
    .orderBy(desc(feedback.createdAt))
    .limit(100);

  return Response.json({ entries });
}
