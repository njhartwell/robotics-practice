import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { databaseConfig } from "./config";

const client = createClient(databaseConfig(process.env));

export const db = drizzle(client, { schema });
export { client as databaseClient };
