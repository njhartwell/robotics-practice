import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

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
        defaultValue: "approved",
        input: false,
      },
    },
  },
});

export type AuthSession = typeof auth.$Infer.Session;
