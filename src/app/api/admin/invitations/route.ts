import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { invitation, user } from "@/db/schema";
import { adminSession } from "@/lib/request-auth";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiration,
  normalizeEmail,
} from "@/lib/invitations";

export async function GET(request: Request) {
  if (!(await adminSession(request))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .update(invitation)
    .set({ status: "expired", updatedAt: new Date() })
    .where(
      and(
        eq(invitation.status, "pending"),
        lt(invitation.expiresAt, new Date())
      )
    );

  const [pendingUsers, invitations] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        accessStatus: user.accessStatus,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.accessStatus, "pending"))
      .orderBy(desc(user.createdAt)),
    db
      .select({
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })
      .from(invitation)
      .orderBy(desc(invitation.createdAt)),
  ]);

  return Response.json({ pendingUsers, invitations });
}

export async function POST(request: Request) {
  const session = await adminSession(request);
  if (!session) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload: unknown = await request.json();
  const email =
    typeof payload === "object" && payload !== null && "email" in payload
      ? normalizeEmail(String(payload.email))
      : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  const token = createInvitationToken();
  const expiresAt = invitationExpiration();
  await db
    .insert(invitation)
    .values({
      id: crypto.randomUUID(),
      email,
      tokenHash: hashInvitationToken(token),
      invitedBy: session.user.id,
      status: "pending",
      expiresAt,
      acceptedAt: null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: invitation.email,
      set: {
        tokenHash: hashInvitationToken(token),
        invitedBy: session.user.id,
        status: "pending",
        expiresAt,
        acceptedAt: null,
        updatedAt: new Date(),
      },
    });

  const inviteUrl = new URL("/sign-up", request.url);
  inviteUrl.searchParams.set("invite", token);
  return Response.json({ email, inviteUrl: inviteUrl.toString(), expiresAt });
}
