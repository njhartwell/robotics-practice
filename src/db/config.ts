type DatabaseEnvironment = Record<string, string | undefined>;

export function databaseConfig(env: DatabaseEnvironment) {
  const url = env.DATABASE_URL || env.TURSO_DATABASE_URL || "file:./data/tutorial.db";
  const authToken = env.DATABASE_AUTH_TOKEN || env.TURSO_AUTH_TOKEN || undefined;

  if (env.VERCEL === "1") {
    if (!url.startsWith("libsql://") && !url.startsWith("https://")) {
      throw new Error("Set DATABASE_URL or TURSO_DATABASE_URL to your hosted Turso database URL on Vercel.");
    }
    if (!authToken) {
      throw new Error("DATABASE_AUTH_TOKEN or TURSO_AUTH_TOKEN is required on Vercel.");
    }
  }

  return { url, authToken };
}
