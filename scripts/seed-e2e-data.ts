#!/usr/bin/env tsx
/**
 * Seed script for E2E test data
 * Run with: pnpm tsx scripts/seed-e2e-data.ts
 */

import { hashPassword, symmetricEncrypt } from "better-auth/crypto";
import dotenv from "dotenv";
import { eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  account,
  eventAnnouncements,
  eventRegistrations,
  events,
  forms,
  formVersions,
  memberships,
  membershipTypes,
  organizationMembers,
  organizations,
  roles,
  session,
  teamMembers,
  teams,
  twoFactor,
  user,
  userRoles,
} from "../src/db/schema";

// Load environment variables
dotenv.config({ path: ".env.e2e" });

const mfaSecret =
  process.env["E2E_TEST_ADMIN_TOTP_SECRET"] ?? process.env["SIN_UI_TOTP_SECRET"];
if (!mfaSecret) {
  throw new Error(
    "E2E_TEST_ADMIN_TOTP_SECRET or SIN_UI_TOTP_SECRET is required for MFA seed data.",
  );
}
const FAKE_MFA_SECRET = mfaSecret;
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

const encryptBackupCodes = async (codes: string[], secretKey: string) => {
  return symmetricEncrypt({ data: JSON.stringify(codes), key: secretKey });
};

async function seed() {
  console.log("🌱 Seeding E2E test data...");

  // Use E2E database URL if available, otherwise use regular DB from env
  const connectionString =
    process.env["E2E_DATABASE_URL"] || process.env["DATABASE_URL"] || "";

  if (!connectionString) {
    throw new Error("No database URL found. Please set E2E_DATABASE_URL or DATABASE_URL");
  }
  const authSecret = process.env["BETTER_AUTH_SECRET"];
  if (!authSecret) {
    console.warn(
      "⚠️  BETTER_AUTH_SECRET not set - MFA backup codes may not decrypt correctly.",
    );
  }
  const sql = postgres(connectionString, { max: 1 }); // open exactly one connection
  const db = drizzle(sql);

  // Use static CUIDs for predictable test data
  const testUserId = "clxpfz4jn000008l8b3f4e1j2";
  const adminUserId = "clxpfz4jn000108l8h3g4a2k3";
  const teamCreatorUserId = "clxpfz4jn000208l8c4h5b3l4"; // User for team creation tests
  const profileEditUserId = "clxpfz4jn000308l8d5i6c4m5"; // User for profile editing tests
  const membershipPurchaseUserId = "clxpfz4jn000408l8e6j7d5n6"; // User for membership purchase tests
  const teamJoinUserId = "clxpfz4jn000508l8f7k8e6o7"; // User for team joining tests
  const teamInviteDeclineUserId = "clxpfz4jn000608l8g8l9f7p9"; // User for declining invites tests
  const squareTestUserId = "clxpfz4jn000608l8g8l9f7p8"; // User for Square sandbox testing
  const individualEventId = "00000000-0000-0000-0000-00000000e201";
  const teamEventId = "00000000-0000-0000-0000-00000000e202";
  const individualRegistrationId = "00000000-0000-0000-0000-00000000e211";
  const e2eOrgId = "00000000-0000-0000-0000-00000000e301";
  const e2eFormId = "00000000-0000-0000-0000-00000000e401";
  const e2eFormVersionId = "00000000-0000-0000-0000-00000000e402";

  try {
    // Clear existing test data in correct order due to foreign key constraints
    console.log(
      "Clearing existing data in correct order to handle foreign key constraints...",
    );

    // 1. First clear tables that reference other tables
    console.log("Clearing event data...");
    await db.delete(eventAnnouncements);
    await db.delete(eventRegistrations);
    await db.delete(events);

    console.log("Clearing team members...");
    await db.delete(teamMembers);

    console.log("Clearing ALL teams to avoid foreign key issues...");
    // For now, delete all teams to ensure clean state
    // In production, you'd want to be more selective
    await db.delete(teams);

    console.log("Clearing memberships...");
    await db.delete(memberships);

    console.log("Clearing user roles...");
    await db.delete(userRoles);

    console.log("Clearing 2FA records...");
    await db.delete(twoFactor).where(like(twoFactor.userId, "clxpfz4jn%"));

    // 2. Clear sessions and accounts before users
    console.log("Clearing sessions...");
    await db.delete(session).where(like(session.userId, "clxpfz4jn%"));

    console.log("Clearing accounts...");
    await db.delete(account).where(like(account.userId, "clxpfz4jn%"));

    // 3. Preserve fixed test users so audit history stays intact
    console.log("Skipping test user deletion (fixed users preserved)...");

    // 4. Clear standalone tables last
    console.log("Clearing membership types...");
    await db.delete(membershipTypes);

    console.log("Clearing roles...");
    await db.delete(roles);

    // Create test users
    const testUsers = [
      {
        id: testUserId,
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1990-01-01"),
        phone: "+1234567890",
        gender: "male",
        pronouns: "he/him",
        emergencyContact: JSON.stringify({
          name: "Emergency Contact",
          phone: "+0987654321",
          relationship: "spouse",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: false,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: adminUserId,
        email: "admin@example.com",
        name: "Admin User",
        emailVerified: true,
        mfaRequired: true,
        profileComplete: true,
        dateOfBirth: new Date("1985-05-15"),
        phone: "+1234567891",
        gender: "female",
        pronouns: "she/her",
        emergencyContact: JSON.stringify({
          name: "Admin Emergency",
          phone: "+1987654321",
          relationship: "friend",
        }),
        privacySettings: JSON.stringify({
          showEmail: false,
          showPhone: false,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: teamCreatorUserId,
        email: "teamcreator@example.com",
        name: "Team Creator",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1992-05-15"),
        phone: "+1234567892",
        gender: "female",
        pronouns: "she/her",
        emergencyContact: JSON.stringify({
          name: "Emergency Contact 3",
          phone: "+0987654323",
          relationship: "parent",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: false,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
    ];

    // Add purpose-specific test users
    testUsers.push(
      {
        id: profileEditUserId,
        email: "profile-edit@example.com",
        name: "Profile Edit User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1991-03-15"),
        phone: "+1234567893",
        gender: "non-binary",
        pronouns: "they/them",
        emergencyContact: JSON.stringify({
          name: "Profile Emergency",
          phone: "+0987654324",
          relationship: "friend",
        }),
        privacySettings: JSON.stringify({
          showEmail: false,
          showPhone: true,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: membershipPurchaseUserId,
        email: "membership-purchase@example.com",
        name: "Membership Purchase User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1988-07-20"),
        phone: "+1234567894",
        gender: "female",
        pronouns: "she/her",
        emergencyContact: JSON.stringify({
          name: "Membership Emergency",
          phone: "+0987654325",
          relationship: "parent",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: false,
          showBirthYear: true,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: teamJoinUserId,
        email: "team-join@example.com",
        name: "Team Join User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1995-11-30"),
        phone: "+1234567895",
        gender: "male",
        pronouns: "he/him",
        emergencyContact: JSON.stringify({
          name: "Team Emergency",
          phone: "+0987654326",
          relationship: "sibling",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: true,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: teamInviteDeclineUserId,
        email: "team-invite-decline@example.com",
        name: "Team Invite Decline User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1993-02-20"),
        phone: "+1234567897",
        gender: "female",
        pronouns: "she/her",
        emergencyContact: JSON.stringify({
          name: "Invite Decline Emergency",
          phone: "+1987654328",
          relationship: "partner",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: false,
          showBirthYear: false,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
      {
        id: squareTestUserId,
        email: "squaretest@example.com",
        name: "Square Test User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1991-03-15"),
        phone: "+1234567896",
        gender: "non-binary",
        pronouns: "they/them",
        emergencyContact: JSON.stringify({
          name: "Square Emergency",
          phone: "+0987654327",
          relationship: "partner",
        }),
        privacySettings: JSON.stringify({
          showEmail: true,
          showPhone: false,
          showBirthYear: true,
          allowTeamInvitations: true,
        }),
        profileVersion: 1,
      },
    );

    // Hash password for all test users using Better Auth's hash function
    const hashedPassword = await hashPassword("testpassword123");

    // Create roles first
    console.log("Creating roles...");
    await db.insert(roles).values([
      {
        id: "solstice-admin",
        name: "Solstice Admin",
        description: "Super admin role with full system access",
        permissions: {
          "system:all": true,
        },
      },
      {
        id: "quadball-canada-admin",
        name: "Quadball Canada Admin",
        description: "Administrative access to Quadball Canada features",
        permissions: {
          "teams:manage": true,
          "events:manage": true,
          "members:manage": true,
          "memberships:manage": true,
        },
      },
      {
        id: "team-admin",
        name: "Team Admin",
        description: "Administrative access to a specific team",
        permissions: {
          "team:manage": true,
          "team:members:manage": true,
        },
      },
      {
        id: "event-admin",
        name: "Event Admin",
        description: "Administrative access to a specific event",
        permissions: {
          "event:manage": true,
          "event:participants:manage": true,
        },
      },
    ]);
    console.log("✅ Created roles");

    // Create membership types first
    console.log("Creating membership types...");
    await db.insert(membershipTypes).values([
      {
        id: "annual-player-2025",
        name: "Annual Player Membership 2025",
        description:
          "Full access to all Quadball Canada events and programs for the 2025 season",
        priceCents: 4500, // $45.00
        durationMonths: 12,
        status: "active" as const,
        metadata: {
          season: "2025",
          membershipYear: 2025,
          currency: "CAD",
          features: [
            "Access to all sanctioned tournaments",
            "Player insurance coverage",
            "Voting rights at AGM",
            "Team registration eligibility",
            "Member newsletter and updates",
          ],
          maxPurchases: 1,
        },
      },
    ]);
    console.log("✅ Created membership types");

    console.log("Creating test users...");
    for (const userData of testUsers) {
      const now = new Date();
      await db
        .insert(user)
        .values({
          ...userData,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: user.id,
          set: {
            name: userData.name,
            email: userData.email,
            emailVerified: userData.emailVerified ?? true,
            profileComplete: userData.profileComplete ?? false,
            dateOfBirth: userData.dateOfBirth ?? null,
            phone: userData.phone ?? null,
            gender: userData.gender ?? null,
            pronouns: userData.pronouns ?? null,
            emergencyContact: userData.emergencyContact ?? null,
            privacySettings: userData.privacySettings ?? null,
            profileVersion: userData.profileVersion ?? 1,
            mfaRequired: userData.mfaRequired ?? false,
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
          password: hashedPassword,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: account.id,
          set: {
            accountId: userData.email,
            password: hashedPassword,
            updatedAt: now,
          },
        });

      await db
        .insert(session)
        .values({
          id: `${userData.id}-session`,
          userId: userData.id,
          token: `test-token-${userData.id}`,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: session.id,
          set: {
            token: `test-token-${userData.id}`,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: now,
          },
        });

      if (userData.id === adminUserId) {
        let encryptedBackupCodes = JSON.stringify(FAKE_BACKUP_CODES);
        let encryptedTotpSecret = FAKE_MFA_SECRET; // Fallback: store raw (will fail verification)
        if (authSecret) {
          try {
            encryptedBackupCodes = await encryptBackupCodes(
              FAKE_BACKUP_CODES,
              authSecret,
            );
            // Encrypt TOTP secret the same way Better Auth does
            encryptedTotpSecret = await symmetricEncrypt({
              data: FAKE_MFA_SECRET,
              key: authSecret,
            });
          } catch (error) {
            console.warn(`⚠️  Could not encrypt MFA secrets: ${error}`);
          }
        }

        await db
          .insert(twoFactor)
          .values({
            id: `${userData.id}-2fa`,
            userId: userData.id,
            secret: encryptedTotpSecret,
            backupCodes: encryptedBackupCodes,
          })
          .onConflictDoUpdate({
            target: twoFactor.id,
            set: {
              secret: encryptedTotpSecret,
              backupCodes: encryptedBackupCodes,
            },
          });

        await db
          .update(user)
          .set({ twoFactorEnabled: true, mfaEnrolledAt: new Date() })
          .where(eq(user.id, userData.id));

        console.log(`✅ Enrolled MFA for user: ${userData.email}`);
      }

      console.log(`✅ Created user: ${userData.email}`);
    }

    console.log("Assigning roles to users...");
    await db.insert(userRoles).values([
      {
        id: "admin-global-role",
        userId: adminUserId,
        roleId: "solstice-admin",
        assignedBy: adminUserId,
        notes: "Seeded global admin access",
      },
    ]);
    console.log("✅ Assigned global admin role to admin@example.com");

    console.log("Seeding SIN org + form fixtures...");
    await db.delete(formVersions).where(eq(formVersions.formId, e2eFormId));
    await db.delete(forms).where(eq(forms.id, e2eFormId));
    await db
      .delete(organizationMembers)
      .where(eq(organizationMembers.organizationId, e2eOrgId));
    await db.delete(organizations).where(eq(organizations.id, e2eOrgId));

    await db.insert(organizations).values({
      id: e2eOrgId,
      name: "E2E SIN Test Org",
      slug: "e2e-sin-org",
      type: "club",
      status: "active",
      settings: {},
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(organizationMembers).values([
      {
        userId: adminUserId,
        organizationId: e2eOrgId,
        role: "owner",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: testUserId,
        organizationId: e2eOrgId,
        role: "member",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await db.insert(forms).values({
      id: e2eFormId,
      organizationId: e2eOrgId,
      name: "E2E SIN Upload Form",
      slug: "e2e-sin-upload",
      description: "Seeded form for file validation tests",
      status: "published",
      createdBy: adminUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const formDefinition = {
      fields: [
        {
          key: "supporting_document",
          type: "file",
          label: "Supporting document",
          required: true,
          fileConfig: {
            allowedTypes: ["application/pdf"],
            maxSizeBytes: 1024,
            maxFiles: 1,
          },
        },
      ],
      settings: {
        allowDraft: true,
        requireApproval: false,
        notifyOnSubmit: [],
      },
    };

    await db.insert(formVersions).values({
      id: e2eFormVersionId,
      formId: e2eFormId,
      versionNumber: 1,
      definition: formDefinition,
      publishedAt: new Date(),
      publishedBy: adminUserId,
      createdAt: new Date(),
    });
    console.log("✅ Seeded SIN org + form fixtures");

    // Create test teams
    console.log("Creating test teams...");

    await db.insert(teams).values([
      {
        id: "test-team-1",
        name: "Test Thunder",
        slug: "test-thunder",
        description: "E2E test team",
        isActive: "true",
        city: "Toronto",
        province: "ON",
        primaryColor: "#FF0000",
        secondaryColor: "#0000FF",
        createdBy: testUserId,
      },
      {
        id: "test-team-2",
        name: "Test Lightning",
        slug: "test-lightning",
        description: "Another E2E test team",
        isActive: "true",
        city: "Vancouver",
        province: "BC",
        primaryColor: "#00FF00",
        secondaryColor: "#FF00FF",
        createdBy: adminUserId,
      },
    ]);

    console.log("✅ Created test teams");

    // Create team memberships
    console.log("Creating team memberships...");

    await db.insert(teamMembers).values([
      {
        id: "test-member-1",
        teamId: "test-team-1",
        userId: testUserId,
        role: "captain" as const,
        status: "active" as const,
        jerseyNumber: "7",
        position: "Chaser",
        invitedBy: testUserId,
        joinedAt: new Date(),
      },
      {
        id: "test-member-2",
        teamId: "test-team-2",
        userId: adminUserId,
        role: "captain" as const,
        status: "active" as const,
        jerseyNumber: "1",
        position: "Keeper",
        invitedBy: adminUserId,
        joinedAt: new Date(),
      },
      {
        id: "test-member-invite-1",
        teamId: "test-team-1",
        userId: teamJoinUserId,
        role: "player" as const,
        status: "pending" as const,
        invitedBy: testUserId,
        invitedAt: new Date(),
        invitationReminderCount: 0,
        joinedAt: new Date(),
      },
      {
        id: "test-member-invite-2",
        teamId: "test-team-1",
        userId: teamInviteDeclineUserId,
        role: "player" as const,
        status: "pending" as const,
        invitedBy: testUserId,
        invitedAt: new Date(),
        invitationReminderCount: 0,
        joinedAt: new Date(),
      },
    ]);

    // Create memberships for test users
    console.log("Creating memberships for test users...");

    console.log("Creating sample events...");
    const now = new Date();
    const firstEventStart = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    const firstEventEnd = new Date(now.getFullYear(), now.getMonth() + 1, 16);
    const secondEventStart = new Date(now.getFullYear(), now.getMonth() + 2, 5);
    const secondEventEnd = new Date(now.getFullYear(), now.getMonth() + 2, 6);

    const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);

    const sampleEvents: (typeof events.$inferInsert)[] = [
      {
        id: individualEventId,
        name: "E2E Open Showcase",
        slug: "e2e-open-showcase",
        shortDescription: "Seeded event for automated individual registration flows",
        type: "tournament",
        status: "registration_open",
        city: "Toronto",
        province: "ON",
        startDate: formatDateOnly(firstEventStart),
        endDate: formatDateOnly(firstEventEnd),
        registrationOpensAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        registrationClosesAt: new Date(
          firstEventStart.getTime() + 7 * 24 * 60 * 60 * 1000,
        ),
        registrationType: "individual",
        maxParticipants: 200,
        individualRegistrationFee: 2500,
        organizerId: adminUserId,
        contactEmail: "events@quadballcanada.com",
        contactPhone: "+1 (555) 987-0001",
        allowEtransfer: true,
        etransferRecipient: "payments@quadballcanada.com",
        etransferInstructions:
          "Please include the event name 'E2E Open Showcase' and your team name in the e-transfer message. Security question: What sport? Answer: quadball",
        metadata: { seeded: true, category: "individual" },
      },
      {
        id: teamEventId,
        name: "E2E Invitational Cup",
        slug: "e2e-invitational-cup",
        shortDescription: "Draft event used to exercise team registration flows",
        type: "tournament",
        status: "draft",
        city: "Ottawa",
        province: "ON",
        startDate: formatDateOnly(secondEventStart),
        endDate: formatDateOnly(secondEventEnd),
        registrationOpensAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
        registrationClosesAt: new Date(
          secondEventStart.getTime() - 2 * 24 * 60 * 60 * 1000,
        ),
        registrationType: "team",
        maxTeams: 16,
        teamRegistrationFee: 6000,
        organizerId: teamCreatorUserId,
        contactEmail: "teams@quadballcanada.com",
        contactPhone: "+1 (555) 987-0002",
        metadata: { seeded: true, category: "team" },
      },
    ];

    await db.insert(events).values(sampleEvents);

    console.log("✅ Created sample events");

    console.log("Creating sample event registrations...");
    await db.insert(eventRegistrations).values([
      {
        id: individualRegistrationId,
        eventId: individualEventId,
        userId: testUserId,
        registrationType: "individual",
        status: "confirmed",
        paymentStatus: "paid",
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        confirmedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        notes: "Seeded via scripts/seed-e2e-data.ts",
      },
    ]);

    console.log("✅ Created sample event registrations");

    // Create active memberships for both test and admin users
    await db.insert(memberships).values([
      {
        id: "test-membership-1",
        userId: adminUserId,
        membershipTypeId: "annual-player-2025",
        status: "active" as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        paymentProvider: "mock",
        paymentId: "mock_payment_intent_1",
        metadata: {
          paymentDetails: {
            amount: 4500,
            currency: "CAD",
          },
        },
      },
      {
        id: "test-membership-2",
        userId: testUserId,
        membershipTypeId: "annual-player-2025",
        status: "active" as const,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        paymentProvider: "mock",
        paymentId: "mock_payment_intent_2",
        metadata: {
          paymentDetails: {
            amount: 4500,
            currency: "CAD",
          },
        },
      },
    ]);

    // Both test and admin users now have active memberships
    console.log(
      "✅ Created test memberships (both test and admin users have active memberships)",
    );
    console.log("✅ Test data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  } finally {
    await sql.end({ timeout: 3 }); // force close idle clients
    process.exit(0); // and make 100% sure node exits
  }
}

// Run the seed function
seed().catch((error) => {
  console.error("Failed to seed:", error);
  process.exit(1);
});
