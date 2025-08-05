#!/usr/bin/env tsx
/**
 * Check database connections and optionally terminate idle ones
 * Run with: pnpm tsx scripts/check-db-connections.ts [--terminate-idle]
 */

import dotenv from "dotenv";
import postgres from "postgres";

// Load environment variables
dotenv.config();

async function checkConnections() {
  const connectionString = process.env["DATABASE_URL"] || "";

  if (!connectionString) {
    throw new Error("No database URL found. Please set DATABASE_URL");
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    console.log("🔍 Checking database connections...\n");

    // Query to check active connections
    const activeConnections = await sql`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        state_change,
        query_start,
        NOW() - query_start as query_duration,
        query
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND pid != pg_backend_pid()
      ORDER BY query_start DESC
    `;

    console.log(`Found ${activeConnections.length} active connections:\n`);

    activeConnections.forEach((conn) => {
      console.log(`PID: ${conn["pid"]}`);
      console.log(`User: ${conn["usename"]}`);
      console.log(`App: ${conn["application_name"]}`);
      console.log(`State: ${conn["state"]}`);
      console.log(`Duration: ${conn["query_duration"] || "N/A"}`);
      console.log(`Query: ${conn["query"]?.substring(0, 100)}...`);
      console.log("---");
    });

    // Check if we should terminate idle connections
    if (process.argv.includes("--terminate-idle")) {
      console.log("\n🧹 Terminating idle connections...");

      const terminated = await sql`
        SELECT pg_terminate_backend(pid) as terminated, pid
        FROM pg_stat_activity
        WHERE datname = current_database()
          AND pid != pg_backend_pid()
          AND state = 'idle'
          AND state_change < NOW() - INTERVAL '5 minutes'
      `;

      console.log(`Terminated ${terminated.length} idle connections`);
    }

    // Check connection limits
    const limits = await sql`
      SELECT 
        setting as max_connections
      FROM pg_settings 
      WHERE name = 'max_connections'
    `;

    const currentCount = await sql`
      SELECT count(*) as connection_count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;

    console.log(`\n📊 Connection Stats:`);
    console.log(`Current connections: ${currentCount[0]["connection_count"]}`);
    console.log(`Max connections: ${limits[0]["max_connections"]}`);
  } catch (error) {
    console.error("❌ Error checking connections:", error);
    throw error;
  } finally {
    await sql.end({ timeout: 3 });
  }
}

// Run the check
checkConnections().catch((error) => {
  console.error("Failed to check connections:", error);
  process.exit(1);
});
