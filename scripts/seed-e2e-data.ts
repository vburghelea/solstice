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
  memberships,
  membershipTypes,
  session,
  teams,
  user,
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
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Clear existing test data in correct order due to foreign key constraints
    console.log("Clearing existing test teams...");
    await db.delete(teams).where(like(teams.description, "%E2E test%"));

    console.log("Clearing existing memberships...");
    await db.delete(memberships);

    console.log("Clearing existing membership types...");
    await db.delete(membershipTypes);

    console.log("Clearing existing test users...");
    await db.delete(user).where(like(user.email, "%@example.com"));

    // Create test users
    const testUsers = [
      {
        id: "test-user-1",
        email: "test@example.com",
        name: "Test User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1990-01-01"),
        phone: "+1234567890",
        gender: "male" as const,
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
        id: "test-admin",
        email: "admin@example.com",
        name: "Admin User",
        emailVerified: true,
        profileComplete: true,
        dateOfBirth: new Date("1985-05-15"),
        phone: "+1234567891",
        gender: "female" as const,
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
    ];

    // Hash password for all test users using Better Auth's hash function
    const hashedPassword = await hashPassword("testpassword123");

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
        createdBy: "test-user-1",
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
        createdBy: "test-admin",
      },
    ]);

    console.log("✅ Test data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error("Failed to seed:", error);
  process.exit(1);
});
