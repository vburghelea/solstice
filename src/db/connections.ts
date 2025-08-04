import { Pool, neonConfig } from "@neondatabase/serverless";
import { serverOnly } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Pooled database connection using Neon's serverless driver.
 *
 * Uses DATABASE_URL (pooled) or NETLIFY_DATABASE_URL for serverless functions.
 * This connection goes through Neon's connection pooler for efficient
 * concurrent request handling.
 *
 * Use this for:
 * - API routes and serverless functions
 * - Short-lived queries
 * - High-concurrency scenarios
 */
export const pooledDb = serverOnly(async () => {
  const { getPooledDbUrl, isServerless } = await import("../lib/env.server");

  // Configure Neon for serverless environments
  if (isServerless()) {
    neonConfig.useSecureWebSocket = true;
    neonConfig.poolQueryViaFetch = true;
  }

  const connectionString = getPooledDbUrl();

  const pool = new Pool({ connectionString });
  return drizzleNeon({
    client: pool,
    schema,
    casing: "snake_case",
  });
});

/**
 * Unpooled (direct) database connection using standard postgres driver.
 *
 * Uses DATABASE_URL_UNPOOLED or NETLIFY_DATABASE_URL_UNPOOLED for
 * migrations and long operations. This creates a direct connection
 * to the database without going through the pooler.
 *
 * Use this for:
 * - Database migrations
 * - Long-running operations
 * - Batch imports/exports
 * - Operations requiring session-level features
 */
export const unpooledDb = serverOnly(async () => {
  const { getUnpooledDbUrl } = await import("../lib/env.server");
  const connectionString = getUnpooledDbUrl();

  const sql = postgres(connectionString);
  return drizzlePostgres({
    client: sql,
    schema,
    casing: "snake_case",
  });
});

/**
 * Returns the appropriate database connection based on the environment.
 *
 * - In serverless environments (Netlify/Vercel): Uses pooled connection
 * - In development or traditional servers: Uses unpooled connection
 *
 * This is the recommended export for most use cases as it automatically
 * selects the optimal connection type.
 */
export const getDb = serverOnly(async () => {
  const { isServerless } = await import("../lib/env.server");
  if (isServerless()) {
    console.log("Using pooled connection for serverless environment");
    return await pooledDb();
  } else {
    console.log("Using unpooled connection for traditional environment");
    return await unpooledDb();
  }
});
