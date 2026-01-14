#!/usr/bin/env tsx
/**
 * Seed script for viaSport SIN (Strength in Numbers) test data
 *
 * This script creates a realistic data environment for the SIN platform,
 * which is fundamentally different from the QC (Quadball Canada) platform.
 *
 * SIN is a data reporting and management platform for BC amateur sports organizations.
 *
 * Run with: npx tsx scripts/seed-sin-data.ts
 *
 * Test users created (all with password: demopassword123):
 * - admin@example.com - Platform admin (Solstice Admin)
 * - viasport-staff@example.com - viaSport staff (viaSport Admin)
 * - pso-admin@example.com - PSO administrator
 * - club-reporter@example.com - Club data reporter
 * - member@example.com - Regular member
 */

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { hashPassword } from "better-auth/crypto";
import { createHash, createHmac } from "crypto";
import dotenv from "dotenv";
import { like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type {
  DashboardLayout,
  PivotConfig,
  PivotQuery,
  WidgetConfig,
} from "../src/features/bi/bi.types";
import type { JsonRecord } from "../src/shared/lib/json";
import {
  accountLocks,
  account,
  auditLogs,
  biDashboards,
  biDashboardWidgets,
  biQueryLog,
  dataCatalogEntries,
  dataQualityRuns,
  delegatedAccess,
  forms,
  formSubmissionVersions,
  formSubmissions,
  formVersions,
  importJobErrors,
  importJobs,
  importMappingTemplates,
  legalHolds,
  notificationEmailDeliveries,
  notificationPreferences,
  notificationTemplates,
  notifications,
  organizationMembers,
  organizationInviteLinks,
  organizationInviteLinkUses,
  organizationJoinRequests,
  organizations,
  policyDocuments,
  privacyRequests,
  reportingCycles,
  reportingSubmissionHistory,
  reportingSubmissions,
  reportingTasks,
  retentionPolicies,
  roles,
  savedReports,
  scheduledNotifications,
  securityEvents,
  session,
  submissionFiles,
  supportRequests,
  templates,
  tutorialCompletions,
  twoFactor,
  user,
  userPolicyAcceptances,
  userRoles,
} from "../src/db/schema";

// ============================================================================
// MFA CONFIGURATION
// ============================================================================
// MFA is DISABLED by default for all demo accounts to reduce friction for
// evaluators. Users can enable MFA themselves via Settings > Security.
// ============================================================================

// Load environment variables (don't override SST-provided vars)
// When running via SST shell, DATABASE_URL is already set correctly
if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.e2e" });
}

const artifactsBucket = process.env["SIN_ARTIFACTS_BUCKET"] ?? "";
const artifactsRegion = process.env["AWS_REGION"] ?? "ca-central-1";
const s3Client = artifactsBucket ? new S3Client({ region: artifactsRegion }) : null;

const uploadSeedArtifact = async (params: {
  key: string;
  body: string;
  contentType: string;
}) => {
  if (!s3Client || !artifactsBucket) {
    return null;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: artifactsBucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );

  return {
    storageKey: params.key,
    sizeBytes: Buffer.byteLength(params.body),
  };
};

// Static IDs for predictable test data
// UUIDs must be RFC 4122 compliant (version nibble at pos 13, variant nibble at pos 17)
// Format: xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx (v4, variant 8/9/a/b)
const IDS = {
  // Users (non-UUID format is fine for user IDs)
  platformAdminId: "sin-user-platform-admin-001",
  viasportStaffId: "sin-user-viasport-staff-001",
  psoAdminId: "sin-user-pso-admin-001",
  clubReporterId: "sin-user-club-reporter-001",
  memberId: "sin-user-member-001",

  // Organizations (RFC 4122 compliant UUIDs)
  viasportBcId: "a0000000-0000-4000-8001-000000000001",
  bcHockeyId: "a0000000-0000-4000-8001-000000000002",
  bcSoccerId: "a0000000-0000-4000-8001-000000000003",
  bcAthleticsId: "a0000000-0000-4000-8001-000000000004",
  vanMinorHockeyId: "a0000000-0000-4000-8001-000000000005",
  victoriaHockeyId: "a0000000-0000-4000-8001-000000000006",
  whitecapsAcademyId: "a0000000-0000-4000-8001-000000000007",
  bcSoccerDevLeagueId: "a0000000-0000-4000-8001-000000000008",
  vanThunderbirdsId: "a0000000-0000-4000-8001-000000000009",
  northShoreClubId: "a0000000-0000-4000-8001-000000000010",

  // Forms (RFC 4122 compliant UUIDs)
  annualStatsFormId: "a0000000-0000-4000-8002-000000000001",
  quarterlyFinFormId: "a0000000-0000-4000-8002-000000000002",
  demographicsFormId: "a0000000-0000-4000-8002-000000000003",
  coachingFormId: "a0000000-0000-4000-8002-000000000004",
  bcHockeyFacilitiesFormId: "a0000000-0000-4000-8002-000000000005",
  bcHockeySafetyFormId: "a0000000-0000-4000-8002-000000000006",
  facilityUsageDemoFormId: "a0000000-0000-4000-8002-000000000007",

  // Form Versions (RFC 4122 compliant UUIDs)
  annualStatsFormV1Id: "a0000000-0000-4000-8003-000000000001",
  quarterlyFinFormV1Id: "a0000000-0000-4000-8003-000000000002",
  demographicsFormV1Id: "a0000000-0000-4000-8003-000000000003",
  coachingFormV1Id: "a0000000-0000-4000-8003-000000000004",
  bcHockeyFacilitiesFormV1Id: "a0000000-0000-4000-8003-000000000005",
  bcHockeySafetyFormV1Id: "a0000000-0000-4000-8003-000000000006",
  facilityUsageDemoFormV1Id: "a0000000-0000-4000-8003-000000000007",

  // Reporting Cycles (RFC 4122 compliant UUIDs)
  fy2425CycleId: "a0000000-0000-4000-8004-000000000001",
  q42024CycleId: "a0000000-0000-4000-8004-000000000002",
  q12025CycleId: "a0000000-0000-4000-8004-000000000003",
  q12026CycleId: "a0000000-0000-4000-8004-000000000004",

  // Reporting Tasks (RFC 4122 compliant UUIDs)
  annualTask1Id: "a0000000-0000-4000-8005-000000000001",
  annualTask2Id: "a0000000-0000-4000-8005-000000000002",
  annualTask3Id: "a0000000-0000-4000-8005-000000000003",
  quarterlyTask1Id: "a0000000-0000-4000-8005-000000000004",
  annualTask4Id: "a0000000-0000-4000-8005-000000000005",
  annualTask5Id: "a0000000-0000-4000-8005-000000000006",
  quarterlyTask2Id: "a0000000-0000-4000-8005-000000000007",
  q12026TaskId: "a0000000-0000-4000-8005-000000000008",
  viasportBcTaskId: "a0000000-0000-4000-8005-000000000009",

  // Policy Documents (RFC 4122 compliant UUIDs)
  privacyPolicyId: "a0000000-0000-4000-8006-000000000001",
  tosId: "a0000000-0000-4000-8006-000000000002",

  // Form Submissions (RFC 4122 compliant UUIDs)
  annualStatsSubmissionId: "a0000000-0000-4000-8007-000000000001",
  quarterlyFinSubmissionId: "a0000000-0000-4000-8007-000000000002",
  bcHockeyDraftSubmissionId: "a0000000-0000-4000-8007-000000000003",
  bcHockeyChangesRequestedSubmissionId: "a0000000-0000-4000-8007-000000000004",
  bcHockeyUnderReviewSubmissionId: "a0000000-0000-4000-8007-000000000005",
  bcHockeyApprovedSubmissionId: "a0000000-0000-4000-8007-000000000006",
  bcHockeyRejectedSubmissionId: "a0000000-0000-4000-8007-000000000007",
  facilityUsageDemoSubmissionId: "a0000000-0000-4000-8007-000000000008",

  // Submission Files (RFC 4122 compliant UUIDs)
  quarterlyFinFileId: "a0000000-0000-4000-8008-000000000001",
  facilityUsageDemoFileId: "a0000000-0000-4000-8008-000000000002",

  // Templates (RFC 4122 compliant UUIDs)
  reportingTemplateId: "a0000000-0000-4000-8009-000000000001",
  importsTemplateId: "a0000000-0000-4000-8009-000000000002",
  formsTemplateId: "a0000000-0000-4000-8009-000000000003",
  analyticsTemplateId: "a0000000-0000-4000-8009-000000000004",

  // Support Requests (RFC 4122 compliant UUIDs)
  supportRequestId1: "a0000000-0000-4000-8010-000000000001",
  supportRequestId2: "a0000000-0000-4000-8010-000000000002",

  // Saved Reports (RFC 4122 compliant UUIDs)
  savedReportId1: "a0000000-0000-4000-8011-000000000001",

  // Import Mapping Templates (RFC 4122 compliant UUIDs)
  importTemplateId1: "a0000000-0000-4000-8012-000000000001",

  // Notifications (RFC 4122 compliant UUIDs)
  notificationId1: "a0000000-0000-4000-8013-000000000001",
  notificationId2: "a0000000-0000-4000-8013-000000000002",

  // Organization Join Requests (RFC 4122 compliant UUIDs)
  joinRequestPendingId: "a0000000-0000-4000-8014-000000000001",
  joinRequestApprovedId: "a0000000-0000-4000-8014-000000000002",
  joinRequestDeniedId: "a0000000-0000-4000-8014-000000000003",

  // Delegated Access (RFC 4122 compliant UUIDs)
  delegatedAccessId1: "a0000000-0000-4000-8014-000000000004",

  // Organization Invite Links (RFC 4122 compliant UUIDs)
  inviteLinkAutoApproveId: "a0000000-0000-4000-8015-000000000001",
  inviteLinkApprovalId: "a0000000-0000-4000-8015-000000000002",
  inviteLinkExpiredId: "a0000000-0000-4000-8015-000000000003",

  // Invite Link Uses (RFC 4122 compliant UUIDs)
  inviteLinkUseId1: "a0000000-0000-4000-8016-000000000001",

  // Import Jobs (RFC 4122 compliant UUIDs)
  importJobPendingId: "a0000000-0000-4000-8017-000000000001",
  importJobValidatingId: "a0000000-0000-4000-8017-000000000002",
  importJobFailedId: "a0000000-0000-4000-8017-000000000003",
  importJobCompletedId: "a0000000-0000-4000-8017-000000000004",
  importJobRolledBackId: "a0000000-0000-4000-8017-000000000005",

  // Import Job Errors (RFC 4122 compliant UUIDs)
  importJobErrorId1: "a0000000-0000-4000-8018-000000000001",
  importJobErrorId2: "a0000000-0000-4000-8018-000000000002",

  // Notification Preferences (RFC 4122 compliant UUIDs)
  notificationPrefReportingId: "a0000000-0000-4000-8019-000000000001",
  notificationPrefSecurityId: "a0000000-0000-4000-8019-000000000002",
  notificationPrefSupportId: "a0000000-0000-4000-8019-000000000003",
  notificationPrefSystemId: "a0000000-0000-4000-8019-000000000004",

  // Scheduled Notifications (RFC 4122 compliant UUIDs)
  scheduledNotificationId1: "a0000000-0000-4000-8020-000000000001",
  scheduledNotificationId2: "a0000000-0000-4000-8020-000000000002",

  // Data Catalog Entries (RFC 4122 compliant UUIDs)
  dataCatalogEntryId1: "a0000000-0000-4000-8021-000000000001",
  dataCatalogEntryId2: "a0000000-0000-4000-8021-000000000002",
  dataCatalogEntryId3: "a0000000-0000-4000-8021-000000000003",

  // Data Quality Runs (RFC 4122 compliant UUIDs)
  dataQualityRunId1: "a0000000-0000-4000-8022-000000000001",
  dataQualityRunId2: "a0000000-0000-4000-8022-000000000002",

  // Security Events (RFC 4122 compliant UUIDs)
  securityEventId1: "a0000000-0000-4000-8023-000000000001",
  securityEventId2: "a0000000-0000-4000-8023-000000000002",

  // Account Locks (RFC 4122 compliant UUIDs)
  accountLockId1: "a0000000-0000-4000-8024-000000000001",
  accountLockId2: "a0000000-0000-4000-8024-000000000002",

  // Privacy Requests (RFC 4122 compliant UUIDs)
  privacyRequestId1: "a0000000-0000-4000-8025-000000000001",
  privacyRequestId2: "a0000000-0000-4000-8025-000000000002",
  privacyRequestId3: "a0000000-0000-4000-8025-000000000003",
  privacyRequestId4: "a0000000-0000-4000-8025-000000000004",

  // Legal Holds (RFC 4122 compliant UUIDs)
  legalHoldId1: "a0000000-0000-4000-8026-000000000001",
  legalHoldId2: "a0000000-0000-4000-8026-000000000002",

  // Form Submission Versions (RFC 4122 compliant UUIDs)
  submissionVersionId1: "a0000000-0000-4000-8027-000000000001",
  submissionVersionId2: "a0000000-0000-4000-8027-000000000002",

  // Reporting Submissions (RFC 4122 compliant UUIDs)
  reportingSubmissionAnnualId: "a0000000-0000-4000-8028-000000000001",
  reportingSubmissionQuarterlyId: "a0000000-0000-4000-8028-000000000002",
  reportingSubmissionChangesRequestedId: "a0000000-0000-4000-8028-000000000003",
  reportingSubmissionOverdueId: "a0000000-0000-4000-8028-000000000004",
  reportingSubmissionUnderReviewId: "a0000000-0000-4000-8028-000000000005",
  q12026SubmissionBcHockeyId: "a0000000-0000-4000-8028-000000000006",
  q12026SubmissionBcSoccerId: "a0000000-0000-4000-8028-000000000007",
  viasportBcSubmissionId: "a0000000-0000-4000-8028-000000000008",

  // Reporting Submission History (RFC 4122 compliant UUIDs)
  reportingHistoryId1: "a0000000-0000-4000-8029-000000000001",
  reportingHistoryId2: "a0000000-0000-4000-8029-000000000002",

  // BI Dashboards (RFC 4122 compliant UUIDs)
  biDashboardId1: "a0000000-0000-4000-8030-000000000001",
  biDashboardId2: "a0000000-0000-4000-8030-000000000002",

  // BI Dashboard Widgets (RFC 4122 compliant UUIDs)
  biWidgetId1: "a0000000-0000-4000-8031-000000000001",
  biWidgetId2: "a0000000-0000-4000-8031-000000000002",
  biWidgetId3: "a0000000-0000-4000-8031-000000000003",

  // BI Query Logs (RFC 4122 compliant UUIDs)
  biQueryLogId1: "a0000000-0000-4000-8032-000000000001",
  biQueryLogId2: "a0000000-0000-4000-8032-000000000002",
  biQueryLogId3: "a0000000-0000-4000-8032-000000000003",

  // Tutorial Progress (RFC 4122 compliant UUIDs)
  tutorialCompletionId1: "a0000000-0000-4000-8033-000000000001",
  tutorialCompletionId2: "a0000000-0000-4000-8033-000000000002",

  // Policy Acceptances (RFC 4122 compliant UUIDs)
  policyAcceptanceId1: "a0000000-0000-4000-8034-000000000001",
  policyAcceptanceId2: "a0000000-0000-4000-8034-000000000002",

  // Audit Logs (RFC 4122 compliant UUIDs)
  auditLogId1: "a0000000-0000-4000-8035-000000000001",
  auditLogId2: "a0000000-0000-4000-8035-000000000002",
} as const;

const stableStringify = (value: unknown): string => {
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `"${key}":${stableStringify(val)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
};

const hashValue = (value: unknown): string =>
  createHash("sha256").update(stableStringify(value)).digest("hex");

const hashQuery = (query: JsonRecord | string): string =>
  createHash("sha256")
    .update(typeof query === "string" ? query : JSON.stringify(query))
    .digest("hex");

const computeBiChecksum = (params: {
  id: string;
  userId: string;
  organizationId: string | null;
  queryType: "pivot" | "sql" | "export";
  queryHash: string;
  rowsReturned: number;
  executionTimeMs: number;
  previousLogId: string | null;
  createdAt: Date;
  previousChecksum: string | null;
  secret: string;
}): string => {
  const payload = JSON.stringify({
    id: params.id,
    userId: params.userId,
    organizationId: params.organizationId,
    queryType: params.queryType,
    queryHash: params.queryHash,
    rowsReturned: params.rowsReturned,
    executionTimeMs: params.executionTimeMs,
    previousLogId: params.previousLogId,
    createdAt: params.createdAt.toISOString(),
    previousChecksum: params.previousChecksum ?? "",
  });

  return createHmac("sha256", params.secret).update(payload).digest("hex");
};

// Deterministic UUID generator (keeps variant nibble set via namespace group)
const makeDeterministicUuid = (namespace: string, counter: number): string => {
  return `b0000000-0000-4000-${namespace}-${counter.toString().padStart(12, "0")}`;
};

async function seed() {
  console.log("🌱 Seeding viaSport SIN test data...");
  console.log("   This creates a realistic org hierarchy and reporting environment.\n");

  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Refusing to run seed-sin-data in production.");
  }

  const forceDatabaseUrl = process.argv.includes("--force");
  const connectionString =
    process.env["E2E_DATABASE_URL"] ||
    (forceDatabaseUrl ? process.env["DATABASE_URL"] : "") ||
    "";

  if (!connectionString) {
    throw new Error(
      "No database URL found. Set E2E_DATABASE_URL or pass --force to use DATABASE_URL.",
    );
  }

  // Get BETTER_AUTH_SECRET for encrypting backup codes
  const authSecret = process.env["BETTER_AUTH_SECRET"];
  if (!authSecret) {
    console.warn(
      "⚠️  BETTER_AUTH_SECRET not set - backup codes will not be properly encrypted.",
    );
    console.warn("   MFA backup code verification may not work in this environment.\n");
  }

  const sqlConnection = postgres(connectionString, { max: 1 });
  const db = drizzle(sqlConnection);

  try {
    // ========================================
    // PHASE 1: Clean up ALL existing data
    // ========================================
    console.log("Phase 1: Cleaning up existing data (including orphaned records)...");

    // First, clear parent_org_id references to break circular FK dependencies
    // This is necessary because organizations may have orphaned parent_org_id values
    console.log("   → Clearing organization parent references...");
    await db.execute(sql`UPDATE organizations SET parent_org_id = NULL`);

    // Now delete in correct order for FK constraints
    await db.delete(biDashboardWidgets);
    await db.delete(biDashboards);
    await db.delete(biQueryLog);
    await db.delete(dataCatalogEntries);
    await db.delete(dataQualityRuns);
    await db.delete(accountLocks);
    await db.delete(securityEvents);
    await db.delete(legalHolds);
    await db.delete(privacyRequests);
    await db.delete(notificationEmailDeliveries);
    await db.delete(notificationPreferences);
    await db.delete(notifications);
    await db.delete(scheduledNotifications);
    await db.delete(notificationTemplates);
    await db.delete(organizationInviteLinkUses);
    await db.delete(organizationInviteLinks);
    await db.delete(organizationJoinRequests);
    await db.delete(reportingSubmissionHistory);
    await db.delete(reportingSubmissions);
    await db.delete(reportingTasks);
    await db.delete(reportingCycles);
    await db.delete(auditLogs);
    await db.delete(submissionFiles);
    await db.delete(formSubmissionVersions);
    await db.delete(formSubmissions);
    await db.delete(importJobErrors);
    await db.delete(importJobs);
    await db.delete(importMappingTemplates);
    await db.delete(formVersions);
    await db.delete(forms);
    await db.delete(savedReports);
    await db.delete(supportRequests);
    await db.delete(templates);
    await db.delete(delegatedAccess);
    await db.delete(organizationMembers);
    await db.delete(retentionPolicies);
    await db.delete(userPolicyAcceptances);
    await db.delete(policyDocuments);
    await db.delete(tutorialCompletions);
    await db.delete(userRoles);

    // Delete twoFactor records for test users
    console.log("   → Cleaning up 2FA records...");
    await db.execute(sql`DELETE FROM "twoFactor" WHERE user_id LIKE 'sin-user-%'`);

    await db.delete(session).where(like(session.userId, "sin-user-%"));
    await db.delete(account).where(like(account.userId, "sin-user-%"));
    console.log("   → Skipping test user deletion (fixed users preserved)...");
    await db.delete(roles);

    console.log("   ✓ Cleaned existing data\n");

    // ========================================
    // PHASE 1.5: Ensure bi_readonly PostgreSQL role exists
    // ========================================
    // This role is required for Analytics/NL Query features.
    // It restricts query execution to SELECT-only for security.
    console.log("Phase 1.5: Ensuring bi_readonly PostgreSQL role exists...");
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bi_readonly') THEN
          CREATE ROLE bi_readonly NOLOGIN;
          RAISE NOTICE 'Created bi_readonly role';
        END IF;
      END
      $$;
    `);
    await db.execute(sql`GRANT SELECT ON ALL TABLES IN SCHEMA public TO bi_readonly`);
    await db.execute(sql`GRANT USAGE ON SCHEMA public TO bi_readonly`);
    await db.execute(sql`GRANT bi_readonly TO postgres`);
    await db.execute(
      sql`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO bi_readonly`,
    );
    console.log("   ✓ bi_readonly role configured\n");

    // ========================================
    // PHASE 2: Create roles
    // ========================================
    console.log("Phase 2: Creating roles...");

    await db.insert(roles).values([
      {
        id: "solstice-admin",
        name: "Solstice Admin",
        description: "Platform administrator with full system access",
        permissions: {
          "system:*": true,
          "roles:manage": true,
          "analytics.admin": true,
          "analytics.export": true,
        },
      },
      {
        id: "viasport-admin",
        name: "viaSport Admin",
        description: "viaSport administrator with organization-wide access",
        permissions: {
          "viasport:*": true,
          "orgs:manage": true,
          "reports:view": true,
          "forms:manage": true,
          "analytics.admin": true,
          "analytics.export": true,
        },
      },
      {
        id: "org-admin",
        name: "Organization Admin",
        description: "Administrator for a specific organization",
        permissions: {
          "org:manage": true,
          "org:members:manage": true,
          "org:reports:submit": true,
        },
      },
      {
        id: "org-reporter",
        name: "Organization Reporter",
        description: "Can submit reports for an organization",
        permissions: {
          "org:reports:submit": true,
          "org:reports:view": true,
        },
      },
    ]);
    console.log("   ✓ Created 4 roles\n");

    // ========================================
    // PHASE 3: Create test users
    // ========================================
    console.log("Phase 3: Creating test users...");

    // Demo credentials - all accounts use demopassword123
    const adminPassword = await hashPassword("demopassword123");
    const standardPassword = await hashPassword("demopassword123");

    const testUsers = [
      {
        id: IDS.platformAdminId,
        email: "global-admin@demo.com",
        name: "Global Admin",
        roleId: "solstice-admin",
        password: adminPassword,
      },
      {
        id: IDS.viasportStaffId,
        email: "viasport-staff@demo.com",
        name: "viaSport Staff Member",
        roleId: "viasport-admin",
        password: standardPassword,
      },
      {
        id: IDS.psoAdminId,
        email: "pso-admin@demo.com",
        name: "PSO Administrator",
        roleId: null, // Assigned via org membership
        password: standardPassword,
      },
      {
        id: IDS.clubReporterId,
        email: "club-reporter@demo.com",
        name: "Club Data Reporter",
        roleId: null, // Assigned via org membership
        password: standardPassword,
      },
      {
        id: IDS.memberId,
        email: "member@demo.com",
        name: "Regular Member",
        roleId: null,
        profileComplete: false,
        password: standardPassword,
      },
    ];

    for (const userData of testUsers) {
      const now = new Date();
      const profileComplete = userData.profileComplete ?? true;

      // MFA is disabled for all demo accounts to reduce friction for evaluators.
      // Users can enable MFA themselves via Settings > Security.
      await db
        .insert(user)
        .values({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          emailVerified: true,
          profileComplete,
          profileVersion: 1,
          createdAt: now,
          updatedAt: now,
          mfaRequired: false,
          twoFactorEnabled: false,
        })
        .onConflictDoUpdate({
          target: user.id,
          set: {
            email: userData.email,
            name: userData.name,
            emailVerified: true,
            profileComplete,
            profileVersion: 1,
            mfaRequired: false,
            twoFactorEnabled: false,
            updatedAt: now,
          },
        });

      await db
        .insert(account)
        .values({
          id: `${userData.id}-account`,
          userId: userData.id,
          providerId: "credential",
          accountId: userData.email,
          password: userData.password,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: account.id,
          set: {
            accountId: userData.email,
            password: userData.password,
            updatedAt: now,
          },
        });

      if (userData.roleId) {
        await db.insert(userRoles).values({
          id: `${userData.id}-role`,
          userId: userData.id,
          roleId: userData.roleId,
          assignedBy: IDS.platformAdminId,
          notes: "Seeded via seed-sin-data.ts",
        });
      }

      console.log(`   ✓ Created user: ${userData.email}`);
    }
    console.log("");

    // ========================================
    // PHASE 4: Create organization hierarchy
    // ========================================
    console.log("Phase 4: Creating organization hierarchy...");

    const upsertOrg = async (data: {
      id: string;
      name: string;
      slug: string;
      type: "governing_body" | "pso" | "league" | "club" | "affiliate";
      parentOrgId?: string;
      status?: "pending" | "active" | "suspended" | "archived";
      isDiscoverable?: boolean;
      joinRequestsEnabled?: boolean;
      settings?: JsonRecord;
      metadata?: JsonRecord;
    }) => {
      const now = new Date();
      const settings: JsonRecord = data.settings ?? {};
      const metadata: JsonRecord = data.metadata ?? {};
      const status = data.status ?? "active";
      const parentOrgId = data.parentOrgId ?? null;
      const isDiscoverable = data.isDiscoverable ?? false;
      const joinRequestsEnabled = data.joinRequestsEnabled ?? false;

      await db
        .insert(organizations)
        .values({
          id: data.id,
          name: data.name,
          slug: data.slug,
          type: data.type,
          parentOrgId,
          status,
          isDiscoverable,
          joinRequestsEnabled,
          settings,
          metadata,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: data.name,
            slug: data.slug,
            type: data.type,
            parentOrgId,
            status,
            isDiscoverable,
            joinRequestsEnabled,
            settings,
            metadata,
            updatedAt: now,
          },
        });
    };

    // Root: viaSport BC (governing body)
    await upsertOrg({
      id: IDS.viasportBcId,
      name: "viaSport BC",
      slug: "viasport-bc",
      type: "governing_body",
      status: "active",
      isDiscoverable: false,
      joinRequestsEnabled: false,
      settings: { fiscalYearEnd: "03-31" },
      metadata: { established: 2010 },
    });
    console.log("   ✓ viaSport BC (governing_body)");

    // PSOs under viaSport
    const psos = [
      {
        id: IDS.bcHockeyId,
        name: "BC Hockey",
        slug: "bc-hockey",
        isDiscoverable: true,
        joinRequestsEnabled: true,
        metadata: {
          reporting: {
            fiscalYearStart: "2024-04-01",
            fiscalYearEnd: "2025-03-31",
            reportingPeriodStart: "2024-04-01",
            reportingPeriodEnd: "2024-09-30",
            agreementId: "VS-BC-2024-001",
            agreementName: "viaSport Annual Grant",
            agreementStart: "2024-04-01",
            agreementEnd: "2025-03-31",
            nccpStatus: "Active",
            nccpNumber: "NCCP-BC-1234",
            primaryContactName: "Jordan Lee",
            primaryContactEmail: "jordan.lee@bchockey.ca",
            primaryContactPhone: "604-555-0199",
            reportingFrequency: "Annual",
          },
        },
      },
      {
        id: IDS.bcSoccerId,
        name: "BC Soccer",
        slug: "bc-soccer",
        isDiscoverable: true,
        joinRequestsEnabled: false,
      },
      {
        id: IDS.bcAthleticsId,
        name: "BC Athletics",
        slug: "bc-athletics",
        isDiscoverable: false,
        joinRequestsEnabled: false,
      },
    ];

    for (const pso of psos) {
      await upsertOrg({
        ...pso,
        type: "pso",
        parentOrgId: IDS.viasportBcId,
        status: "active",
        settings: {},
      });
      console.log(`   ✓ ${pso.name} (pso)`);
    }

    // Leagues under PSOs
    const leagues = [
      {
        id: IDS.vanMinorHockeyId,
        name: "Vancouver Minor Hockey",
        slug: "van-minor-hockey",
        parentId: IDS.bcHockeyId,
      },
      {
        id: IDS.bcSoccerDevLeagueId,
        name: "BC Soccer Development League",
        slug: "bc-soccer-dev",
        parentId: IDS.bcSoccerId,
      },
    ];

    for (const league of leagues) {
      await upsertOrg({
        id: league.id,
        name: league.name,
        slug: league.slug,
        type: "league",
        parentOrgId: league.parentId,
        status: "active",
        settings: {},
        metadata: {},
      });
      console.log(`   ✓ ${league.name} (league)`);
    }

    // Clubs
    const clubs = [
      {
        id: IDS.northShoreClubId,
        name: "North Shore Winter Club",
        slug: "north-shore-winter",
        parentId: IDS.vanMinorHockeyId,
        isDiscoverable: true,
        joinRequestsEnabled: true,
      },
      {
        id: IDS.victoriaHockeyId,
        name: "Victoria Hockey Association",
        slug: "victoria-hockey",
        parentId: IDS.bcHockeyId,
      },
      {
        id: IDS.whitecapsAcademyId,
        name: "Vancouver Whitecaps Academy",
        slug: "whitecaps-academy",
        parentId: IDS.bcSoccerId,
      },
      {
        id: IDS.vanThunderbirdsId,
        name: "Vancouver Thunderbirds",
        slug: "van-thunderbirds",
        parentId: IDS.bcAthleticsId,
      },
    ];

    for (const club of clubs) {
      await upsertOrg({
        id: club.id,
        name: club.name,
        slug: club.slug,
        type: "club",
        parentOrgId: club.parentId,
        status: "active",
        settings: {},
        metadata: {},
      });
      console.log(`   ✓ ${club.name} (club)`);
    }
    console.log("");

    // ========================================
    // PHASE 5: Assign organization memberships
    // ========================================
    console.log("Phase 5: Assigning organization memberships...");

    const memberships = [
      // viaSport staff is owner of viaSport BC
      { userId: IDS.viasportStaffId, orgId: IDS.viasportBcId, role: "owner" as const },
      // PSO admin is admin of BC Hockey
      { userId: IDS.psoAdminId, orgId: IDS.bcHockeyId, role: "admin" as const },
      // Club reporter is reporter for North Shore Winter Club
      {
        userId: IDS.clubReporterId,
        orgId: IDS.northShoreClubId,
        role: "reporter" as const,
      },
      // Member is viewer at Vancouver Minor Hockey
      { userId: IDS.memberId, orgId: IDS.vanMinorHockeyId, role: "viewer" as const },
    ];

    for (const mem of memberships) {
      await db.insert(organizationMembers).values({
        userId: mem.userId,
        organizationId: mem.orgId,
        role: mem.role,
        status: "active",
        approvedBy: IDS.viasportStaffId,
        approvedAt: new Date(),
      });
    }
    console.log(`   ✓ Created ${memberships.length} organization memberships\n`);

    // ========================================
    // PHASE 6: Seed organization access data
    // ========================================
    console.log("Phase 6: Seeding organization access data...");

    const inviteTokens = {
      autoApprove: "sin-invite-auto-approve-001",
      approvalRequired: "sin-invite-approval-001",
      expired: "sin-invite-expired-001",
    };

    await db.insert(organizationJoinRequests).values([
      {
        id: IDS.joinRequestPendingId,
        organizationId: IDS.bcHockeyId,
        userId: IDS.memberId,
        status: "pending",
        requestedRole: "member",
        message: "Interested in joining the organization.",
      },
      {
        id: IDS.joinRequestApprovedId,
        organizationId: IDS.bcHockeyId,
        userId: IDS.clubReporterId,
        status: "approved",
        requestedRole: "reporter",
        message: "Requesting reporter access for data submissions.",
        resolvedBy: IDS.viasportStaffId,
        resolvedAt: new Date(),
        resolutionNotes: "Approved for upcoming reporting cycle.",
      },
      {
        id: IDS.joinRequestDeniedId,
        organizationId: IDS.bcSoccerId,
        userId: IDS.memberId,
        status: "denied",
        requestedRole: "viewer",
        message: "Looking for view-only access.",
        resolvedBy: IDS.viasportStaffId,
        resolvedAt: new Date(),
        resolutionNotes: "Denied - organization access restricted.",
      },
    ]);

    await db.insert(organizationInviteLinks).values([
      {
        id: IDS.inviteLinkAutoApproveId,
        organizationId: IDS.bcHockeyId,
        token: inviteTokens.autoApprove,
        role: "member",
        autoApprove: true,
        maxUses: 5,
        useCount: 1,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.inviteLinkApprovalId,
        organizationId: IDS.bcHockeyId,
        token: inviteTokens.approvalRequired,
        role: "reporter",
        autoApprove: false,
        maxUses: null,
        useCount: 0,
        expiresAt: null,
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.inviteLinkExpiredId,
        organizationId: IDS.bcSoccerId,
        token: inviteTokens.expired,
        role: "viewer",
        autoApprove: true,
        maxUses: 3,
        useCount: 0,
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        createdBy: IDS.viasportStaffId,
      },
    ]);

    await db.insert(organizationInviteLinkUses).values([
      {
        id: IDS.inviteLinkUseId1,
        linkId: IDS.inviteLinkAutoApproveId,
        userId: IDS.clubReporterId,
        usedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      },
    ]);

    await db.insert(delegatedAccess).values([
      {
        id: IDS.delegatedAccessId1,
        delegateUserId: IDS.clubReporterId,
        organizationId: IDS.bcHockeyId,
        scope: "analytics",
        grantedBy: IDS.viasportStaffId,
        grantedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
        notes: "Delegated analytics access for reporting support.",
      },
    ]);

    console.log("   ✓ Seeded join requests, invite links, and delegated access\n");

    // ========================================
    // PHASE 7: Create forms
    // ========================================
    console.log("Phase 7: Creating forms...");

    const formsData = [
      {
        id: IDS.annualStatsFormId,
        versionId: IDS.annualStatsFormV1Id,
        name: "Annual Statistics Report",
        slug: "annual-stats",
        description: "Annual participant and activity statistics for PSOs",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "total_participants",
              type: "number",
              label: "Total Registered Participants",
              required: true,
            },
            {
              key: "male_participants",
              type: "number",
              label: "Male Participants",
              required: true,
            },
            {
              key: "female_participants",
              type: "number",
              label: "Female Participants",
              required: true,
            },
            {
              key: "other_participants",
              type: "number",
              label: "Other/Non-binary Participants",
              required: false,
            },
            {
              key: "youth_under_18",
              type: "number",
              label: "Youth (Under 18)",
              required: true,
            },
            {
              key: "adults_18_plus",
              type: "number",
              label: "Adults (18+)",
              required: true,
            },
            {
              key: "coaches_certified",
              type: "number",
              label: "Certified Coaches",
              required: true,
            },
            {
              key: "events_held",
              type: "number",
              label: "Events/Competitions Held",
              required: true,
            },
            {
              key: "notes",
              type: "textarea",
              label: "Additional Notes",
              required: false,
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.quarterlyFinFormId,
        versionId: IDS.quarterlyFinFormV1Id,
        name: "Quarterly Financial Summary",
        slug: "quarterly-financial",
        description: "Quarterly financial reporting for grant compliance",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "revenue_grants",
              type: "number",
              label: "Revenue - Grants",
              required: true,
            },
            {
              key: "revenue_fees",
              type: "number",
              label: "Revenue - Membership Fees",
              required: true,
            },
            {
              key: "revenue_events",
              type: "number",
              label: "Revenue - Events",
              required: true,
            },
            {
              key: "revenue_other",
              type: "number",
              label: "Revenue - Other",
              required: false,
            },
            {
              key: "expenses_programs",
              type: "number",
              label: "Expenses - Programs",
              required: true,
            },
            {
              key: "expenses_admin",
              type: "number",
              label: "Expenses - Administration",
              required: true,
            },
            {
              key: "expenses_facilities",
              type: "number",
              label: "Expenses - Facilities",
              required: true,
            },
            {
              key: "supporting_docs",
              type: "file",
              label: "Supporting Documents",
              required: false,
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.demographicsFormId,
        versionId: IDS.demographicsFormV1Id,
        name: "Participant Demographics Survey",
        slug: "demographics",
        description: "Optional demographic data collection",
        status: "draft" as const,
        definition: {
          fields: [
            {
              key: "indigenous_participants",
              type: "number",
              label: "Indigenous Participants",
              required: false,
            },
            {
              key: "newcomer_participants",
              type: "number",
              label: "Newcomer Participants",
              required: false,
            },
            {
              key: "disability_participants",
              type: "number",
              label: "Participants with Disabilities",
              required: false,
            },
            {
              key: "low_income_participants",
              type: "number",
              label: "Low-Income Participants",
              required: false,
            },
          ],
          settings: { allowDraft: true, requireApproval: false, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.coachingFormId,
        versionId: IDS.coachingFormV1Id,
        name: "Coaching Certification Tracker",
        slug: "coaching-certs",
        description: "Track NCCP and other coaching certifications",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "nccp_community",
              type: "number",
              label: "NCCP Community Sport",
              required: true,
            },
            {
              key: "nccp_competition",
              type: "number",
              label: "NCCP Competition",
              required: true,
            },
            {
              key: "nccp_instruction",
              type: "number",
              label: "NCCP Instruction",
              required: true,
            },
            {
              key: "other_certs",
              type: "number",
              label: "Other Certifications",
              required: false,
            },
            {
              key: "first_aid",
              type: "number",
              label: "First Aid Certified",
              required: true,
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.bcHockeyFacilitiesFormId,
        versionId: IDS.bcHockeyFacilitiesFormV1Id,
        organizationId: IDS.bcHockeyId,
        name: "Facility Usage Survey",
        slug: "facility-usage",
        description: "Facility usage and access tracking for BC Hockey programs",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "primary_venue",
              type: "text",
              label: "Primary Venue",
              required: true,
            },
            {
              key: "secondary_venue",
              type: "text",
              label: "Secondary Venue",
              required: false,
            },
            {
              key: "weekly_ice_hours",
              type: "number",
              label: "Weekly Ice Hours",
              required: true,
            },
            {
              key: "season_length_weeks",
              type: "number",
              label: "Season Length (weeks)",
              required: true,
            },
            {
              key: "facility_notes",
              type: "textarea",
              label: "Facility Notes",
              required: false,
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.bcHockeySafetyFormId,
        versionId: IDS.bcHockeySafetyFormV1Id,
        organizationId: IDS.bcHockeyId,
        name: "Safety Compliance Checklist",
        slug: "safety-compliance",
        description: "Track safety protocols and compliance requirements",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "concussion_protocol",
              type: "checkbox",
              label: "Concussion protocol is in place",
              required: true,
            },
            {
              key: "first_aid_certified",
              type: "checkbox",
              label: "Staff have current first aid certification",
              required: true,
            },
            {
              key: "emergency_plan_reviewed",
              type: "checkbox",
              label: "Emergency action plan reviewed",
              required: true,
            },
            {
              key: "safety_notes",
              type: "textarea",
              label: "Safety Notes",
              required: false,
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
      {
        id: IDS.facilityUsageDemoFormId,
        versionId: IDS.facilityUsageDemoFormV1Id,
        organizationId: IDS.viasportBcId,
        name: "Facility Usage Survey (Demo)",
        slug: "facility-usage-demo",
        description: "Demo facility usage survey with file upload",
        status: "published" as const,
        definition: {
          fields: [
            {
              key: "facility_name",
              type: "text",
              label: "Facility Name",
              required: true,
            },
            {
              key: "usage_date",
              type: "date",
              label: "Usage Date",
              required: true,
            },
            {
              key: "total_hours",
              type: "number",
              label: "Total Hours Used",
              required: true,
            },
            {
              key: "usage_report",
              type: "file",
              label: "Usage Report",
              required: true,
              fileConfig: { allowedTypes: ["application/pdf"] },
            },
          ],
          settings: { allowDraft: true, requireApproval: true, notifyOnSubmit: [] },
        },
      },
    ];

    for (const form of formsData) {
      await db.insert(forms).values({
        id: form.id,
        organizationId: form.organizationId ?? null,
        name: form.name,
        slug: form.slug,
        description: form.description,
        status: form.status,
        createdBy: IDS.viasportStaffId,
      });

      await db.insert(formVersions).values({
        id: form.versionId,
        formId: form.id,
        versionNumber: 1,
        definition: form.definition,
        publishedAt: form.status === "published" ? new Date() : null,
        publishedBy: form.status === "published" ? IDS.viasportStaffId : null,
      });

      console.log(`   ✓ ${form.name} (${form.status})`);
    }
    console.log("");

    // ========================================
    // PHASE 8: Create reporting cycles
    // ========================================
    console.log("Phase 8: Creating reporting cycles...");

    const now = new Date();
    const currentYear = now.getFullYear();

    await db.insert(reportingCycles).values([
      {
        id: IDS.fy2425CycleId,
        name: `FY ${currentYear}-${(currentYear + 1).toString().slice(-2)} Annual Reporting`,
        description: "Annual statistics and financial reporting cycle",
        startDate: `${currentYear}-04-01`,
        endDate: `${currentYear + 1}-03-31`,
        status: "active",
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.q42024CycleId,
        name: `Q4 ${currentYear - 1} Quarterly`,
        description: "Fourth quarter reporting",
        startDate: `${currentYear - 1}-10-01`,
        endDate: `${currentYear - 1}-12-31`,
        status: "closed",
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.q12025CycleId,
        name: `Q1 ${currentYear} Quarterly`,
        description: "First quarter reporting",
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-03-31`,
        status: "upcoming",
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.q12026CycleId,
        name: "Q1 2026 Quarterly",
        description: "Quarterly reporting cycle for Q1 2026",
        startDate: "2026-01-01",
        endDate: "2026-03-31",
        status: "active",
        createdBy: IDS.viasportStaffId,
      },
    ]);
    console.log("   ✓ Created 4 reporting cycles\n");

    // ========================================
    // PHASE 9: Create reporting tasks
    // ========================================
    console.log("Phase 9: Creating reporting tasks...");

    const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);
    const dueDateAnnual = new Date(currentYear + 1, 3, 30); // April 30 next year
    const dueDateQuarterly = new Date(currentYear, 4, 15); // May 15 this year
    const dueSoon = new Date();
    dueSoon.setDate(dueSoon.getDate() + 10);
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - 10);

    await db.insert(reportingTasks).values([
      {
        id: IDS.annualTask1Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.annualStatsFormId,
        organizationType: "pso",
        title: "Annual Statistics Report - PSOs",
        description: "All PSOs must submit annual participant statistics",
        dueDate: formatDateOnly(dueDateAnnual),
        reminderConfig: { daysBeforeDue: [30, 14, 7, 1] },
      },
      {
        id: IDS.annualTask2Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.coachingFormId,
        organizationType: "pso",
        title: "Coaching Certification Report - PSOs",
        description: "Annual coaching certification data",
        dueDate: formatDateOnly(dueDateAnnual),
        reminderConfig: { daysBeforeDue: [30, 14, 7] },
      },
      {
        id: IDS.annualTask3Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.quarterlyFinFormId,
        organizationId: IDS.bcHockeyId,
        title: "Annual Financial Summary - BC Hockey",
        description: "Year-end financial summary for BC Hockey",
        dueDate: formatDateOnly(dueDateAnnual),
        reminderConfig: { daysBeforeDue: [30, 14, 7, 1] },
      },
      {
        id: IDS.quarterlyTask1Id,
        cycleId: IDS.q12025CycleId,
        formId: IDS.quarterlyFinFormId,
        organizationType: "pso",
        title: "Q1 Financial Report - All PSOs",
        description: "Quarterly financial summary",
        dueDate: formatDateOnly(dueDateQuarterly),
        reminderConfig: { daysBeforeDue: [14, 7, 1] },
      },
      {
        id: IDS.annualTask4Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.bcHockeyFacilitiesFormId,
        organizationId: IDS.bcHockeyId,
        title: "Facility Usage Survey - BC Hockey",
        description: "Facility usage survey for the current season",
        dueDate: formatDateOnly(dueSoon),
        reminderConfig: { daysBeforeDue: [7, 3, 1] },
      },
      {
        id: IDS.annualTask5Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.bcHockeySafetyFormId,
        organizationId: IDS.bcHockeyId,
        title: "Safety Compliance Checklist - BC Hockey",
        description: "Annual safety compliance and protocol checklist",
        dueDate: formatDateOnly(overdueDate),
        reminderConfig: { daysBeforeDue: [7, 1] },
      },
      {
        id: IDS.quarterlyTask2Id,
        cycleId: IDS.q12025CycleId,
        formId: IDS.quarterlyFinFormId,
        organizationId: IDS.bcHockeyId,
        title: "Q2 Financial Check-in - BC Hockey",
        description: "Mid-season financial check-in",
        dueDate: formatDateOnly(dueSoon),
        reminderConfig: { daysBeforeDue: [14, 7] },
      },
      {
        id: IDS.q12026TaskId,
        cycleId: IDS.q12026CycleId,
        formId: IDS.annualStatsFormId,
        organizationType: "pso",
        title: "Q1 2026 Statistics Report - All PSOs",
        description: "Quarterly statistics for all PSOs",
        dueDate: "2026-03-15",
        reminderConfig: { daysBeforeDue: [14, 7, 3, 1] },
      },
      {
        id: IDS.viasportBcTaskId,
        cycleId: IDS.q12026CycleId,
        formId: IDS.facilityUsageDemoFormId,
        organizationId: IDS.viasportBcId,
        title: "Q1 2026 Facility Usage - viaSport BC",
        description: "Demonstrate viaSport BC task assignment for walkthroughs",
        dueDate: formatDateOnly(dueSoon),
        reminderConfig: { daysBeforeDue: [14, 7, 3, 1] },
      },
    ]);
    console.log("   ✓ Created 9 reporting tasks\n");

    // ========================================
    // PHASE 10: Create sample submissions
    // ========================================
    console.log("Phase 10: Creating sample form submissions...");

    const submittedAtAnnual = new Date(Date.now() - 1000 * 60 * 60 * 24 * 20);
    const submittedAtQuarterly = new Date(Date.now() - 1000 * 60 * 60 * 24 * 12);
    const submittedAtChangesRequested = new Date(Date.now() - 1000 * 60 * 60 * 24 * 8);
    const submittedAtUnderReview = new Date(Date.now() - 1000 * 60 * 60 * 24 * 4);
    const reviewedAtQuarterly = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
    const reviewedAtChangesRequested = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

    // Annual stats submission
    await db.insert(formSubmissions).values({
      id: IDS.annualStatsSubmissionId,
      formId: IDS.annualStatsFormId,
      formVersionId: IDS.annualStatsFormV1Id,
      organizationId: IDS.bcHockeyId,
      submitterId: IDS.psoAdminId,
      status: "submitted",
      payload: {
        total_participants: 45000,
        male_participants: 28000,
        female_participants: 16500,
        other_participants: 500,
        youth_under_18: 32000,
        adults_18_plus: 13000,
        coaches_certified: 3200,
        events_held: 850,
        notes: "Growth of 8% in female participation this year.",
      },
      completenessScore: 100,
      submittedAt: submittedAtAnnual,
    });

    // Quarterly financial submission (with optional file)
    const supportingDocs = await uploadSeedArtifact({
      key: `submissions/${IDS.quarterlyFinSubmissionId}/supporting-docs.csv`,
      body: "category,amount,currency\nFacility rentals,12450,CAD\nEquipment,7320,CAD\n",
      contentType: "text/csv",
    });

    const quarterlyPayload: JsonRecord = {
      revenue_grants: 98000,
      revenue_fees: 41250,
      revenue_events: 9200,
      revenue_other: 1300,
      expenses_programs: 58750,
      expenses_admin: 16200,
      expenses_facilities: 14100,
      supporting_docs: null,
    };

    if (supportingDocs) {
      quarterlyPayload["supporting_docs"] = {
        storageKey: supportingDocs.storageKey,
        fileName: "bc-hockey-q1-financials.csv",
        mimeType: "text/csv",
        sizeBytes: supportingDocs.sizeBytes,
        checksum: "seed",
      };
    } else {
      console.warn(
        "   ⚠️  SIN_ARTIFACTS_BUCKET not set; skipping submission file upload.",
      );
    }

    await db.insert(formSubmissions).values({
      id: IDS.quarterlyFinSubmissionId,
      formId: IDS.quarterlyFinFormId,
      formVersionId: IDS.quarterlyFinFormV1Id,
      organizationId: IDS.bcHockeyId,
      submitterId: IDS.psoAdminId,
      status: "submitted",
      payload: quarterlyPayload,
      completenessScore: 100,
      submittedAt: submittedAtQuarterly,
    });

    if (supportingDocs) {
      await db.insert(submissionFiles).values({
        id: IDS.quarterlyFinFileId,
        submissionId: IDS.quarterlyFinSubmissionId,
        fieldKey: "supporting_docs",
        fileName: "bc-hockey-q1-financials.csv",
        mimeType: "text/csv",
        sizeBytes: supportingDocs.sizeBytes,
        checksum: "seed",
        storageKey: supportingDocs.storageKey,
        uploadedBy: IDS.psoAdminId,
      });
    }

    // Facility usage submission (demo form with file upload)
    const facilityUsageReport = await uploadSeedArtifact({
      key: `submissions/${IDS.facilityUsageDemoSubmissionId}/usage-report.pdf`,
      body: "Sample facility usage report (seed data)",
      contentType: "application/pdf",
    });

    const facilityUsagePayload: JsonRecord = {
      facility_name: "Richmond Olympic Oval",
      usage_date: new Date().toISOString().slice(0, 10),
      total_hours: 42,
      usage_report: null,
    };

    if (facilityUsageReport) {
      facilityUsagePayload["usage_report"] = {
        storageKey: facilityUsageReport.storageKey,
        fileName: "usage-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: facilityUsageReport.sizeBytes,
        checksum: "seed",
      };
    } else {
      facilityUsagePayload["usage_report"] = {
        storageKey: "seed/usage-report.pdf",
        fileName: "usage-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 0,
        checksum: "seed",
      };
    }

    await db.insert(formSubmissions).values({
      id: IDS.facilityUsageDemoSubmissionId,
      formId: IDS.facilityUsageDemoFormId,
      formVersionId: IDS.facilityUsageDemoFormV1Id,
      organizationId: IDS.viasportBcId,
      submitterId: IDS.viasportStaffId,
      status: "submitted",
      payload: facilityUsagePayload,
      completenessScore: 100,
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    });

    if (facilityUsageReport) {
      await db.insert(submissionFiles).values({
        id: IDS.facilityUsageDemoFileId,
        submissionId: IDS.facilityUsageDemoSubmissionId,
        fieldKey: "usage_report",
        fileName: "usage-report.pdf",
        mimeType: "application/pdf",
        sizeBytes: facilityUsageReport.sizeBytes,
        checksum: "seed",
        storageKey: facilityUsageReport.storageKey,
        uploadedBy: IDS.viasportStaffId,
      });
    }

    // Additional form submissions for varied statuses
    await db.insert(formSubmissions).values([
      {
        id: IDS.bcHockeyDraftSubmissionId,
        formId: IDS.bcHockeyFacilitiesFormId,
        formVersionId: IDS.bcHockeyFacilitiesFormV1Id,
        organizationId: IDS.bcHockeyId,
        submitterId: IDS.psoAdminId,
        status: "draft",
        payload: {
          primary_venue: "North Shore Arena",
          secondary_venue: "Burnaby Ice Center",
          weekly_ice_hours: 96,
          season_length_weeks: 30,
          facility_notes: "Draft response - pending review.",
        },
        completenessScore: 65,
      },
      {
        id: IDS.bcHockeyChangesRequestedSubmissionId,
        formId: IDS.bcHockeyFacilitiesFormId,
        formVersionId: IDS.bcHockeyFacilitiesFormV1Id,
        organizationId: IDS.bcHockeyId,
        submitterId: IDS.psoAdminId,
        status: "changes_requested",
        payload: {
          primary_venue: "North Shore Arena",
          secondary_venue: "Burnaby Ice Center",
          weekly_ice_hours: 80,
          season_length_weeks: 28,
          facility_notes: "Updated after preliminary review.",
        },
        completenessScore: 85,
        submittedAt: submittedAtChangesRequested,
        reviewedAt: reviewedAtChangesRequested,
        reviewedBy: IDS.viasportStaffId,
        reviewNotes: "Please confirm weekly ice hours and venue details.",
      },
      {
        id: IDS.bcHockeyUnderReviewSubmissionId,
        formId: IDS.quarterlyFinFormId,
        formVersionId: IDS.quarterlyFinFormV1Id,
        organizationId: IDS.bcHockeyId,
        submitterId: IDS.psoAdminId,
        status: "under_review",
        payload: {
          revenue_grants: 52000,
          revenue_fees: 22800,
          revenue_events: 4100,
          revenue_other: 900,
          expenses_programs: 34000,
          expenses_admin: 9200,
          expenses_facilities: 8300,
          supporting_docs: null,
        },
        completenessScore: 92,
        submittedAt: submittedAtUnderReview,
      },
      {
        id: IDS.bcHockeyApprovedSubmissionId,
        formId: IDS.bcHockeySafetyFormId,
        formVersionId: IDS.bcHockeySafetyFormV1Id,
        organizationId: IDS.bcHockeyId,
        submitterId: IDS.psoAdminId,
        status: "approved",
        payload: {
          concussion_protocol: true,
          first_aid_certified: true,
          emergency_plan_reviewed: true,
          safety_notes: "All staff certified for the season.",
        },
        completenessScore: 100,
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
        reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
        reviewedBy: IDS.viasportStaffId,
      },
      {
        id: IDS.bcHockeyRejectedSubmissionId,
        formId: IDS.bcHockeySafetyFormId,
        formVersionId: IDS.bcHockeySafetyFormV1Id,
        organizationId: IDS.bcHockeyId,
        submitterId: IDS.psoAdminId,
        status: "rejected",
        payload: {
          concussion_protocol: false,
          first_aid_certified: false,
          emergency_plan_reviewed: false,
          safety_notes: "Missing updated certifications.",
        },
        completenessScore: 45,
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25),
        reviewedBy: IDS.viasportStaffId,
        reviewNotes: "Please provide updated certification evidence.",
      },
    ]);

    // Broad analytics dataset across PSOs and clubs for pivot/exports
    const analyticsOrgs = [
      IDS.bcHockeyId,
      IDS.bcSoccerId,
      IDS.bcAthleticsId,
      IDS.vanMinorHockeyId,
      IDS.victoriaHockeyId,
      IDS.whitecapsAcademyId,
      IDS.bcSoccerDevLeagueId,
      IDS.vanThunderbirdsId,
      IDS.northShoreClubId,
    ];

    const analyticsStatuses: Array<"submitted" | "approved" | "under_review" | "draft"> =
      ["submitted", "approved", "under_review", "draft"];

    const analyticsSubmissions = analyticsOrgs.flatMap((orgId, idx) => {
      return Array.from({ length: 3 }, (_, n) => {
        const status = analyticsStatuses[(idx + n) % analyticsStatuses.length];
        const submittedAt =
          status === "draft"
            ? null
            : new Date(Date.now() - (idx * 3 + n + 1) * 1000 * 60 * 60 * 24);

        return {
          id: makeDeterministicUuid("8007", 1000 + idx * 3 + n),
          formId: IDS.annualStatsFormId,
          formVersionId: IDS.annualStatsFormV1Id,
          organizationId: orgId,
          submitterId: IDS.psoAdminId,
          status,
          payload: {
            total_participants: 150 + 15 * (idx + n),
            male_participants: 80 + 10 * (idx + n),
            female_participants: 60 + 8 * (idx + n),
            youth_under_18: 90 + 12 * (idx + n),
            adults_18_plus: 60 + 6 * (idx + n),
            coaches_certified: 10 + (idx + n),
            events_held: 5 + (idx % 4),
          },
          completenessScore: 100,
          submittedAt: submittedAt ?? undefined,
        };
      });
    });

    const bcHockeyAnalyticsSubmissionId = makeDeterministicUuid("8007", 1000);
    const bcSoccerAnalyticsSubmissionId = makeDeterministicUuid("8007", 1003);

    await db.insert(formSubmissions).values(analyticsSubmissions);

    await db.insert(formSubmissionVersions).values([
      {
        id: IDS.submissionVersionId1,
        submissionId: IDS.bcHockeyChangesRequestedSubmissionId,
        versionNumber: 1,
        payloadSnapshot: {
          primary_venue: "North Shore Arena",
          secondary_venue: "Burnaby Ice Center",
          weekly_ice_hours: 72,
          season_length_weeks: 26,
          facility_notes: "Initial submission.",
        },
        changedBy: IDS.psoAdminId,
        changeReason: "Initial submission",
      },
      {
        id: IDS.submissionVersionId2,
        submissionId: IDS.bcHockeyChangesRequestedSubmissionId,
        versionNumber: 2,
        payloadSnapshot: {
          primary_venue: "North Shore Arena",
          secondary_venue: "Burnaby Ice Center",
          weekly_ice_hours: 80,
          season_length_weeks: 28,
          facility_notes: "Adjusted after feedback.",
        },
        changedBy: IDS.psoAdminId,
        changeReason: "Updated after reviewer feedback",
      },
    ]);

    await db.insert(reportingSubmissions).values([
      {
        id: IDS.reportingSubmissionAnnualId,
        taskId: IDS.annualTask1Id,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: IDS.annualStatsSubmissionId,
        status: "submitted",
        submittedAt: submittedAtAnnual,
        submittedBy: IDS.psoAdminId,
      },
      {
        id: IDS.reportingSubmissionQuarterlyId,
        taskId: IDS.quarterlyTask1Id,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: IDS.quarterlyFinSubmissionId,
        status: "approved",
        submittedAt: submittedAtQuarterly,
        submittedBy: IDS.psoAdminId,
        reviewedAt: reviewedAtQuarterly,
        reviewedBy: IDS.viasportStaffId,
        reviewNotes: "Financials approved.",
      },
      {
        id: IDS.reportingSubmissionChangesRequestedId,
        taskId: IDS.annualTask4Id,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: IDS.bcHockeyChangesRequestedSubmissionId,
        status: "changes_requested",
        submittedAt: submittedAtChangesRequested,
        submittedBy: IDS.psoAdminId,
        reviewedAt: reviewedAtChangesRequested,
        reviewedBy: IDS.viasportStaffId,
        reviewNotes: "Clarify weekly ice hours and venue access.",
      },
      {
        id: IDS.reportingSubmissionOverdueId,
        taskId: IDS.annualTask5Id,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: null,
        status: "overdue",
      },
      {
        id: IDS.reportingSubmissionUnderReviewId,
        taskId: IDS.quarterlyTask2Id,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: IDS.bcHockeyUnderReviewSubmissionId,
        status: "under_review",
        submittedAt: submittedAtUnderReview,
        submittedBy: IDS.psoAdminId,
      },
      {
        id: IDS.q12026SubmissionBcHockeyId,
        taskId: IDS.q12026TaskId,
        organizationId: IDS.bcHockeyId,
        formSubmissionId: null,
        status: "not_started",
      },
      {
        id: IDS.q12026SubmissionBcSoccerId,
        taskId: IDS.q12026TaskId,
        organizationId: IDS.bcSoccerId,
        formSubmissionId: bcSoccerAnalyticsSubmissionId,
        status: "submitted",
        submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        submittedBy: IDS.psoAdminId,
      },
      {
        id: IDS.viasportBcSubmissionId,
        taskId: IDS.viasportBcTaskId,
        organizationId: IDS.viasportBcId,
        formSubmissionId: IDS.facilityUsageDemoSubmissionId,
        status: "submitted",
        submittedAt: new Date(Date.now() - 1000 * 60 * 30),
        submittedBy: IDS.viasportStaffId,
      },
    ]);

    await db.insert(reportingSubmissionHistory).values([
      {
        id: IDS.reportingHistoryId1,
        reportingSubmissionId: IDS.reportingSubmissionChangesRequestedId,
        action: "submitted",
        actorId: IDS.psoAdminId,
        notes: "Submitted facility usage survey.",
        formSubmissionVersionId: IDS.submissionVersionId1,
      },
      {
        id: IDS.reportingHistoryId2,
        reportingSubmissionId: IDS.reportingSubmissionChangesRequestedId,
        action: "changes_requested",
        actorId: IDS.viasportStaffId,
        notes: "Requested updates to facility usage details.",
        formSubmissionVersionId: IDS.submissionVersionId1,
      },
    ]);

    console.log("   ✓ Created reporting and form submissions\n");

    // ========================================
    // PHASE 11: Create import jobs
    // ========================================
    console.log("Phase 11: Creating import jobs...");

    await db.insert(importJobs).values([
      {
        id: IDS.importJobPendingId,
        organizationId: IDS.bcHockeyId,
        type: "csv",
        lane: "interactive",
        sourceFileKey: "imports/bc-hockey/pending-upload.csv",
        sourceFileHash: "seed-pending-hash",
        sourceRowCount: 120,
        targetFormId: IDS.annualStatsFormId,
        mappingTemplateId: IDS.importTemplateId1,
        status: "pending",
        progressCheckpoint: 0,
        stats: { rowsProcessed: 0 },
        createdBy: IDS.psoAdminId,
      },
      {
        id: IDS.importJobValidatingId,
        organizationId: IDS.bcHockeyId,
        type: "csv",
        lane: "interactive",
        sourceFileKey: "imports/demo/import-demo-annual-stats-errors.csv",
        sourceFileHash: "seed-validating-hash",
        sourceRowCount: 4,
        targetFormId: IDS.annualStatsFormId,
        mappingTemplateId: IDS.importTemplateId1,
        status: "validating",
        progressCheckpoint: 2,
        stats: { rowsProcessed: 2 },
        createdBy: IDS.psoAdminId,
        startedAt: new Date(Date.now() - 1000 * 60 * 15),
      },
      {
        id: IDS.importJobFailedId,
        organizationId: IDS.bcHockeyId,
        type: "csv",
        lane: "batch",
        sourceFileKey: "imports/errors/import-demo-annual-stats-errors.csv",
        sourceFileHash: "seed-failed-hash",
        sourceRowCount: 4,
        targetFormId: IDS.annualStatsFormId,
        mappingTemplateId: IDS.importTemplateId1,
        status: "failed",
        progressCheckpoint: 4,
        stats: { rowsProcessed: 4, errors: 2 },
        errorReportKey: "imports/errors/import-demo-annual-stats-errors.csv",
        errorSummary: { missingFields: 1, invalidValues: 1 },
        createdBy: IDS.psoAdminId,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
      {
        id: IDS.importJobCompletedId,
        organizationId: IDS.bcHockeyId,
        type: "csv",
        lane: "interactive",
        sourceFileKey: "imports/demo/import-demo-annual-stats-large.csv",
        sourceFileHash: "seed-completed-hash",
        sourceRowCount: 50,
        targetFormId: IDS.annualStatsFormId,
        mappingTemplateId: IDS.importTemplateId1,
        status: "completed",
        progressCheckpoint: 50,
        stats: { rowsProcessed: 50 },
        createdBy: IDS.psoAdminId,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 23),
      },
      {
        id: IDS.importJobRolledBackId,
        organizationId: IDS.bcHockeyId,
        type: "excel",
        lane: "batch",
        sourceFileKey: "imports/bc-hockey/rolled-back.xlsx",
        sourceFileHash: "seed-rolledback-hash",
        sourceRowCount: 60,
        targetFormId: IDS.annualStatsFormId,
        mappingTemplateId: IDS.importTemplateId1,
        status: "rolled_back",
        progressCheckpoint: 60,
        stats: { rowsProcessed: 60 },
        createdBy: IDS.psoAdminId,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
      },
    ]);

    await db.insert(importJobErrors).values([
      {
        id: IDS.importJobErrorId1,
        jobId: IDS.importJobFailedId,
        rowNumber: 1,
        fieldKey: "certified_coaches",
        errorType: "required",
        errorMessage: "Missing required column: certified_coaches.",
        rawValue: null,
      },
      {
        id: IDS.importJobErrorId2,
        jobId: IDS.importJobFailedId,
        rowNumber: 2,
        fieldKey: "total_registered",
        errorType: "invalid",
        errorMessage: "Invalid number format.",
        rawValue: "not a number",
      },
    ]);

    console.log("   ✓ Created import jobs and errors\n");

    // ========================================
    // PHASE 12: Create import mapping templates
    // ========================================
    console.log("Phase 12: Creating import mapping templates...");

    await db.insert(importMappingTemplates).values([
      {
        id: IDS.importTemplateId1,
        organizationId: IDS.bcHockeyId,
        name: "BC Hockey Annual Stats Mapping",
        description: "Mapping template for annual stats submissions",
        targetFormId: IDS.annualStatsFormId,
        mappings: {
          total_participants: "Total Participants",
          male_participants: "Male Participants",
          female_participants: "Female Participants",
          youth_under_18: "Youth Under 18",
          adults_18_plus: "Adults 18+",
        },
        createdBy: IDS.viasportStaffId,
      },
    ]);
    console.log("   ✓ Created import mapping templates\n");

    // ========================================
    // PHASE 13: Create saved reports
    // ========================================
    console.log("Phase 13: Creating saved reports...");

    await db.insert(savedReports).values({
      id: IDS.savedReportId1,
      organizationId: IDS.bcHockeyId,
      name: "BC Hockey Submission Health",
      description: "Track completeness and submissions over time",
      dataSource: "form_submissions",
      filters: { organizationId: IDS.bcHockeyId },
      columns: ["status", "completenessScore", "submittedAt"],
      sort: { submittedAt: "desc" },
      ownerId: IDS.viasportStaffId,
      isOrgWide: true,
    });
    console.log("   ✓ Created saved reports\n");

    // ========================================
    // PHASE 14: Create templates
    // ========================================
    console.log("Phase 14: Creating templates...");

    if (!artifactsBucket) {
      console.warn("   ⚠️  SIN_ARTIFACTS_BUCKET not set; skipping template uploads.");
    } else {
      const reportingTemplate = await uploadSeedArtifact({
        key: `templates/reporting/${IDS.reportingTemplateId}-reporting-template.csv`,
        body: "metric,value\nparticipants,1200\ncoaches,45\n",
        contentType: "text/csv",
      });

      const importTemplate = await uploadSeedArtifact({
        key: `templates/imports/${IDS.importsTemplateId}-imports-template.csv`,
        body: "Total Participants,Male Participants,Female Participants\n1200,620,580\n",
        contentType: "text/csv",
      });

      const formsTemplate = await uploadSeedArtifact({
        key: `templates/forms/${IDS.formsTemplateId}-forms-template.csv`,
        body: "Field,Example\nTotal Participants,1200\nEvents Held,25\n",
        contentType: "text/csv",
      });

      const analyticsTemplate = await uploadSeedArtifact({
        key: `templates/analytics/${IDS.analyticsTemplateId}-analytics-template.csv`,
        body: "Month,Registrations\nJan,120\nFeb,140\nMar,160\n",
        contentType: "text/csv",
      });

      if (reportingTemplate && importTemplate && formsTemplate && analyticsTemplate) {
        await db.insert(templates).values([
          {
            id: IDS.reportingTemplateId,
            name: "Reporting Submission Template",
            description: "Baseline reporting CSV template",
            context: "reporting",
            tags: ["reporting", "csv"],
            storageKey: reportingTemplate.storageKey,
            fileName: "reporting-template.csv",
            mimeType: "text/csv",
            sizeBytes: reportingTemplate.sizeBytes,
            createdBy: IDS.viasportStaffId,
          },
          {
            id: IDS.importsTemplateId,
            name: "Import Mapping Template",
            description: "Template for bulk import mappings",
            context: "imports",
            tags: ["imports", "csv"],
            storageKey: importTemplate.storageKey,
            fileName: "imports-template.csv",
            mimeType: "text/csv",
            sizeBytes: importTemplate.sizeBytes,
            createdBy: IDS.viasportStaffId,
          },
          {
            id: IDS.formsTemplateId,
            name: "Form Submission Checklist",
            description: "Checklist for required form fields",
            context: "forms",
            tags: ["forms", "csv"],
            storageKey: formsTemplate.storageKey,
            fileName: "forms-template.csv",
            mimeType: "text/csv",
            sizeBytes: formsTemplate.sizeBytes,
            createdBy: IDS.viasportStaffId,
          },
          {
            id: IDS.analyticsTemplateId,
            name: "Analytics Snapshot Export",
            description: "Sample analytics export for quick reporting",
            context: "analytics",
            tags: ["analytics", "csv"],
            storageKey: analyticsTemplate.storageKey,
            fileName: "analytics-template.csv",
            mimeType: "text/csv",
            sizeBytes: analyticsTemplate.sizeBytes,
            createdBy: IDS.viasportStaffId,
          },
        ]);
        console.log("   ✓ Uploaded and created 4 templates\n");
      } else {
        console.warn("   ⚠️  Template uploads incomplete; skipping template records.\n");
      }
    }

    // ========================================
    // PHASE 15: Create BI dashboards + query logs
    // ========================================
    console.log("Phase 15: Creating BI dashboards and query logs...");

    const dashboardLayout: DashboardLayout = {
      columns: 12,
      rowHeight: 120,
      compactType: "vertical",
    };

    const submissionStatusQuery: PivotQuery = {
      datasetId: "reporting_submissions",
      organizationId: IDS.bcHockeyId,
      rows: ["status"],
      columns: [],
      measures: [{ field: "id", aggregation: "count", label: "Submissions" }],
      filters: [],
      limit: 1000,
    };

    const overdueKpiQuery: PivotQuery = {
      datasetId: "reporting_submissions",
      organizationId: IDS.bcHockeyId,
      rows: [],
      columns: [],
      measures: [{ field: "id", aggregation: "count", label: "Overdue" }],
      filters: [{ field: "status", operator: "eq", value: "overdue" }],
      limit: 1000,
    };

    const submissionStatusPivotConfig: PivotConfig = {
      rows: ["status"],
      columns: [],
      measures: [{ field: "id", aggregation: "count", label: "Submissions" }],
    };

    const submissionStatusWidgetConfig: WidgetConfig = {
      title: "Submissions by status",
      chartType: "bar",
      query: submissionStatusQuery,
    };

    const overdueKpiWidgetConfig: WidgetConfig = {
      title: "Overdue submissions",
      subtitle: "Immediate attention",
      query: overdueKpiQuery,
    };

    const sandboxWidgetConfig: WidgetConfig = {
      title: "Sandbox notes",
      textContent: "Draft space for upcoming analytics widgets.",
    };

    await db.insert(biDashboards).values([
      {
        id: IDS.biDashboardId1,
        organizationId: IDS.bcHockeyId,
        name: "BC Hockey Reporting Overview",
        description: "Submission status and compliance snapshot",
        layout: dashboardLayout,
        globalFilters: [],
        ownerId: IDS.viasportStaffId,
        sharedWith: [IDS.psoAdminId],
        isOrgWide: true,
        isPublished: true,
      },
      {
        id: IDS.biDashboardId2,
        organizationId: null,
        name: "Personal Analytics Sandbox",
        description: "Scratchpad for draft widgets and notes",
        layout: dashboardLayout,
        globalFilters: [],
        ownerId: IDS.viasportStaffId,
        sharedWith: [],
        isOrgWide: false,
        isPublished: false,
      },
    ]);

    await db.insert(biDashboardWidgets).values([
      {
        id: IDS.biWidgetId1,
        dashboardId: IDS.biDashboardId1,
        widgetType: "chart",
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        config: submissionStatusWidgetConfig,
      },
      {
        id: IDS.biWidgetId2,
        dashboardId: IDS.biDashboardId1,
        widgetType: "kpi",
        x: 6,
        y: 0,
        w: 3,
        h: 2,
        config: overdueKpiWidgetConfig,
      },
      {
        id: IDS.biWidgetId3,
        dashboardId: IDS.biDashboardId2,
        widgetType: "text",
        x: 0,
        y: 0,
        w: 6,
        h: 2,
        config: sandboxWidgetConfig,
      },
    ]);

    const biLogBaseTime = new Date(Date.now() - 1000 * 60 * 60 * 8);
    const biLogEntries = [
      {
        id: IDS.biQueryLogId1,
        userId: IDS.viasportStaffId,
        organizationId: IDS.bcHockeyId,
        queryType: "pivot" as const,
        queryHash: hashQuery(submissionStatusQuery),
        datasetId: null,
        sqlQuery: null,
        parameters: null,
        pivotConfig: submissionStatusPivotConfig,
        rowsReturned: 6,
        executionTimeMs: 184,
        createdAt: new Date(biLogBaseTime.getTime() + 1000 * 60 * 5),
      },
      {
        id: IDS.biQueryLogId2,
        userId: IDS.viasportStaffId,
        organizationId: IDS.bcHockeyId,
        queryType: "sql" as const,
        queryHash: hashQuery(
          "SELECT status, COUNT(*) FROM reporting_submissions GROUP BY status;",
        ),
        datasetId: null,
        sqlQuery: "SELECT status, COUNT(*) FROM reporting_submissions GROUP BY status;",
        parameters: { organizationId: IDS.bcHockeyId },
        pivotConfig: null,
        rowsReturned: 6,
        executionTimeMs: 92,
        createdAt: new Date(biLogBaseTime.getTime() + 1000 * 60 * 18),
      },
      {
        id: IDS.biQueryLogId3,
        userId: IDS.viasportStaffId,
        organizationId: IDS.bcHockeyId,
        queryType: "export" as const,
        queryHash: hashQuery(
          "SELECT * FROM reporting_submissions WHERE organization_id = $1;",
        ),
        datasetId: null,
        sqlQuery: "SELECT * FROM reporting_submissions WHERE organization_id = $1;",
        parameters: { organizationId: IDS.bcHockeyId },
        pivotConfig: null,
        rowsReturned: 5,
        executionTimeMs: 210,
        createdAt: new Date(biLogBaseTime.getTime() + 1000 * 60 * 30),
      },
    ];

    const biLogRows: Array<typeof biQueryLog.$inferInsert> = [];
    let previousLogId: string | null = null;
    let previousChecksum: string | null = null;

    for (const entry of biLogEntries) {
      const checksum: string | null = authSecret
        ? computeBiChecksum({
            id: entry.id,
            userId: entry.userId,
            organizationId: entry.organizationId,
            queryType: entry.queryType,
            queryHash: entry.queryHash,
            rowsReturned: entry.rowsReturned,
            executionTimeMs: entry.executionTimeMs,
            previousLogId,
            createdAt: entry.createdAt,
            previousChecksum,
            secret: authSecret,
          })
        : null;

      biLogRows.push({
        ...entry,
        previousLogId,
        checksum,
      });

      previousLogId = entry.id;
      previousChecksum = checksum ?? previousChecksum;
    }

    await db.insert(biQueryLog).values(biLogRows);

    console.log("   ✓ Created BI dashboards, widgets, and query logs\n");

    // ========================================
    // PHASE 16: Create data catalog entries
    // ========================================
    console.log("Phase 16: Creating data catalog entries...");

    await db.insert(dataCatalogEntries).values([
      {
        id: IDS.dataCatalogEntryId1,
        organizationId: null,
        sourceType: "form",
        sourceId: IDS.annualStatsFormId,
        title: "Annual Statistics Report",
        description: "Annual participant and activity statistics for PSOs",
        tags: ["form", "reporting"],
        metadata: { slug: "annual-stats", status: "published" },
        sourceUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.dataCatalogEntryId2,
        organizationId: IDS.bcHockeyId,
        sourceType: "import_template",
        sourceId: IDS.importTemplateId1,
        title: "BC Hockey Annual Stats Mapping",
        description: "Mapping template for annual stats submissions",
        tags: ["import", "template"],
        metadata: { targetFormId: IDS.annualStatsFormId },
        sourceUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8),
        createdBy: IDS.viasportStaffId,
      },
      {
        id: IDS.dataCatalogEntryId3,
        organizationId: IDS.bcHockeyId,
        sourceType: "saved_report",
        sourceId: IDS.savedReportId1,
        title: "BC Hockey Submission Health",
        description: "Track completeness and submissions over time",
        tags: ["report", "analytics"],
        metadata: { dataSource: "form_submissions", isOrgWide: true },
        sourceUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        createdBy: IDS.viasportStaffId,
      },
    ]);

    console.log("   ✓ Created data catalog entries\n");

    // ========================================
    // PHASE 17: Create support requests + notifications
    // ========================================
    console.log("Phase 17: Creating support requests and notifications...");

    await db.insert(supportRequests).values([
      {
        id: IDS.supportRequestId1,
        organizationId: IDS.bcHockeyId,
        userId: IDS.clubReporterId,
        subject: "Clarify reporting deadline",
        message: "Can you confirm the FY reporting deadline for our club?",
        category: "question",
        status: "open",
      },
      {
        id: IDS.supportRequestId2,
        organizationId: IDS.bcSoccerId,
        userId: IDS.psoAdminId,
        subject: "Template download issue",
        message: "The import template download returned an error.",
        category: "issue",
        status: "in_progress",
      },
    ]);

    await db.insert(notifications).values([
      {
        id: IDS.notificationId1,
        userId: IDS.clubReporterId,
        organizationId: IDS.bcHockeyId,
        type: "reporting_reminder",
        category: "reporting",
        title: "Reporting reminder",
        body: "Annual Statistics Report is due in 14 days.",
        link: "/dashboard/sin/reporting",
        metadata: { taskId: IDS.annualTask1Id },
      },
      {
        id: IDS.notificationId2,
        userId: IDS.psoAdminId,
        organizationId: IDS.bcHockeyId,
        type: "form_submission",
        category: "system",
        title: "Submission received",
        body: "Quarterly financial submission received for BC Hockey.",
        link: `/dashboard/sin/submissions/${IDS.quarterlyFinSubmissionId}`,
        metadata: { submissionId: IDS.quarterlyFinSubmissionId },
      },
    ]);

    console.log("   ✓ Created support requests and notifications\n");

    // ========================================
    // PHASE 18: Create notification templates
    // ========================================
    console.log("Phase 18: Creating notification templates...");

    await db.insert(notificationTemplates).values([
      {
        key: "reporting_reminder",
        category: "reporting",
        subject: "Reminder: {{task_name}} due in {{days_remaining}} days",
        bodyTemplate:
          "Your organization has a pending report: {{task_name}}. Please submit by {{due_date}}.",
        isSystem: true,
      },
      {
        key: "submission_approved",
        category: "reporting",
        subject: "Report Approved: {{task_name}}",
        bodyTemplate:
          "Your submission for {{task_name}} has been approved. Thank you for your timely reporting.",
        isSystem: true,
      },
      {
        key: "changes_requested",
        category: "reporting",
        subject: "Changes Requested: {{task_name}}",
        bodyTemplate:
          "Your submission for {{task_name}} requires changes. Reviewer notes: {{review_notes}}",
        isSystem: true,
      },
      {
        key: "welcome_org_member",
        category: "account",
        subject: "Welcome to {{org_name}}",
        bodyTemplate:
          "You have been added as a {{role}} for {{org_name}}. Log in to access your dashboard.",
        isSystem: true,
      },
      {
        key: "monthly_update",
        category: "system",
        subject: "viaSport SIN Monthly Update",
        bodyTemplate:
          "The latest SIN monthly update is ready for {{org_name}}. Visit the portal for details.",
        isSystem: false,
        createdBy: IDS.viasportStaffId,
      },
    ]);
    console.log("   ✓ Created 5 notification templates\n");

    // ========================================
    // PHASE 19: Create notification preferences + schedules
    // ========================================
    console.log("Phase 19: Creating notification preferences and schedules...");

    await db.insert(notificationPreferences).values([
      {
        id: IDS.notificationPrefReportingId,
        userId: IDS.viasportStaffId,
        category: "reporting",
        channelEmail: true,
        channelInApp: true,
        emailFrequency: "daily_digest",
      },
      {
        id: IDS.notificationPrefSecurityId,
        userId: IDS.viasportStaffId,
        category: "security",
        channelEmail: true,
        channelInApp: false,
        emailFrequency: "immediate",
      },
      {
        id: IDS.notificationPrefSupportId,
        userId: IDS.viasportStaffId,
        category: "support",
        channelEmail: false,
        channelInApp: true,
        emailFrequency: "weekly_digest",
      },
      {
        id: IDS.notificationPrefSystemId,
        userId: IDS.viasportStaffId,
        category: "system",
        channelEmail: true,
        channelInApp: true,
        emailFrequency: "immediate",
      },
    ]);

    const scheduledDueDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);
    await db.insert(scheduledNotifications).values([
      {
        id: IDS.scheduledNotificationId1,
        templateKey: "reporting_reminder",
        userId: IDS.clubReporterId,
        organizationId: IDS.bcHockeyId,
        scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 6),
        variables: {
          task_name: "Facility Usage Survey",
          days_remaining: 10,
          due_date: formatDateOnly(scheduledDueDate),
        },
      },
      {
        id: IDS.scheduledNotificationId2,
        templateKey: "changes_requested",
        organizationId: IDS.bcHockeyId,
        roleFilter: "reporter",
        scheduledFor: new Date(Date.now() - 1000 * 60 * 60 * 4),
        failedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        errorMessage: "Email service timeout",
        retryCount: 2,
        variables: {
          task_name: "Facility Usage Survey",
          review_notes: "Please confirm weekly ice hours and venue access.",
        },
      },
    ]);

    await db.insert(notificationEmailDeliveries).values([
      {
        notificationId: IDS.notificationId1,
        userId: IDS.clubReporterId,
        messageId: "seed-email-001",
        sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ]);

    console.log("   ✓ Created notification preferences and schedules\n");

    // ========================================
    // PHASE 20: Create tutorial progress
    // ========================================
    console.log("Phase 20: Creating tutorial progress...");

    await db.insert(tutorialCompletions).values([
      {
        id: IDS.tutorialCompletionId1,
        userId: IDS.psoAdminId,
        tutorialId: "onboarding",
        status: "completed",
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
      },
      {
        id: IDS.tutorialCompletionId2,
        userId: IDS.psoAdminId,
        tutorialId: "data_upload",
        status: "dismissed",
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
        dismissedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11),
      },
    ]);

    console.log("   ✓ Created tutorial progress\n");

    // ========================================
    // PHASE 21: Create security events + account locks
    // ========================================
    console.log("Phase 21: Creating security events and account locks...");

    await db.insert(securityEvents).values([
      {
        id: IDS.securityEventId1,
        userId: IDS.viasportStaffId,
        eventType: "mfa_challenge",
        ipAddress: "203.0.113.10",
        userAgent: "SeedScript/1.0",
        geoCountry: "CA",
        geoRegion: "BC",
        riskScore: 12,
        riskFactors: ["new_device"],
        metadata: { method: "totp" },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
      },
      {
        id: IDS.securityEventId2,
        userId: IDS.memberId,
        eventType: "login_failed",
        ipAddress: "198.51.100.23",
        userAgent: "SeedScript/1.0",
        geoCountry: "CA",
        geoRegion: "BC",
        riskScore: 72,
        riskFactors: ["multiple_failures"],
        metadata: { attempts: 5 },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
    ]);

    await db.insert(accountLocks).values([
      {
        id: IDS.accountLockId1,
        userId: IDS.memberId,
        reason: "Too many failed sign-in attempts",
        lockedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unlockAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
        metadata: { attempts: 6 },
      },
      {
        id: IDS.accountLockId2,
        userId: IDS.clubReporterId,
        reason: "Manual security hold",
        lockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        unlockedBy: IDS.viasportStaffId,
        unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        unlockReason: "Identity verified",
        metadata: { reasonCode: "manual_review" },
      },
    ]);

    console.log("   ✓ Created security events and account locks\n");

    // ========================================
    // PHASE 22: Create data quality runs
    // ========================================
    console.log("Phase 22: Creating data quality runs...");

    await db.insert(dataQualityRuns).values([
      {
        id: IDS.dataQualityRunId1,
        status: "success",
        summary: { checksRun: 12, warnings: 1, failures: 0 },
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 11),
      },
      {
        id: IDS.dataQualityRunId2,
        status: "failed",
        summary: { checksRun: 12, warnings: 2, failures: 1 },
        errorMessage: "Missing required fields in form submissions.",
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        completedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
    ]);

    console.log("   ✓ Created data quality run history\n");

    // ========================================
    // PHASE 23: Create audit log entries
    // ========================================
    console.log("Phase 23: Creating audit log entries...");

    const auditId = (index: number) => makeDeterministicUuid("8035", 200 + index);

    const auditSeedEntries = [
      {
        id: IDS.auditLogId1,
        action: "organization.update",
        actionCategory: "ADMIN",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        actorIp: "203.0.113.10",
        actorUserAgent: "SeedScript/1.0",
        targetType: "organization",
        targetId: IDS.bcHockeyId,
        targetOrgId: IDS.bcHockeyId,
        changes: {
          "metadata.reportingFrequency": { old: "Annual", new: "Quarterly" },
        },
        metadata: { source: "seed" },
        requestId: "seed-audit-001",
      },
      {
        id: IDS.auditLogId2,
        action: "reporting.submission.review",
        actionCategory: "DATA",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.bcHockeyId,
        actorIp: "203.0.113.10",
        actorUserAgent: "SeedScript/1.0",
        targetType: "reporting_submission",
        targetId: IDS.reportingSubmissionQuarterlyId,
        targetOrgId: IDS.bcHockeyId,
        changes: { status: { old: "submitted", new: "approved" } },
        metadata: { source: "seed" },
        requestId: "seed-audit-002",
      },
      {
        id: auditId(1),
        action: "auth.login_success",
        actionCategory: "AUTH",
        actorUserId: IDS.viasportStaffId,
        actorIp: "203.0.113.12",
        targetType: "session",
        targetId: "sess-login-001",
        metadata: { method: "password" },
        requestId: "seed-audit-003",
      },
      {
        id: auditId(2),
        action: "auth.mfa_verify",
        actionCategory: "AUTH",
        actorUserId: IDS.viasportStaffId,
        actorIp: "203.0.113.12",
        targetType: "session",
        targetId: "sess-login-001",
        metadata: { method: "totp" },
        requestId: "seed-audit-004",
      },
      {
        id: auditId(3),
        action: "data.form_submitted",
        actionCategory: "DATA",
        actorUserId: IDS.psoAdminId,
        actorOrgId: IDS.bcHockeyId,
        targetType: "form_submission",
        targetId: IDS.annualStatsSubmissionId,
        targetOrgId: IDS.bcHockeyId,
        metadata: { includesPii: true },
        requestId: "seed-audit-005",
      },
      {
        id: auditId(4),
        action: "data.form_approved",
        actionCategory: "DATA",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "form_submission",
        targetId: IDS.bcHockeyApprovedSubmissionId,
        targetOrgId: IDS.bcHockeyId,
        metadata: { includesPii: false },
        requestId: "seed-audit-006",
      },
      {
        id: auditId(5),
        action: "bi.export",
        actionCategory: "EXPORT",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "bi_dataset",
        targetId: "form_submissions",
        targetOrgId: IDS.viasportBcId,
        metadata: {
          includesPii: true,
          stepUpAuthUsed: true,
          format: "csv",
          rowCount: 47,
        },
        requestId: "seed-audit-007",
      },
      {
        id: auditId(6),
        action: "bi.export",
        actionCategory: "EXPORT",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "bi_dataset",
        targetId: "form_submissions",
        targetOrgId: IDS.viasportBcId,
        metadata: {
          includesPii: false,
          stepUpAuthUsed: true,
          format: "xlsx",
          rowCount: 128,
        },
        requestId: "seed-audit-008",
      },
      {
        id: auditId(7),
        action: "security.mfa_enabled",
        actionCategory: "SECURITY",
        actorUserId: IDS.viasportStaffId,
        targetType: "user",
        targetId: IDS.psoAdminId,
        metadata: {},
        requestId: "seed-audit-009",
      },
      {
        id: auditId(8),
        action: "security.password_changed",
        actionCategory: "SECURITY",
        actorUserId: IDS.clubReporterId,
        targetType: "user",
        targetId: IDS.clubReporterId,
        metadata: { method: "self_service" },
        requestId: "seed-audit-010",
      },
      {
        id: auditId(9),
        action: "admin.user_role_changed",
        actionCategory: "ADMIN",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "user",
        targetId: IDS.clubReporterId,
        metadata: { changes: { role: { old: "viewer", new: "reporter" } } },
        requestId: "seed-audit-011",
      },
      {
        id: auditId(10),
        action: "admin.org_settings_updated",
        actionCategory: "ADMIN",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "organization",
        targetId: IDS.bcHockeyId,
        targetOrgId: IDS.bcHockeyId,
        metadata: { settings: { fiscalYearEnd: "03-31" } },
        requestId: "seed-audit-012",
      },
      {
        id: auditId(11),
        action: "reporting.task_assigned",
        actionCategory: "DATA",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "reporting_task",
        targetId: IDS.q12026TaskId,
        targetOrgId: IDS.bcSoccerId,
        metadata: { reminders: [14, 7, 3, 1] },
        requestId: "seed-audit-013",
      },
      {
        id: auditId(12),
        action: "reporting.submission.approved",
        actionCategory: "DATA",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "reporting_submission",
        targetId: IDS.reportingSubmissionQuarterlyId,
        targetOrgId: IDS.bcHockeyId,
        metadata: { status: "approved" },
        requestId: "seed-audit-014",
      },
      {
        id: auditId(13),
        action: "data.import_completed",
        actionCategory: "DATA",
        actorUserId: IDS.psoAdminId,
        actorOrgId: IDS.bcHockeyId,
        targetType: "import_job",
        targetId: IDS.importJobCompletedId,
        targetOrgId: IDS.bcHockeyId,
        metadata: { rowsProcessed: 50, file: "import-demo-annual-stats-large.csv" },
        requestId: "seed-audit-015",
      },
      {
        id: auditId(14),
        action: "data.import_failed",
        actionCategory: "DATA",
        actorUserId: IDS.psoAdminId,
        actorOrgId: IDS.bcHockeyId,
        targetType: "import_job",
        targetId: IDS.importJobFailedId,
        targetOrgId: IDS.bcHockeyId,
        metadata: {
          rowsProcessed: 4,
          errors: 2,
          includesPii: false,
          stepUpAuthUsed: false,
        },
        requestId: "seed-audit-016",
      },
      {
        id: auditId(15),
        action: "auth.session_terminated",
        actionCategory: "AUTH",
        actorUserId: IDS.viasportStaffId,
        targetType: "session",
        targetId: "sess-login-002",
        metadata: { reason: "manual_logout" },
        requestId: "seed-audit-017",
      },
      {
        id: auditId(16),
        action: "security.step_up_challenge",
        actionCategory: "SECURITY",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "bi_export",
        targetId: "export-analytics-001",
        metadata: { includesPii: true, stepUpAuthUsed: true },
        requestId: "seed-audit-018",
      },
      {
        id: auditId(17),
        action: "audit.hash_verified",
        actionCategory: "SECURITY",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "audit_log",
        targetId: "chain-verify",
        metadata: { verifiedCount: 47 },
        requestId: "seed-audit-019",
      },
      {
        id: auditId(18),
        action: "data.form_submission.reviewed",
        actionCategory: "DATA",
        actorUserId: IDS.viasportStaffId,
        actorOrgId: IDS.viasportBcId,
        targetType: "form_submission",
        targetId: bcSoccerAnalyticsSubmissionId,
        targetOrgId: IDS.bcSoccerId,
        metadata: { status: "submitted" },
        requestId: "seed-audit-020",
      },
    ];

    const auditRows = [];
    let previousAuditHash: string | null = null;
    let auditTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 2);

    for (const entry of auditSeedEntries) {
      const occurredAt = new Date(auditTimestamp.getTime());
      const payload = {
        id: entry.id,
        occurredAt,
        action: entry.action,
        actionCategory: entry.actionCategory,
        actorUserId: entry.actorUserId ?? null,
        actorOrgId: entry.actorOrgId ?? null,
        actorIp: entry.actorIp ?? null,
        actorUserAgent: entry.actorUserAgent ?? null,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        targetOrgId: entry.targetOrgId ?? null,
        changes: entry.changes ?? null,
        metadata: entry.metadata ?? {},
        requestId: entry.requestId,
        prevHash: previousAuditHash,
      };

      const entryHash = hashValue(payload);

      auditRows.push({
        id: entry.id,
        occurredAt,
        createdAt: occurredAt,
        actorUserId: entry.actorUserId ?? null,
        actorOrgId: entry.actorOrgId ?? null,
        actorIp: entry.actorIp ?? null,
        actorUserAgent: entry.actorUserAgent ?? null,
        action: entry.action,
        actionCategory: entry.actionCategory,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        targetOrgId: entry.targetOrgId ?? null,
        changes: entry.changes ?? null,
        metadata: entry.metadata ?? {},
        requestId: entry.requestId,
        prevHash: previousAuditHash,
        entryHash,
      });

      previousAuditHash = entryHash;
      auditTimestamp = new Date(auditTimestamp.getTime() + 1000 * 60 * 10);
    }

    await db.insert(auditLogs).values(auditRows);
    console.log("   ✓ Created audit log entries\n");

    // ========================================
    // PHASE 24: Create policy documents
    // ========================================
    console.log("Phase 24: Creating policy documents...");

    await db.insert(policyDocuments).values([
      {
        id: IDS.privacyPolicyId,
        type: "privacy_policy",
        version: "1.0",
        contentHash: "sha256:abc123placeholder",
        effectiveDate: "2024-01-01",
        publishedAt: new Date("2024-01-01"),
        publishedBy: IDS.viasportStaffId,
      },
      {
        id: IDS.tosId,
        type: "terms_of_service",
        version: "1.0",
        contentHash: "sha256:def456placeholder",
        effectiveDate: "2024-01-01",
        publishedAt: new Date("2024-01-01"),
        publishedBy: IDS.viasportStaffId,
      },
    ]);
    console.log("   ✓ Created privacy policy and terms of service\n");

    // ========================================
    // PHASE 25: Create privacy requests + legal holds
    // ========================================
    console.log("Phase 25: Creating privacy requests and legal holds...");

    await db.insert(userPolicyAcceptances).values([
      {
        id: IDS.policyAcceptanceId1,
        userId: IDS.viasportStaffId,
        policyId: IDS.privacyPolicyId,
        acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
        ipAddress: "203.0.113.10",
        userAgent: "SeedScript/1.0",
      },
      {
        id: IDS.policyAcceptanceId2,
        userId: IDS.psoAdminId,
        policyId: IDS.privacyPolicyId,
        acceptedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18),
        ipAddress: "198.51.100.17",
        userAgent: "SeedScript/1.0",
      },
    ]);

    const privacyRequestAt1 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 14);
    const privacyRequestAt2 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 9);
    const privacyRequestAt3 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 5);
    const privacyRequestAt4 = new Date(Date.now() - 1000 * 60 * 60 * 24 * 2);

    await db.insert(privacyRequests).values([
      {
        id: IDS.privacyRequestId1,
        userId: IDS.memberId,
        type: "access",
        status: "pending",
        requestedAt: privacyRequestAt1,
        details: { scope: "profile" },
        createdAt: privacyRequestAt1,
      },
      {
        id: IDS.privacyRequestId2,
        userId: IDS.clubReporterId,
        type: "correction",
        status: "processing",
        requestedAt: privacyRequestAt2,
        processedBy: IDS.viasportStaffId,
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        details: { correction: "Update phone number on file." },
        createdAt: privacyRequestAt2,
      },
      {
        id: IDS.privacyRequestId3,
        userId: IDS.psoAdminId,
        type: "export",
        status: "completed",
        requestedAt: privacyRequestAt3,
        processedBy: IDS.viasportStaffId,
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        resultUrl: "https://example.com/privacy-exports/export-001.csv",
        resultExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        resultNotes: "Export available for 7 days.",
        createdAt: privacyRequestAt3,
      },
      {
        id: IDS.privacyRequestId4,
        userId: IDS.memberId,
        type: "erasure",
        status: "rejected",
        requestedAt: privacyRequestAt4,
        processedBy: IDS.viasportStaffId,
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        rejectionReason: "Retention policy requires seven-year storage.",
        createdAt: privacyRequestAt4,
      },
    ]);

    await db.insert(legalHolds).values([
      {
        id: IDS.legalHoldId1,
        scopeType: "organization",
        scopeId: IDS.bcHockeyId,
        dataType: "reporting_submissions",
        reason: "Grant compliance audit",
        appliedBy: IDS.viasportStaffId,
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      },
      {
        id: IDS.legalHoldId2,
        scopeType: "user",
        scopeId: IDS.memberId,
        dataType: "user_profile",
        reason: "Privacy review follow-up",
        appliedBy: IDS.viasportStaffId,
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
        releasedBy: IDS.viasportStaffId,
        releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45),
      },
    ]);

    console.log("   ✓ Created privacy requests and legal holds\n");

    // ========================================
    // PHASE 26: Create retention policies
    // ========================================
    console.log("Phase 26: Creating retention policies...");

    await db.insert(retentionPolicies).values([
      { dataType: "audit_logs", retentionDays: 2555, archiveAfterDays: 365 }, // 7 years
      { dataType: "form_submissions", retentionDays: 1825, archiveAfterDays: 730 }, // 5 years
      { dataType: "user_sessions", retentionDays: 90 },
      { dataType: "notifications", retentionDays: 365 },
    ]);
    console.log("   ✓ Created 4 retention policies\n");

    // ========================================
    // COMPLETE
    // ========================================
    console.log("=".repeat(60));
    console.log("✅ viaSport SIN test data seeded successfully!\n");
    console.log("Test Users (MFA disabled for convenience):");
    console.log("  • global-admin@demo.com - Global Admin (password: demopassword123)");
    console.log(
      "  • viasport-staff@demo.com - viaSport Staff (password: demopassword123)",
    );
    console.log("  • pso-admin@demo.com - PSO Administrator (password: demopassword123)");
    console.log("  • club-reporter@demo.com - Club Reporter (password: demopassword123)");
    console.log("  • member@demo.com - Regular Member (password: demopassword123)\n");
    console.log(
      "Organizations created: 10 (1 governing body, 3 PSOs, 2 leagues, 4 clubs)",
    );
    console.log("Forms created: 7 (6 published, 1 draft)");
    console.log("Reporting cycles: 4 (2 active, 1 closed, 1 upcoming)\n");
    console.log("-".repeat(60));
    console.log("🔐 MFA: Disabled by default for all demo accounts.");
    console.log("   Users can enable MFA via Settings > Security.");
    console.log("-".repeat(60));
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Error seeding SIN data:", error);
    throw error;
  } finally {
    await sqlConnection.end({ timeout: 3 });
  }
}

seed().catch((error) => {
  console.error("Failed to seed:", error);
  process.exit(1);
});
