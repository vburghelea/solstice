import { createServerOnlyFn } from "@tanstack/react-start";
import type { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import type postgres from "postgres";
import * as schema from "./schema";

type DrizzleInstance = ReturnType<typeof drizzlePostgres>;
type SqlInstance = ReturnType<typeof postgres>;

type LinkedDatabase = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

// Singleton instances
let pooledInstance: DrizzleInstance | null = null;
let unpooledInstance: DrizzleInstance | null = null;
let pooledSql: SqlInstance | null = null;
let unpooledSql: SqlInstance | null = null;

const getLinkedDatabase = async (): Promise<LinkedDatabase | undefined> => {
  try {
    const { Resource } = await import("sst");
    const resource = Resource as typeof Resource & { Database?: LinkedDatabase };
    return resource.Database;
  } catch {
    return undefined;
  }
};

const buildConnectionString = (config: LinkedDatabase): string => {
  const username = encodeURIComponent(config.username);
  const password = encodeURIComponent(config.password);
  return `postgres://${username}:${password}@${config.host}:${config.port}/${config.database}`;
};

const shouldRequireSsl = (connectionString: string): boolean => {
  try {
    const { hostname } = new URL(connectionString);
    return !["localhost", "127.0.0.1"].includes(hostname);
  } catch {
    return true;
  }
};

const getConnectionString = async (mode: "pooled" | "unpooled"): Promise<string> => {
  const linked = await getLinkedDatabase();
  if (linked) {
    return buildConnectionString(linked);
  }

  const { getPooledDbUrl, getUnpooledDbUrl } = await import("../lib/env.server");
  return mode === "pooled" ? getPooledDbUrl() : getUnpooledDbUrl();
};

const createSqlClient = async (
  connectionString: string,
  options: { max: number; idle_timeout: number; connect_timeout: number },
): Promise<SqlInstance> => {
  const ssl = shouldRequireSsl(connectionString) ? "require" : undefined;
  const { default: postgres } = await import("postgres");

  return postgres(connectionString, {
    ...options,
    ...(ssl ? { ssl } : {}),
  });
};

const createDrizzle = async (sql: SqlInstance): Promise<DrizzleInstance> => {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  return drizzle(sql, {
    schema,
    casing: "snake_case",
  });
};

/**
 * Pooled database connection using RDS Proxy where available.
 *
 * Uses SST linked resource credentials when present, otherwise falls back to
 * DATABASE_URL or provider-specific env vars.
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

  const connectionString = await getConnectionString("pooled");
  pooledSql = await createSqlClient(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
  pooledInstance = await createDrizzle(pooledSql);

  return pooledInstance;
});

/**
 * Unpooled (direct) database connection using standard postgres driver.
 *
 * Uses SST linked resource credentials when present, otherwise falls back to
 * DATABASE_URL_UNPOOLED or DATABASE_URL.
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

  const connectionString = await getConnectionString("unpooled");
  unpooledSql = await createSqlClient(connectionString, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 30,
  });
  unpooledInstance = await createDrizzle(unpooledSql);

  return unpooledInstance;
});

/**
 * Returns the appropriate database connection based on the environment.
 *
 * - In serverless environments: Uses pooled connection
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

  if (pooledSql) {
    promises.push(pooledSql.end({ timeout: 3 }));
    pooledSql = null;
    pooledInstance = null;
  }

  if (unpooledSql) {
    promises.push(unpooledSql.end({ timeout: 3 }));
    unpooledSql = null;
    unpooledInstance = null;
  }

  await Promise.all(promises);
  console.log("Database connections closed");
});
