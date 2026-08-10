import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation, user } from "@/db/schema";
import { hashInvitationToken, normalizeEmail } from "@/lib/invitations";
import { requestSession } from "@/lib/request-auth";

export async function POST(request: Request) {
  const session = await requestSession(request);
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload: unknown = await request.json();
  const token =
    typeof payload === "object" && payload !== null && "token" in payload
      ? String(payload.token)
      : "";
  if (!token) {
    return Response.json({ error: "Invitation token is required" }, { status: 400 });
  }

  const invite = await db.query.invitation.findFirst({
    where: and(
      eq(invitation.tokenHash, hashInvitationToken(token)),
      eq(invitation.status, "pending")
    ),
  });
  if (!invite || invite.expiresAt.getTime() <= Date.now()) {
    return Response.json({ error: "This invitation is invalid or expired" }, { status: 400 });
  }
  if (invite.email !== normalizeEmail(session.user.email)) {
    return Response.json(
      { error: "This invitation was sent to a different email address" },
      { status: 403 }
    );
  }

  await db.transaction(async (transaction) => {
    await transaction
      .update(user)
      .set({ accessStatus: "approved", updatedAt: new Date() })
      .where(eq(user.id, session.user.id));
    await transaction
      .update(invitation)
      .set({ status: "accepted", acceptedAt: new Date(), updatedAt: new Date() })
      .where(eq(invitation.id, invite.id));
  });

  return Response.json({ approved: true });
}
