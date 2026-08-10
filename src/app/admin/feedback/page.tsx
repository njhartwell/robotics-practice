import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { feedback, user } from "@/db/schema";
import { isAdmin } from "@/lib/access";
import { getSession } from "@/lib/auth-session";
import { AdminFeedbackClient } from "./AdminFeedbackClient";

export default async function AdminFeedbackPage() {
  const session = await getSession();
  if (!isAdmin(session)) redirect("/");

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

  return (
    <AdminFeedbackClient
      initialEntries={entries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      }))}
    />
  );
}
