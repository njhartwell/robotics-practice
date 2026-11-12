import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";
import { databaseConfig } from "./src/db/config";

loadEnvConfig(process.cwd());

export default defineConfig({
  dialect: "turso",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: databaseConfig(process.env),
});
