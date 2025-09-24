import { Pool, neonConfig } from "@neondatabase/serverless";
import { createServerOnlyFn } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Singleton instances
let pooledInstance: ReturnType<typeof drizzleNeon> | null = null;
let unpooledInstance: ReturnType<typeof drizzlePostgres> | null = null;
let poolInstance: Pool | null = null;
let sqlInstance: ReturnType<typeof postgres> | null = null;

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
export const pooledDb = createServerOnlyFn(async () => {
  // Return existing instance if available
  if (pooledInstance) {
    return pooledInstance;
  }

  const { getPooledDbUrl, isServerless } = await import("../lib/env.server");

  // Configure Neon for serverless environments
  if (isServerless()) {
    neonConfig.useSecureWebSocket = true;
    neonConfig.poolQueryViaFetch = true;
  }

  const connectionString = getPooledDbUrl();

  poolInstance = new Pool({ connectionString });
  pooledInstance = drizzleNeon({
    client: poolInstance,
    schema,
    casing: "snake_case",
  });

  return pooledInstance;
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
export const unpooledDb = createServerOnlyFn(async () => {
  // Return existing instance if available
  if (unpooledInstance) {
    return unpooledInstance;
  }

  const { getUnpooledDbUrl } = await import("../lib/env.server");
  const connectionString = getUnpooledDbUrl();

  // Set a reasonable connection pool size
  sqlInstance = postgres(connectionString, {
    max: 10, // Maximum number of connections in the pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout
  });

  unpooledInstance = drizzlePostgres({
    client: sqlInstance,
    schema,
    casing: "snake_case",
  });

  return unpooledInstance;
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
export const getDb = createServerOnlyFn(async () => {
  const { isServerless } = await import("../lib/env.server");
  if (isServerless()) {
    console.log("Using pooled connection for serverless environment");
    return await pooledDb();
  } else {
    console.log("Using unpooled connection for traditional environment");
    return await unpooledDb();
  }
});

/**
 * Cleanup function to close all database connections
 * Should be called when shutting down the server
 */
export const closeConnections = createServerOnlyFn(async () => {
  const promises: Promise<void>[] = [];

  if (poolInstance) {
    promises.push(poolInstance.end());
    poolInstance = null;
    pooledInstance = null;
  }

  if (sqlInstance) {
    promises.push(sqlInstance.end({ timeout: 3 }));
    sqlInstance = null;
    unpooledInstance = null;
  }

  await Promise.all(promises);
  console.log("Database connections closed");
});
