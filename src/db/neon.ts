import { Pool, neonConfig } from "@neondatabase/serverless";
import { serverOnly } from "@tanstack/react-start";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getPooledDbUrl, getUnpooledDbUrl, isServerless } from "../lib/env";
import * as schema from "./schema";

// Configure Neon for serverless environments
if (isServerless()) {
  neonConfig.useSecureWebSocket = true;
  neonConfig.poolQueryViaFetch = true;
}

/**
 * Creates a pooled database connection using Neon's serverless driver.
 *
 * Use pooled connections when:
 * - Running in serverless environments (Netlify Functions, Vercel Edge Functions)
 * - Handling HTTP requests that need quick connections
 * - You need connection pooling to handle concurrent requests efficiently
 * - Running short-lived queries
 *
 * The pooled connection uses Neon's connection pooler which maintains a pool
 * of connections to reduce connection overhead and improve performance.
 */
export const createPooledConnection = serverOnly(() => {
  const connectionString = getPooledDbUrl();

  const pool = new Pool({ connectionString });
  return drizzleNeon({
    client: pool,
    schema,
    casing: "snake_case",
  });
});

/**
 * Creates an unpooled (direct) database connection.
 *
 * Use unpooled connections when:
 * - Running long-lived operations (migrations, batch operations)
 * - Need session-level features (prepared statements, transactions with locks)
 * - Running in traditional server environments
 * - Performing database maintenance tasks
 *
 * The unpooled connection connects directly to the database without going
 * through Neon's connection pooler.
 */
export const createUnpooledConnection = serverOnly(() => {
  const connectionString = getUnpooledDbUrl();

  const sql = postgres(connectionString);
  return drizzlePostgres({
    client: sql,
    schema,
    casing: "snake_case",
  });
});

/**
 * Detects the environment and returns the appropriate connection type.
 * In serverless environments (Netlify/Vercel), uses pooled connections.
 * In development or traditional server environments, uses unpooled connections.
 */
export const createAutoConnection = serverOnly(() => {
  if (isServerless()) {
    console.log("Using pooled connection for serverless environment");
    return createPooledConnection();
  } else {
    console.log("Using unpooled connection for traditional environment");
    return createUnpooledConnection();
  }
});
