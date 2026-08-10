import { describe, expect, it } from "vitest";
import {
  createInvitationToken,
  hashInvitationToken,
  invitationExpiration,
  normalizeEmail,
} from "./invitations";

describe("invitations", () => {
  it("normalizes email addresses", () => {
    expect(normalizeEmail("  Student@Example.COM ")).toBe(
      "student@example.com"
    );
  });

  it("generates random tokens and deterministic hashes", () => {
    const first = createInvitationToken();
    const second = createInvitationToken();
    expect(first).not.toBe(second);
    expect(hashInvitationToken(first)).toHaveLength(64);
    expect(hashInvitationToken(first)).toBe(hashInvitationToken(first));
  });

  it("creates future expirations", () => {
    expect(invitationExpiration().getTime()).toBeGreaterThan(Date.now());
  });
});
