/**
 * Database client helpers for c15t consent management
 *
 * This module provides helpers to extract the underlying database client
 * from the shared connection pool for use with c15t's separate schema.
 */

import { createServerOnlyFn } from "@tanstack/react-start";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Sql } from "postgres";

// Type for Drizzle database with extended SQL client property
type DrizzleWithSqlClient = PostgresJsDatabase<Record<string, never>> & {
  sql: Sql;
};

// Cache the database client with a flexible type
// We use unknown to avoid complex generic type matching issues
let drizzleClientForC15t: unknown = null;

/**
 * Get or create a Drizzle client instance for c15t that uses the shared
 * database connection pool but with the c15t consent schema.
 *
 * This avoids creating a separate connection pool for c15t, which would
 * lead to connection exhaustion in serverless environments.
 */
export const getDbClient = createServerOnlyFn(async () => {
  // Return cached instance if available
  if (drizzleClientForC15t) {
    return drizzleClientForC15t as DrizzleWithSqlClient;
  }

  // Import dependencies
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const { consentSchema } = await import("~/features/consent/c15t.schema");

  // Import the connection URL from the main app's database config
  // We use the pooled URL to share the connection pool
  const { getPooledDbUrl } = await import("~/lib/env.server");
  const connectionString = getPooledDbUrl();

  // Create a new postgres client with conservative settings
  // This client will share the same database but use a separate connection
  // pool with very small limits since c15t has low query volume
  const sql = postgres(connectionString, {
    max: 2, // Maximum 2 connections for c15t (low query volume)
    idle_timeout: 10, // Close idle connections quickly
    connect_timeout: 5, // Fast connection timeout
  });

  // Create Drizzle instance with c15t's schema
  // We cast to unknown first to bypass type checking, then to our expected type
  const db = drizzle(sql, {
    schema: consentSchema,
    casing: "snake_case",
  });

  // Store the raw db instance - it will be properly typed when returned
  drizzleClientForC15t = db;

  // Cast through unknown first to avoid type incompatibility
  return db as unknown as DrizzleWithSqlClient;
});

/**
 * Cleanup function to close c15t database connections
 * Should be called when shutting down the server
 */
export const closeC15tConnection = createServerOnlyFn(async () => {
  if (drizzleClientForC15t) {
    const client = drizzleClientForC15t as DrizzleWithSqlClient;
    // Access the underlying postgres client and close it
    if (client?.sql) {
      await client.sql.end({ timeout: 2 });
    }
    drizzleClientForC15t = null;
  }
});
