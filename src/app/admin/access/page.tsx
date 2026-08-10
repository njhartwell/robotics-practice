import { redirect } from "next/navigation";
import { AdminAccessClient } from "./AdminAccessClient";
import { getSession } from "@/lib/auth-session";
import { isAdmin } from "@/lib/access";
import { db } from "@/db";
import { invitation, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function AdminAccessPage() {
  const session = await getSession();
  if (!isAdmin(session)) redirect("/");

  const [pendingUsers, invitations] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

  return (
    <AdminAccessClient
      initialQueue={{
        pendingUsers: pendingUsers.map((pendingUser) => ({
          ...pendingUser,
          accessStatus: "pending" as const,
          createdAt: pendingUser.createdAt.toISOString(),
        })),
        invitations: invitations.map((invite) => ({
          ...invite,
          expiresAt: invite.expiresAt.toISOString(),
          createdAt: invite.createdAt.toISOString(),
        })),
      }}
    />
  );
}
