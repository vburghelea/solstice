#!/usr/bin/env tsx
/**
 * Hard reset for dev databases.
 *
 * DANGER: Truncates all tables (including audit logs). Use only when you need
 * a clean slate and set SIN_ALLOW_DEV_RESET=true explicitly.
 */

import dotenv from "dotenv";
import postgres from "postgres";

const shouldAllowReset = () => {
  const raw = process.env["SIN_ALLOW_DEV_RESET"];
  if (!raw) return false;
  return raw === "1" || raw.toLowerCase() === "true";
};

async function hardReset() {
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Refusing to run hard-reset-dev in production.");
  }

  if (!process.env["DATABASE_URL"]) {
    dotenv.config({ path: ".env" });
    dotenv.config({ path: ".env.e2e" });
  }

  if (!shouldAllowReset()) {
    throw new Error("SIN_ALLOW_DEV_RESET=true is required to run hard-reset-dev.");
  }

  const connectionString = process.env["DATABASE_URL"] || "";
  if (!connectionString) {
    throw new Error("No database URL found. Set DATABASE_URL.");
  }

  const sql = postgres(connectionString, { max: 1 });

  try {
    const rows = await sql<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `;

    const excluded = new Set(["__drizzle_migrations", "drizzle_migrations"]);
    const tables = rows.map((row) => row.tablename).filter((name) => !excluded.has(name));

    if (!tables.length) {
      console.log("No tables found to truncate.");
      return;
    }

    const quoted = tables.map((name) => `"${name.replace(/"/g, '""')}"`).join(", ");

    console.log("⚠️  Hard reset: truncating all tables (including audit logs)...");
    await sql.unsafe(`TRUNCATE TABLE ${quoted} RESTART IDENTITY CASCADE;`);
    console.log("✅ Hard reset complete.");
  } finally {
    await sql.end();
  }
}

hardReset().catch((error) => {
  console.error("❌ Hard reset failed:", error);
  process.exit(1);
});
