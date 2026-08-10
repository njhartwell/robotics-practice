import type { AuthSession } from "./auth";

export type AccessStatus = "pending" | "approved" | "rejected";
export type UserRole = "student" | "admin";

export function isApproved(session: AuthSession | null) {
  return session?.user.accessStatus === "approved";
}

export function isAdmin(session: AuthSession | null) {
  return isApproved(session) && session?.user.role === "admin";
}

export function safeNextPath(value: string | null, fallback = "/") {
  if (!value?.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
