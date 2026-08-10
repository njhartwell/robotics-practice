import { createHash, randomBytes } from "node:crypto";

export const INVITATION_LIFETIME_DAYS = 7;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiration(days = INVITATION_LIFETIME_DAYS) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
