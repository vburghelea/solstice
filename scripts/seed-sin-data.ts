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
 * Test users created (all with password: testpassword123):
 * - admin@example.com - Platform admin (Solstice Admin)
 * - viasport-staff@example.com - viaSport staff (viaSport Admin)
 * - pso-admin@example.com - PSO administrator
 * - club-reporter@example.com - Club data reporter
 * - member@example.com - Regular member
 */

import { hashPassword, symmetricEncrypt } from "better-auth/crypto";
import dotenv from "dotenv";
import { like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  account,
  delegatedAccess,
  forms,
  formSubmissions,
  formVersions,
  notificationTemplates,
  organizationMembers,
  organizations,
  policyDocuments,
  reportingCycles,
  reportingSubmissions,
  reportingTasks,
  retentionPolicies,
  roles,
  session,
  twoFactor,
  user,
  userRoles,
} from "../src/db/schema";

// ============================================================================
// FAKE MFA CONFIGURATION FOR TESTING
// ============================================================================
// These are KNOWN values that can be used by coding agents and E2E tests
// to authenticate through MFA-protected flows.
//
// TOTP Secret (base32 encoded): JBSWY3DPEHPK3PXP
// - Use any TOTP generator with this secret to generate valid 6-digit codes
// - The secret decodes to "Hello!HelloWorld" (32 bytes)
//
// Backup Codes (for use with verifyBackupCode):
// - These are encrypted in the database but documented here for testing
// - backup-testcode1
// - backup-testcode2
// - backup-testcode3
// - backup-testcode4
// - backup-testcode5
// ============================================================================

const FAKE_MFA_SECRET = "JBSWY3DPEHPK3PXP"; // Well-known TOTP secret for testing
const FAKE_BACKUP_CODES = [
  "backup-testcode1",
  "backup-testcode2",
  "backup-testcode3",
  "backup-testcode4",
  "backup-testcode5",
  "backup-testcode6",
  "backup-testcode7",
  "backup-testcode8",
  "backup-testcode9",
  "backup-testcode10",
];

// Load environment variables (don't override SST-provided vars)
// When running via SST shell, DATABASE_URL is already set correctly
if (!process.env["DATABASE_URL"]) {
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.e2e" });
}

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

  // Form Versions (RFC 4122 compliant UUIDs)
  annualStatsFormV1Id: "a0000000-0000-4000-8003-000000000001",
  quarterlyFinFormV1Id: "a0000000-0000-4000-8003-000000000002",
  demographicsFormV1Id: "a0000000-0000-4000-8003-000000000003",
  coachingFormV1Id: "a0000000-0000-4000-8003-000000000004",

  // Reporting Cycles (RFC 4122 compliant UUIDs)
  fy2425CycleId: "a0000000-0000-4000-8004-000000000001",
  q42024CycleId: "a0000000-0000-4000-8004-000000000002",
  q12025CycleId: "a0000000-0000-4000-8004-000000000003",

  // Reporting Tasks (RFC 4122 compliant UUIDs)
  annualTask1Id: "a0000000-0000-4000-8005-000000000001",
  annualTask2Id: "a0000000-0000-4000-8005-000000000002",
  annualTask3Id: "a0000000-0000-4000-8005-000000000003",
  quarterlyTask1Id: "a0000000-0000-4000-8005-000000000004",

  // Policy Documents (RFC 4122 compliant UUIDs)
  privacyPolicyId: "a0000000-0000-4000-8006-000000000001",
  tosId: "a0000000-0000-4000-8006-000000000002",
} as const;

/**
 * Encrypt backup codes using Better Auth's symmetric encryption
 * This matches how Better Auth stores backup codes in the twoFactor table
 */
async function encryptBackupCodes(codes: string[], secretKey: string): Promise<string> {
  const encrypted = await symmetricEncrypt({
    data: JSON.stringify(codes),
    key: secretKey,
  });
  return encrypted;
}

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
    await db.delete(reportingSubmissions);
    await db.delete(reportingTasks);
    await db.delete(reportingCycles);
    await db.delete(formSubmissions);
    await db.delete(formVersions);
    await db.delete(forms);
    await db.delete(delegatedAccess);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await db.delete(retentionPolicies);
    await db.delete(policyDocuments);
    await db.delete(notificationTemplates);
    await db.delete(userRoles);

    // Delete twoFactor records for test users
    console.log("   → Cleaning up 2FA records...");
    await db.execute(sql`DELETE FROM "twoFactor" WHERE user_id LIKE 'sin-user-%'`);

    await db.delete(session).where(like(session.userId, "sin-user-%"));
    await db.delete(account).where(like(account.userId, "sin-user-%"));
    await db
      .delete(user)
      .where(
        or(
          like(user.id, "sin-user-%"),
          like(user.email, "%-staff@example.com"),
          like(user.email, "pso-%@example.com"),
          like(user.email, "club-%@example.com"),
        ),
      );
    await db.delete(roles);

    console.log("   ✓ Cleaned existing data\n");

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

    const hashedPassword = await hashPassword("testpassword123");

    const testUsers = [
      {
        id: IDS.platformAdminId,
        email: "admin@example.com",
        name: "Platform Admin",
        roleId: "solstice-admin",
      },
      {
        id: IDS.viasportStaffId,
        email: "viasport-staff@example.com",
        name: "viaSport Staff Member",
        roleId: "viasport-admin",
      },
      {
        id: IDS.psoAdminId,
        email: "pso-admin@example.com",
        name: "PSO Administrator",
        roleId: null, // Assigned via org membership
      },
      {
        id: IDS.clubReporterId,
        email: "club-reporter@example.com",
        name: "Club Data Reporter",
        roleId: null, // Assigned via org membership
      },
      {
        id: IDS.memberId,
        email: "member@example.com",
        name: "Regular Member",
        roleId: null,
      },
    ];

    for (const userData of testUsers) {
      const isGlobalAdmin =
        userData.roleId === "solstice-admin" || userData.roleId === "viasport-admin";

      await db.insert(user).values({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        emailVerified: true,
        profileComplete: true,
        profileVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        mfaRequired: isGlobalAdmin,
      });

      await db.insert(account).values({
        id: `${userData.id}-account`,
        userId: userData.id,
        providerId: "credential",
        accountId: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
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

      // Enroll MFA for global admins (fake MFA for testing)
      if (isGlobalAdmin) {
        // Encrypt backup codes if auth secret is available
        let encryptedBackupCodes = JSON.stringify(FAKE_BACKUP_CODES); // Fallback: store as JSON
        if (authSecret) {
          try {
            encryptedBackupCodes = await encryptBackupCodes(
              FAKE_BACKUP_CODES,
              authSecret,
            );
          } catch (err) {
            console.warn(`   ⚠️  Could not encrypt backup codes: ${err}`);
          }
        }

        await db.insert(twoFactor).values({
          id: `${userData.id}-2fa`,
          userId: userData.id,
          secret: FAKE_MFA_SECRET,
          backupCodes: encryptedBackupCodes,
        });

        // Update user to mark as 2FA enabled
        await db.execute(
          sql`UPDATE "user" SET two_factor_enabled = TRUE, mfa_enrolled_at = NOW() WHERE id = ${userData.id}`,
        );

        console.log(`   ✓ Created user: ${userData.email} (with MFA enrolled)`);
      } else {
        console.log(`   ✓ Created user: ${userData.email}`);
      }
    }
    console.log("");

    // ========================================
    // PHASE 4: Create organization hierarchy
    // ========================================
    console.log("Phase 4: Creating organization hierarchy...");

    // Root: viaSport BC (governing body)
    await db.insert(organizations).values({
      id: IDS.viasportBcId,
      name: "viaSport BC",
      slug: "viasport-bc",
      type: "governing_body",
      status: "active",
      settings: { fiscalYearEnd: "03-31" },
      metadata: { established: 2010 },
    });
    console.log("   ✓ viaSport BC (governing_body)");

    // PSOs under viaSport
    const psos = [
      { id: IDS.bcHockeyId, name: "BC Hockey", slug: "bc-hockey" },
      { id: IDS.bcSoccerId, name: "BC Soccer", slug: "bc-soccer" },
      { id: IDS.bcAthleticsId, name: "BC Athletics", slug: "bc-athletics" },
    ];

    for (const pso of psos) {
      await db.insert(organizations).values({
        ...pso,
        type: "pso",
        parentOrgId: IDS.viasportBcId,
        status: "active",
        settings: {},
        metadata: {},
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
      await db.insert(organizations).values({
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
      await db.insert(organizations).values({
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
    // PHASE 6: Create forms
    // ========================================
    console.log("Phase 6: Creating forms...");

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
          settings: { allowDraft: true, requireApproval: true },
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
              type: "currency",
              label: "Revenue - Grants",
              required: true,
            },
            {
              key: "revenue_fees",
              type: "currency",
              label: "Revenue - Membership Fees",
              required: true,
            },
            {
              key: "revenue_events",
              type: "currency",
              label: "Revenue - Events",
              required: true,
            },
            {
              key: "revenue_other",
              type: "currency",
              label: "Revenue - Other",
              required: false,
            },
            {
              key: "expenses_programs",
              type: "currency",
              label: "Expenses - Programs",
              required: true,
            },
            {
              key: "expenses_admin",
              type: "currency",
              label: "Expenses - Administration",
              required: true,
            },
            {
              key: "expenses_facilities",
              type: "currency",
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
          settings: { allowDraft: true, requireApproval: true },
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
          settings: { allowDraft: true, requireApproval: false },
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
          settings: { allowDraft: true, requireApproval: true },
        },
      },
    ];

    for (const form of formsData) {
      await db.insert(forms).values({
        id: form.id,
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
    // PHASE 7: Create reporting cycles
    // ========================================
    console.log("Phase 7: Creating reporting cycles...");

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
    ]);
    console.log("   ✓ Created 3 reporting cycles\n");

    // ========================================
    // PHASE 8: Create reporting tasks
    // ========================================
    console.log("Phase 8: Creating reporting tasks...");

    const dueDateAnnual = new Date(currentYear + 1, 3, 30); // April 30 next year
    const dueDateQuarterly = new Date(currentYear, 4, 15); // May 15 this year

    await db.insert(reportingTasks).values([
      {
        id: IDS.annualTask1Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.annualStatsFormId,
        organizationType: "pso",
        title: "Annual Statistics Report - PSOs",
        description: "All PSOs must submit annual participant statistics",
        dueDate: dueDateAnnual.toISOString().slice(0, 10),
        reminderConfig: { daysBeforeDue: [30, 14, 7, 1] },
      },
      {
        id: IDS.annualTask2Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.coachingFormId,
        organizationType: "pso",
        title: "Coaching Certification Report - PSOs",
        description: "Annual coaching certification data",
        dueDate: dueDateAnnual.toISOString().slice(0, 10),
        reminderConfig: { daysBeforeDue: [30, 14, 7] },
      },
      {
        id: IDS.annualTask3Id,
        cycleId: IDS.fy2425CycleId,
        formId: IDS.quarterlyFinFormId,
        organizationId: IDS.bcHockeyId,
        title: "Annual Financial Summary - BC Hockey",
        description: "Year-end financial summary for BC Hockey",
        dueDate: dueDateAnnual.toISOString().slice(0, 10),
        reminderConfig: { daysBeforeDue: [30, 14, 7, 1] },
      },
      {
        id: IDS.quarterlyTask1Id,
        cycleId: IDS.q12025CycleId,
        formId: IDS.quarterlyFinFormId,
        organizationType: "pso",
        title: "Q1 Financial Report - All PSOs",
        description: "Quarterly financial summary",
        dueDate: dueDateQuarterly.toISOString().slice(0, 10),
        reminderConfig: { daysBeforeDue: [14, 7, 1] },
      },
    ]);
    console.log("   ✓ Created 4 reporting tasks\n");

    // ========================================
    // PHASE 9: Create sample submissions
    // ========================================
    console.log("Phase 9: Creating sample form submissions...");

    // Create a submission for BC Hockey
    const bcHockeySubmissionId = "a0000000-0000-4000-8007-000000000001";
    await db.insert(formSubmissions).values({
      id: bcHockeySubmissionId,
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
      submittedAt: new Date(),
    });

    await db.insert(reportingSubmissions).values({
      taskId: IDS.annualTask1Id,
      organizationId: IDS.bcHockeyId,
      formSubmissionId: bcHockeySubmissionId,
      status: "submitted",
      submittedAt: new Date(),
      submittedBy: IDS.psoAdminId,
    });
    console.log("   ✓ BC Hockey annual stats (submitted)\n");

    // ========================================
    // PHASE 10: Create notification templates
    // ========================================
    console.log("Phase 10: Creating notification templates...");

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
    ]);
    console.log("   ✓ Created 4 notification templates\n");

    // ========================================
    // PHASE 11: Create policy documents
    // ========================================
    console.log("Phase 11: Creating policy documents...");

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
    // PHASE 12: Create retention policies
    // ========================================
    console.log("Phase 12: Creating retention policies...");

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
    console.log("Test Users (password: testpassword123):");
    console.log("  • admin@example.com - Platform Admin (MFA enrolled)");
    console.log("  • viasport-staff@example.com - viaSport Staff (MFA enrolled)");
    console.log("  • pso-admin@example.com - PSO Administrator");
    console.log("  • club-reporter@example.com - Club Reporter");
    console.log("  • member@example.com - Regular Member\n");
    console.log(
      "Organizations created: 10 (1 governing body, 3 PSOs, 2 leagues, 4 clubs)",
    );
    console.log("Forms created: 4 (3 published, 1 draft)");
    console.log("Reporting cycles: 3 (1 active, 1 closed, 1 upcoming)\n");
    console.log("-".repeat(60));
    console.log("🔐 FAKE MFA FOR TESTING (admin users only):");
    console.log("   TOTP Secret: JBSWY3DPEHPK3PXP");
    console.log("   → Add this to any authenticator app to generate valid codes");
    console.log("   → Or use otpauth CLI: otpauth -b JBSWY3DPEHPK3PXP");
    console.log("\n   Backup Codes (use with 'Use backup code' option):");
    console.log("   → backup-testcode1 through backup-testcode10");
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
