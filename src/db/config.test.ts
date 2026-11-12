import { describe, expect, it } from "vitest";
import { databaseConfig } from "./config";

describe("database configuration", () => {
  it("accepts Turso's environment names in Vercel", () => {
    expect(databaseConfig({
      VERCEL: "1", TURSO_DATABASE_URL: "libsql://example.turso.io", TURSO_AUTH_TOKEN: "token",
    })).toEqual({ url: "libsql://example.turso.io", authToken: "token" });
  });

  it("preserves explicit DATABASE settings when both names are configured", () => {
    expect(databaseConfig({
      DATABASE_URL: "libsql://primary.turso.io", DATABASE_AUTH_TOKEN: "primary",
      TURSO_DATABASE_URL: "libsql://other.turso.io", TURSO_AUTH_TOKEN: "other",
    })).toEqual({ url: "libsql://primary.turso.io", authToken: "primary" });
  });

  it("keeps the local development fallback", () => {
    expect(databaseConfig({ DATABASE_AUTH_TOKEN: "" })).toEqual({
      url: "file:./data/tutorial.db", authToken: undefined,
    });
  });

  it("rejects local files, token-shaped URLs, and missing tokens on Vercel", () => {
    for (const url of [undefined, "file:./data/tutorial.db", "not-a-url"]) {
      expect(() => databaseConfig({ VERCEL: "1", DATABASE_URL: url })).toThrow("database URL");
    }
    expect(() => databaseConfig({ VERCEL: "1", TURSO_DATABASE_URL: "libsql://example.turso.io" }))
      .toThrow("AUTH_TOKEN");
  });
});
