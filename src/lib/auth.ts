import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

if (process.env.VERCEL === "1") {
  if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) {
    throw new Error("Set BETTER_AUTH_URL to this deployment's HTTPS origin.");
  }
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("Set BETTER_AUTH_SECRET to at least 32 random characters on Vercel.");
  }
}

function optionalSocialProviders() {
  return {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET
      ? {
          microsoft: {
            clientId: process.env.MICROSOFT_CLIENT_ID,
            clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
            tenantId: process.env.MICROSOFT_TENANT_ID ?? "common",
          },
        }
      : {}),
  };
}

function bootstrapAdminEmails() {
  return new Set(
    (process.env.BOOTSTRAP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const auth = betterAuth({
  appName: "FRC Kotlin Tutorial",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "local-development-secret-change-before-deploying",
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        async before(newUser) {
          if (!bootstrapAdminEmails().has(newUser.email.toLowerCase())) return;

          return {
            data: {
              ...newUser,
              role: "admin",
              accessStatus: "approved",
            },
          };
        },
      },
    },
  },
  socialProviders: optionalSocialProviders(),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "student",
        input: false,
      },
      accessStatus: {
        type: "string",
        required: true,
        defaultValue: "pending",
        input: false,
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
