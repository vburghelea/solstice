#!/usr/bin/env tsx
/**
 * Generate synthetic SIN submissions for performance testing.
 *
 * Usage:
 *   npx tsx scripts/generate-sin-synthetic-data.ts --count 5000 --form annual
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { randomUUID } from "node:crypto";
import { formSubmissions, reportingSubmissions } from "../src/db/schema";

if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.e2e" });
}

const DEFAULT_IDS = {
  annualFormId: "a0000000-0000-4000-8002-000000000001",
  annualFormVersionId: "a0000000-0000-4000-8003-000000000001",
  quarterlyFormId: "a0000000-0000-4000-8002-000000000002",
  quarterlyFormVersionId: "a0000000-0000-4000-8003-000000000002",
  bcHockeyId: "a0000000-0000-4000-8001-000000000002",
  submitterId: "sin-user-pso-admin-001",
  annualTaskId: "a0000000-0000-4000-8005-000000000001",
} as const;

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

const count = Number(getArg("--count") ?? "1000");
const formMode = (getArg("--form") ?? "annual").toLowerCase();
const orgId = getArg("--org-id") ?? DEFAULT_IDS.bcHockeyId;
const submitterId = getArg("--submitter-id") ?? DEFAULT_IDS.submitterId;
const includeReporting = args.includes("--include-reporting");

if (!Number.isFinite(count) || count <= 0) {
  throw new Error("Provide a valid --count value.");
}

const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error("DATABASE_URL is required for synthetic data generation.");
}

const sqlConnection = postgres(connectionString, { max: 1 });
const db = drizzle(sqlConnection);

const buildAnnualPayload = (index: number) => {
  const total = 25000 + (index % 5000);
  const male = Math.round(total * 0.55);
  const female = Math.round(total * 0.43);
  return {
    total_participants: total,
    male_participants: male,
    female_participants: female,
    other_participants: total - male - female,
    youth_under_18: Math.round(total * 0.6),
    adults_18_plus: Math.round(total * 0.4),
    coaches_certified: 1200 + (index % 300),
    events_held: 40 + (index % 12),
    notes: "Synthetic record for perf testing.",
  };
};

const buildQuarterlyPayload = (index: number) => ({
  revenue_grants: 90000 + (index % 10000),
  revenue_fees: 40000 + (index % 5000),
  revenue_events: 8000 + (index % 1500),
  revenue_other: 1500 + (index % 700),
  expenses_programs: 56000 + (index % 6000),
  expenses_admin: 15000 + (index % 2000),
  expenses_facilities: 14000 + (index % 2500),
  supporting_docs: null,
});

const formConfig =
  formMode === "quarterly"
    ? {
        formId: DEFAULT_IDS.quarterlyFormId,
        formVersionId: DEFAULT_IDS.quarterlyFormVersionId,
        payloadBuilder: buildQuarterlyPayload,
      }
    : {
        formId: DEFAULT_IDS.annualFormId,
        formVersionId: DEFAULT_IDS.annualFormVersionId,
        payloadBuilder: buildAnnualPayload,
      };

const batchSize = 500;
type ReportingSubmissionInsert = typeof reportingSubmissions.$inferInsert;
let reportingInserted = false;

async function run() {
  console.log(
    `Generating ${count} synthetic ${formMode} submissions for org ${orgId}...`,
  );

  for (let offset = 0; offset < count; offset += batchSize) {
    const batch = Array.from({ length: Math.min(batchSize, count - offset) }).map(
      (_, index) => {
        const rowIndex = offset + index;
        return {
          id: randomUUID(),
          formId: formConfig.formId,
          formVersionId: formConfig.formVersionId,
          organizationId: orgId,
          submitterId,
          status: "submitted" as const,
          payload: formConfig.payloadBuilder(rowIndex),
          completenessScore: 100,
          submittedAt: new Date(),
        };
      },
    );

    await db.insert(formSubmissions).values(batch);

    if (includeReporting && formMode === "annual" && !reportingInserted) {
      const firstSubmission = batch[0];
      if (firstSubmission) {
        const reportingRow: ReportingSubmissionInsert = {
          taskId: DEFAULT_IDS.annualTaskId,
          organizationId: orgId,
          formSubmissionId: firstSubmission.id,
          status: "submitted",
          submittedAt: new Date(),
          submittedBy: submitterId,
        };
        await db.insert(reportingSubmissions).values(reportingRow).onConflictDoNothing();
        reportingInserted = true;
      }
    }

    console.log(`  • Inserted ${Math.min(batchSize, count - offset)} submissions`);
  }

  console.log("Synthetic data generation complete.");
}

run()
  .catch((error) => {
    console.error("Synthetic data generation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sqlConnection.end({ timeout: 3 });
  });
