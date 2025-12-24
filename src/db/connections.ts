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

// Connection state tracking
interface ConnectionState {
  instance: DrizzleInstance | null;
  sql: SqlInstance | null;
  lastConnectAttempt: number;
  consecutiveFailures: number;
  lastError: string | null;
  isConnecting: boolean;
}

const pooledState: ConnectionState = {
  instance: null,
  sql: null,
  lastConnectAttempt: 0,
  consecutiveFailures: 0,
  lastError: null,
  isConnecting: false,
};

const unpooledState: ConnectionState = {
  instance: null,
  sql: null,
  lastConnectAttempt: 0,
  consecutiveFailures: 0,
  lastError: null,
  isConnecting: false,
};

// Connection metrics for monitoring
export interface ConnectionMetrics {
  pooled: {
    consecutiveFailures: number;
    lastError: string | null;
    lastConnectAttempt: number;
    isConnected: boolean;
  };
  unpooled: {
    consecutiveFailures: number;
    lastError: string | null;
    lastConnectAttempt: number;
    isConnected: boolean;
  };
}

/**
 * Get current connection metrics for monitoring
 */
export const getConnectionMetrics = (): ConnectionMetrics => ({
  pooled: {
    consecutiveFailures: pooledState.consecutiveFailures,
    lastError: pooledState.lastError,
    lastConnectAttempt: pooledState.lastConnectAttempt,
    isConnected: pooledState.instance !== null,
  },
  unpooled: {
    consecutiveFailures: unpooledState.consecutiveFailures,
    lastError: unpooledState.lastError,
    lastConnectAttempt: unpooledState.lastConnectAttempt,
    isConnected: unpooledState.instance !== null,
  },
});

/**
 * Structured logging for database operations
 */
const dbLog = (
  level: "info" | "warn" | "error",
  message: string,
  context?: Record<string, unknown>,
) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    component: "database",
    message,
    ...context,
  };

  // Use structured JSON logging for CloudWatch
  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
};

/**
 * Mask sensitive parts of connection string for logging
 */
const maskConnectionString = (connectionString: string): string => {
  try {
    const url = new URL(connectionString);
    return `${url.protocol}//${url.username}:****@${url.host}${url.pathname}`;
  } catch {
    return "[invalid-connection-string]";
  }
};

const getLinkedDatabase = async (): Promise<LinkedDatabase | undefined> => {
  try {
    const { Resource } = await import("sst");
    const resource = Resource as typeof Resource & { Database?: LinkedDatabase };
    if (resource.Database) {
      dbLog("info", "Using SST linked database", {
        host: resource.Database.host,
        port: resource.Database.port,
        database: resource.Database.database,
      });
    }
    return resource.Database;
  } catch (error) {
    dbLog("info", "SST Resource not available, falling back to env vars", {
      error: error instanceof Error ? error.message : String(error),
    });
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

/**
 * Create a SQL client with enhanced error handling and logging
 */
const createSqlClient = async (
  connectionString: string,
  options: { max: number; idle_timeout: number; connect_timeout: number },
  mode: "pooled" | "unpooled",
): Promise<SqlInstance> => {
  const ssl = shouldRequireSsl(connectionString) ? "require" : undefined;
  const { default: postgres } = await import("postgres");

  const maskedUrl = maskConnectionString(connectionString);
  dbLog("info", `Creating ${mode} SQL client`, {
    mode,
    maxConnections: options.max,
    idleTimeout: options.idle_timeout,
    connectTimeout: options.connect_timeout,
    ssl: ssl ?? "disabled",
    endpoint: maskedUrl,
  });

  const isDebug = process.env["NODE_ENV"] === "development";

  const sql = postgres(connectionString, {
    ...options,
    ...(ssl ? { ssl } : {}),
    // Add connection lifecycle callbacks for monitoring
    onnotice: (notice) => {
      dbLog("info", "Database notice", { notice: notice["message"], mode });
    },
    ...(isDebug ? { debug: true } : {}),
  });

  return sql;
};

/**
 * Validate a database connection by running a simple query
 */
const validateConnection = async (
  sql: SqlInstance,
  mode: "pooled" | "unpooled",
  timeoutMs: number = 5000,
): Promise<boolean> => {
  const startTime = Date.now();

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    dbLog("info", `Validating ${mode} connection`, { timeoutMs });

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Connection validation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race the query against the timeout
    const result = await Promise.race([
      sql`SELECT 1 as health_check, current_timestamp as server_time`,
      timeoutPromise,
    ]);

    const duration = Date.now() - startTime;
    const serverTime = result[0] ? (result[0]["server_time"] as string) : undefined;
    dbLog("info", `Connection validated successfully`, {
      mode,
      durationMs: duration,
      serverTime,
    });

    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    dbLog("error", `Connection validation failed`, {
      mode,
      durationMs: duration,
      error: errorMessage,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    return false;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const createDrizzle = async (sql: SqlInstance): Promise<DrizzleInstance> => {
  const { drizzle } = await import("drizzle-orm/postgres-js");
  return drizzle(sql, {
    schema,
    casing: "snake_case",
  });
};

/**
 * Create a database connection with retry logic and validation
 */
const createConnectionWithRetry = async (
  mode: "pooled" | "unpooled",
  state: ConnectionState,
  options: { max: number; idle_timeout: number; connect_timeout: number },
  maxRetries: number = 2,
): Promise<DrizzleInstance> => {
  // Prevent concurrent connection attempts - wait for existing attempt
  if (state.isConnecting) {
    // Wait for existing attempt with timeout
    const maxWait = options.connect_timeout * 1000;
    const waitStart = Date.now();
    while (state.isConnecting && Date.now() - waitStart < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (state.instance) {
      return state.instance;
    }
  }

  state.isConnecting = true;
  state.lastConnectAttempt = Date.now();

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        dbLog("info", `Connection attempt ${attempt}/${maxRetries}`, { mode });

        const connectionString = await getConnectionString(mode);
        const sql = await createSqlClient(connectionString, options, mode);

        // Validate the connection with a test query
        const isValid = await validateConnection(
          sql,
          mode,
          options.connect_timeout * 1000,
        );

        if (!isValid) {
          // Close the failed connection
          await sql.end({ timeout: 1 }).catch(() => {});
          throw new Error("Connection validation failed");
        }

        const drizzle = await createDrizzle(sql);

        // Update state on success
        state.sql = sql;
        state.instance = drizzle;
        state.consecutiveFailures = 0;
        state.lastError = null;

        dbLog("info", `Database connection established successfully`, {
          mode,
          attempt,
        });

        return drizzle;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        state.consecutiveFailures++;
        state.lastError = errorMessage;

        dbLog("error", `Connection attempt ${attempt} failed`, {
          mode,
          attempt,
          maxRetries,
          consecutiveFailures: state.consecutiveFailures,
          error: errorMessage,
        });

        // Don't retry on the last attempt
        if (attempt < maxRetries) {
          // Exponential backoff: 500ms, 1000ms
          const backoffMs = 500 * Math.pow(2, attempt - 1);
          dbLog("info", `Waiting ${backoffMs}ms before retry`, { mode, backoffMs });
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    // All retries exhausted
    const finalError = new Error(
      `Failed to establish ${mode} database connection after ${maxRetries} attempts. Last error: ${state.lastError}`,
    );
    dbLog("error", "All connection attempts exhausted", {
      mode,
      maxRetries,
      consecutiveFailures: state.consecutiveFailures,
      lastError: state.lastError,
    });

    throw finalError;
  } finally {
    state.isConnecting = false;
  }
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
  // Return existing instance if available and healthy
  if (pooledState.instance) {
    return pooledState.instance;
  }

  return createConnectionWithRetry("pooled", pooledState, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
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
  if (unpooledState.instance) {
    return unpooledState.instance;
  }

  return createConnectionWithRetry("unpooled", unpooledState, {
    max: 1,
    idle_timeout: 0,
    connect_timeout: 30,
  });
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
    return await pooledDb();
  } else {
    return await unpooledDb();
  }
});

/**
 * Test database connectivity without affecting the main connection pool.
 * Returns detailed health check information.
 */
export const testConnection = createServerOnlyFn(
  async (): Promise<{
    healthy: boolean;
    latencyMs: number;
    error?: string;
    serverTime?: string;
    metrics: ConnectionMetrics;
  }> => {
    const startTime = Date.now();
    const metrics = getConnectionMetrics();

    try {
      dbLog("info", "Running database health check");

      const { isServerless } = await import("../lib/env.server");
      const db = isServerless() ? await pooledDb() : await unpooledDb();

      // Run a simple query to test connectivity
      const result = await db.execute<{ health_check: number; server_time: string }>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "SELECT 1 as health_check, current_timestamp as server_time" as any,
      );

      const latencyMs = Date.now() - startTime;

      dbLog("info", "Database health check passed", {
        latencyMs,
        serverTime: result[0]?.server_time,
      });

      return {
        healthy: true,
        latencyMs,
        serverTime: result[0]?.server_time,
        metrics,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      dbLog("error", "Database health check failed", {
        latencyMs,
        error: errorMessage,
      });

      return {
        healthy: false,
        latencyMs,
        error: errorMessage,
        metrics,
      };
    }
  },
);

/**
 * Cleanup function to close all database connections
 * Should be called when shutting down the server
 */
export const closeConnections = createServerOnlyFn(async () => {
  dbLog("info", "Closing database connections");
  const promises: Promise<void>[] = [];

  if (pooledState.sql) {
    promises.push(
      pooledState.sql.end({ timeout: 3 }).catch((err) => {
        dbLog("warn", "Error closing pooled connection", {
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    );
    pooledState.sql = null;
    pooledState.instance = null;
  }

  if (unpooledState.sql) {
    promises.push(
      unpooledState.sql.end({ timeout: 3 }).catch((err) => {
        dbLog("warn", "Error closing unpooled connection", {
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    );
    unpooledState.sql = null;
    unpooledState.instance = null;
  }

  await Promise.all(promises);
  dbLog("info", "Database connections closed");
});
