/**
 * Configure BI governance views and bi_readonly role.
 *
 * Usage:
 *   AWS_PROFILE=techdev npx sst shell --stage sin-uat -- npx tsx scripts/setup-bi-readonly-role.ts
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const sqlFilePath = path.resolve("src/features/bi/docs/sql-workbench-dba-setup.sql");

async function run() {
  console.log("Applying BI governance setup...");
  const setupSql = await readFile(sqlFilePath, "utf8");
  await sql.unsafe(setupSql);
  console.log("BI governance setup applied successfully.");
  await sql.end({ timeout: 3 });
}

run().catch((error) => {
  console.error("Failed to apply BI governance setup:", error);
  process.exit(1);
});
