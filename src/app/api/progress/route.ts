import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userProgress } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createDefaultProgress } from "@/lib/progress/types";
import { isUserProgress } from "@/lib/progress/progress-payload";

async function currentSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}

export async function GET(request: Request) {
  const session = await currentSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await db.query.userProgress.findFirst({
    where: eq(userProgress.userId, session.user.id),
  });
  return Response.json({
    progress: row?.document ?? null,
    displayName: session.user.name,
  });
}

export async function PUT(request: Request) {
  const session = await currentSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: unknown = await request.json();
  if (!isUserProgress(payload)) {
    return Response.json({ error: "Invalid progress document" }, { status: 400 });
  }

  await db
    .insert(userProgress)
    .values({
      userId: session.user.id,
      document: payload,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProgress.userId,
      set: { document: payload, updatedAt: new Date() },
    });

  return Response.json({ saved: true });
}

export async function DELETE(request: Request) {
  const session = await currentSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const progress = createDefaultProgress();
  progress.profile.displayName = session.user.name;
  await db
    .insert(userProgress)
    .values({
      userId: session.user.id,
      document: progress,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: userProgress.userId,
      set: { document: progress, updatedAt: new Date() },
    });

  return Response.json({ cleared: true });
}
