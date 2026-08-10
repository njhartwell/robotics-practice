import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { adminSession } from "@/lib/request-auth";
import type { AccessStatus, UserRole } from "@/lib/access";

const ACCESS_STATUSES = new Set<AccessStatus>(["approved", "rejected"]);
const USER_ROLES = new Set<UserRole>(["student", "admin"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const session = await adminSession(request);
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await context.params;
  const payload: unknown = await request.json();
  if (typeof payload !== "object" || payload === null) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const status =
    "status" in payload ? (String(payload.status) as AccessStatus) : null;
  const role = "role" in payload ? (String(payload.role) as UserRole) : null;
  if (!status || !ACCESS_STATUSES.has(status)) {
    return Response.json({ error: "Invalid approval status" }, { status: 400 });
  }
  if (role && !USER_ROLES.has(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }
  if (userId === session.user.id && (status !== "approved" || role === "student")) {
    return Response.json(
      { error: "You cannot remove your own administrator access" },
      { status: 400 }
    );
  }

  const updated = await db
    .update(user)
    .set({
      accessStatus: status,
      ...(role ? { role } : {}),
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId))
    .returning({
      id: user.id,
      role: user.role,
      accessStatus: user.accessStatus,
    });

  if (!updated[0]) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }
  return Response.json(updated[0]);
}
