#!/usr/bin/env tsx
/**
 * Seed script for E2E test data
 * Run with: pnpm tsx scripts/seed-e2e-data.ts
 */

import { hashPassword } from "better-auth/crypto";
import dotenv from "dotenv";
import { like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  account,
  eventAnnouncements,
  eventRegistrations,
  events,
  memberships,
  membershipTypes,
  roles,
  session,
  teamMembers,
  teams,
  user,
  userRoles,
} from "../src/db/schema";

// Load environment variables
dotenv.config({ path: ".env.e2e" });

async function seed() {
  console.log("🌱 Seeding E2E test data...");

  // Use E2E database URL if available, otherwise use regular DB from env
  const connectionString =
    process.env["E2E_DATABASE_URL"] || process.env["DATABASE_URL"] || "";

  if (!connectionString) {
    throw new Error("No database URL found. Please set E2E_DATABASE_URL or DATABASE_URL");
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
  const squareTestUserId = "clxpfz4jn000608l8g8l9f7p8"; // User for Square sandbox testing

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

    // 2. Clear sessions and accounts before users
    console.log("Clearing sessions...");
    await db.delete(session).where(like(session.userId, "clxpfz4jn%"));

    console.log("Clearing accounts...");
    await db.delete(account).where(like(account.userId, "clxpfz4jn%"));

    // 3. Now we can safely clear users
    console.log("Clearing test users...");
    await db.delete(user).where(like(user.email, "%@example.com"));

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
      // Create user
      await db.insert(user).values({
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create account for password login
      await db.insert(account).values({
        id: `${userData.id}-account`,
        userId: userData.id,
        providerId: "credential",
        accountId: userData.email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create session (optional, for pre-authenticated tests)
      await db.insert(session).values({
        id: `${userData.id}-session`,
        userId: userData.id,
        token: `test-token-${userData.id}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
      });

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
    ]);

    // Create memberships for test users
    console.log("Creating memberships for test users...");

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
