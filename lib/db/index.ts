/**
 * Drizzle database client (postgres-js driver).
 *
 * `prepare: false` keeps us compatible with transaction-mode connection
 * poolers (Supabase pooler / PgBouncer). A module-level singleton avoids
 * exhausting connections across hot-reloaded serverless invocations.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/config/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  _pg?: ReturnType<typeof postgres>;
};

const client =
  globalForDb._pg ?? postgres(env.DATABASE_URL, { prepare: false });

if (process.env.NODE_ENV !== "production") globalForDb._pg = client;

export const db = drizzle(client, { schema });
export { schema };
