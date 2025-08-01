#!/usr/bin/env tsx
/**
 * Clean up test users
 */

import dotenv from "dotenv";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { account, session, teams, user } from "../src/db/schema";

// Load environment variables
dotenv.config({ path: ".env.e2e" });

async function cleanTestUsers() {
  console.log("🧹 Cleaning up test users...");

  const connectionString = process.env["DATABASE_URL"] || "";

  if (!connectionString) {
    throw new Error("No database URL found. Please set DATABASE_URL");
  }
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Delete test teams first
    console.log("Deleting test teams...");
    await db.delete(teams).where(like(teams.description, "%E2E test%"));

    // Delete sessions
    console.log("Deleting test sessions...");
    await db.delete(session).where(like(session.userId, "test-%"));

    // Delete accounts
    console.log("Deleting test accounts...");
    await db.delete(account).where(eq(account.accountId, "test@example.com"));

    // Delete users
    console.log("Deleting test users...");
    await db.delete(user).where(eq(user.email, "test@example.com"));

    console.log("✅ Test users cleaned up successfully!");
  } catch (error) {
    console.error("❌ Error cleaning test users:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the function
cleanTestUsers().catch((error) => {
  console.error("Failed to clean:", error);
  process.exit(1);
});
