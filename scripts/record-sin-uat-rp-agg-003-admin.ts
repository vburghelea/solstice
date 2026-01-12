#!/usr/bin/env tsx
/**
 * RP-AGG-003 (Admin-only): create cycle + assign task with reminder preview.
 * Uses shared workflow helper while skipping user submission steps.
 */

export {};

process.env["RUN_AS_HELPER"] = "true";

const { recordReportingWorkflow } = await import("./record-sin-uat-rp-agg-003");

await recordReportingWorkflow({ adminOnly: true, reqId: "RP-AGG-003-ADMIN" }).catch(
  (error) => {
    console.error("Admin reporting recording failed:", error);
    process.exit(1);
  },
);
