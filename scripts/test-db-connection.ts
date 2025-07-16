import { sql } from "drizzle-orm";
import { getDb, pooledDb, unpooledDb } from "../src/db/connections";

async function testConnections() {
  console.log("Testing database connections...\n");

  // Test pooled connection
  try {
    console.log("1. Testing pooled connection...");
    const pooled = pooledDb();
    const pooledResult = await pooled.execute(sql`SELECT current_database(), version()`);
    console.log("✅ Pooled connection successful");
    // Handle both result types
    const rows = Array.isArray(pooledResult)
      ? pooledResult
      : (pooledResult as { rows: unknown[] }).rows;
    console.log("   Database:", rows?.[0]);
  } catch (error) {
    console.error("❌ Pooled connection failed:", error);
  }

  // Test unpooled connection
  try {
    console.log("\n2. Testing unpooled connection...");
    const unpooled = unpooledDb();
    const unpooledResult = await unpooled.execute(
      sql`SELECT current_database(), version()`,
    );
    console.log("✅ Unpooled connection successful");
    // Handle both result types
    const rows = Array.isArray(unpooledResult)
      ? unpooledResult
      : (unpooledResult as { rows: unknown[] }).rows;
    console.log("   Database:", rows?.[0]);
  } catch (error) {
    console.error("❌ Unpooled connection failed:", error);
  }

  // Test auto-selected connection
  try {
    console.log("\n3. Testing auto-selected connection...");
    const db = getDb();
    const dbResult = await db.execute(sql`SELECT current_database(), version()`);
    console.log("✅ Auto-selected connection successful");
    // Handle both result types
    const rows = Array.isArray(dbResult)
      ? dbResult
      : (dbResult as { rows: unknown[] }).rows;
    console.log("   Database:", rows?.[0]);
  } catch (error) {
    console.error("❌ Auto-selected connection failed:", error);
  }

  // Test schema access
  try {
    console.log("\n4. Testing schema access...");
    const db = getDb();
    const users = await db.execute(sql`SELECT COUNT(*) as count FROM "user"`);
    console.log("✅ Schema access successful");
    // Handle both result types
    const rows = Array.isArray(users) ? users : (users as { rows: unknown[] }).rows;
    console.log("   User count:", rows?.[0]);
  } catch (error) {
    console.error("❌ Schema access failed:", error);
  }

  process.exit(0);
}

testConnections().catch(console.error);
