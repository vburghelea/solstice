/**
 * Seed retention policies for DSAR exports and other data types.
 *
 * Usage:
 *   AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx tsx scripts/seed-retention-policies.ts
 *   AWS_PROFILE=techprod npx sst shell --stage sin-prod -- npx tsx scripts/seed-retention-policies.ts
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { retentionPolicies } from "../src/db/schema/privacy.schema";

const DATABASE_URL = process.env["DATABASE_URL"];
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(sql);

const policies = [
  {
    dataType: "dsar_exports",
    retentionDays: 14,
    archiveAfterDays: null,
    purgeAfterDays: 30,
    legalHold: false,
  },
  {
    dataType: "audit_logs",
    retentionDays: 365 * 7, // 7 years for compliance
    archiveAfterDays: 90, // Archive to Glacier after 90 days
    purgeAfterDays: null, // Never purge (immutable)
    legalHold: false,
  },
  {
    dataType: "form_submissions",
    retentionDays: 365 * 3, // 3 years
    archiveAfterDays: 365,
    purgeAfterDays: 365 * 5,
    legalHold: false,
  },
  {
    dataType: "import_job_errors",
    retentionDays: 90, // Per ADR D0.8
    archiveAfterDays: null,
    purgeAfterDays: 90,
    legalHold: false,
  },
];

async function seed() {
  console.log("Seeding retention policies...\n");

  for (const policy of policies) {
    const existing = await db
      .select()
      .from(retentionPolicies)
      .where(eq(retentionPolicies.dataType, policy.dataType))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  [SKIP] ${policy.dataType} - already exists`);
      continue;
    }

    await db.insert(retentionPolicies).values(policy);
    console.log(`  [CREATE] ${policy.dataType} - ${policy.retentionDays} days retention`);
  }

  console.log("\nRetention policies seeded successfully.");
  await sql.end({ timeout: 3 });
}

seed().catch((err) => {
  console.error("Failed to seed retention policies:", err);
  process.exit(1);
});
