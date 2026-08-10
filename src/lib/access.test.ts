import { describe, expect, it } from "vitest";
import { isAdmin, isApproved, safeNextPath } from "./access";
import type { AuthSession } from "./auth";

function session(
  role: "student" | "admin",
  accessStatus: "pending" | "approved" | "rejected"
) {
  return { user: { role, accessStatus } } as AuthSession;
}

describe("access policy", () => {
  it("requires approval for application access", () => {
    expect(isApproved(session("student", "approved"))).toBe(true);
    expect(isApproved(session("student", "pending"))).toBe(false);
    expect(isApproved(null)).toBe(false);
  });

  it("requires both approval and the admin role", () => {
    expect(isAdmin(session("admin", "approved"))).toBe(true);
    expect(isAdmin(session("admin", "pending"))).toBe(false);
    expect(isAdmin(session("student", "approved"))).toBe(false);
  });

  it("only permits local redirect destinations", () => {
    expect(safeNextPath("/playground?lesson=one")).toBe(
      "/playground?lesson=one"
    );
    expect(safeNextPath("https://example.com")).toBe("/");
    expect(safeNextPath("//example.com")).toBe("/");
  });
});
