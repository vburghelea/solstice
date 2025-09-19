#!/usr/bin/env tsx

import "dotenv/config";

import type { InferInsertModel } from "drizzle-orm";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import process from "node:process";
import postgres from "postgres";
import * as schema from "../src/db/schema";
import { roles, user, userRoles } from "../src/db/schema";

type UserRow = typeof user.$inferSelect;

const DEFAULT_ROLES: Array<InferInsertModel<typeof roles>> = [
  {
    id: "solstice-admin",
    name: "Solstice Admin",
    description: "Platform administrator with full system access",
    permissions: {
      "system:*": true,
      "roles:manage": true,
      "memberships:manage": true,
      "events:manage": true,
      "teams:manage": true,
      "reports:view": true,
    },
  },
  {
    id: "quadball-canada-admin",
    name: "Quadball Canada Admin",
    description: "Quadball Canada administrator with organization-wide access",
    permissions: {
      "quadball_canada:*": true,
      "teams:manage": true,
      "events:manage": true,
      "members:manage": true,
      "memberships:manage": true,
      "reports:view": true,
    },
  },
  {
    id: "team-admin",
    name: "Team Admin",
    description: "Administrator for a specific team",
    permissions: {
      "team:manage": true,
      "team:members:manage": true,
      "team:events:manage": true,
    },
  },
  {
    id: "event-admin",
    name: "Event Admin",
    description: "Administrator for a specific event",
    permissions: {
      "event:manage": true,
      "event:registrations:manage": true,
      "event:communications:manage": true,
    },
  },
];

const roleNameToId = new Map(DEFAULT_ROLES.map((role) => [role.name, role.id]));

function parseCommaList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function getArgValues(flag: string): string[] {
  const equalsArg = process.argv.find((arg) => arg.startsWith(`--${flag}=`));
  if (equalsArg) {
    const [, rawValue] = equalsArg.split("=");
    return parseCommaList(rawValue);
  }

  const flagIndex = process.argv.indexOf(`--${flag}`);
  if (flagIndex !== -1) {
    const values: string[] = [];
    for (let i = flagIndex + 1; i < process.argv.length; i++) {
      const next = process.argv[i];
      if (next.startsWith("--")) break;
      values.push(next);
    }
    return values;
  }

  return [];
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((value) => value.toLowerCase()))];
}

function getAssignmentsFromInput() {
  const solsticeEmails = getArgValues("solstice");
  const quadballEmails = getArgValues("quadball");

  const envSolsticeEmails = parseCommaList(process.env["SOLSTICE_ADMIN_EMAILS"]);
  const envQuadballEmails =
    parseCommaList(process.env["QUADBALL_ADMIN_EMAILS"]) ||
    parseCommaList(process.env["GLOBAL_ADMIN_EMAILS"]);

  const solstice = dedupe(solsticeEmails.length ? solsticeEmails : envSolsticeEmails);
  const quadball = dedupe(quadballEmails.length ? quadballEmails : envQuadballEmails);

  return {
    solstice,
    quadball,
  };
}

function getConnectionString(): string {
  const candidates = [
    process.env["DATABASE_URL_UNPOOLED"],
    process.env["DATABASE_UNPOOLED_URL"],
    process.env["NETLIFY_DATABASE_URL_UNPOOLED"],
    process.env["DATABASE_URL"],
    process.env["DATABASE_POOLED_URL"],
    process.env["NETLIFY_DATABASE_URL"],
  ];

  const connectionString = candidates.find(
    (value) => typeof value === "string" && value.length > 0,
  );
  if (!connectionString) {
    throw new Error(
      "No database connection string found. Set DATABASE_URL (or *_UNPOOLED) before running this script.",
    );
  }

  return connectionString;
}

async function ensureRoles(db: ReturnType<typeof drizzle>) {
  console.log("\n🛠️  Ensuring default roles exist...");

  await db
    .insert(roles)
    .values(DEFAULT_ROLES)
    .onConflictDoUpdate({
      target: roles.id,
      set: {
        name: roles.name,
        description: roles.description,
        permissions: roles.permissions,
        updatedAt: new Date(),
      },
    });

  const defaultRoleIds = DEFAULT_ROLES.map((role) => role.id).filter(
    (roleId): roleId is string => Boolean(roleId),
  );
  const existingRoles = await db
    .select()
    .from(roles)
    .where(inArray(roles.id, defaultRoleIds));
  existingRoles.forEach((role) => {
    console.log(`  • ${role.name} (${role.id})`);
  });

  return existingRoles;
}

async function findUsersByEmail(
  db: ReturnType<typeof drizzle>,
  emails: string[],
): Promise<UserRow[]> {
  if (!emails.length) return [];
  const normalized = emails.map((value) => value.toLowerCase());
  const rows = await db.select().from(user).where(inArray(user.email, normalized));

  const missing = normalized.filter(
    (email) => !rows.some((row) => row.email.toLowerCase() === email),
  );
  missing.forEach((email) => {
    console.warn(`⚠️  No user found for email: ${email}`);
  });

  return rows;
}

async function getAssignerUserId(db: ReturnType<typeof drizzle>): Promise<string | null> {
  const assignerArg = getArgValues("assigner");
  const assignerEnv = parseCommaList(process.env["ROLE_ASSIGNER_EMAIL"]);
  const assignerCandidates = dedupe(assignerArg.length ? assignerArg : assignerEnv);

  if (!assignerCandidates.length) {
    return null;
  }

  const assignerUsers = await findUsersByEmail(db, assignerCandidates);
  if (!assignerUsers.length) {
    console.warn(
      `⚠️  Could not find assigner user for provided email(s): ${assignerCandidates.join(", ")}. Falling back to self-assignment.`,
    );
    return null;
  }

  if (assignerUsers.length > 1) {
    console.warn(
      `⚠️  Multiple assigner users found (${assignerUsers.map((user) => user.email).join(", ")}). Using the first entry.`,
    );
  }

  const assignerUser = assignerUsers[0];
  const assignerHasGlobalRole = await db
    .select({ id: userRoles.id })
    .from(userRoles)
    .where(
      and(
        eq(userRoles.userId, assignerUser.id),
        isNull(userRoles.teamId),
        isNull(userRoles.eventId),
      ),
    )
    .limit(1);

  if (!assignerHasGlobalRole.length) {
    console.warn(
      `⚠️  Assigner ${assignerUser.email} does not currently hold a global admin role. The assignment will still proceed but the audit trail may appear odd.`,
    );
  }

  return assignerUser.id;
}

async function assignRoles(
  db: ReturnType<typeof drizzle>,
  assignments: Array<{ email: string; roleName: string }>,
  assignerUserId: string | null,
) {
  if (!assignments.length) {
    console.log("No role assignments requested. Skipping role assignment.");
    return;
  }

  const uniqueEmails = dedupe(assignments.map((assignment) => assignment.email));
  const users = await findUsersByEmail(db, uniqueEmails);
  const userByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));

  const timestamp = new Date().toISOString();
  for (const assignment of assignments) {
    const userRecord = userByEmail.get(assignment.email.toLowerCase());
    if (!userRecord) {
      console.warn(`⚠️  Skipping ${assignment.email} – user not found.`);
      continue;
    }

    const roleId = roleNameToId.get(assignment.roleName);
    let resolvedRoleId = roleId;

    if (!resolvedRoleId) {
      const [roleRow] = await db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, assignment.roleName))
        .limit(1);

      if (!roleRow) {
        console.warn(
          `⚠️  Skipping ${assignment.email} – role ${assignment.roleName} not found.`,
        );
        continue;
      }

      resolvedRoleId = roleRow.id;
    }

    const [existingAssignment] = await db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, userRecord.id),
          eq(userRoles.roleId, resolvedRoleId),
          isNull(userRoles.teamId),
          isNull(userRoles.eventId),
        ),
      )
      .limit(1);

    if (existingAssignment) {
      console.log(
        `ℹ️  ${assignment.email} already has ${assignment.roleName}. Skipping.`,
      );
      continue;
    }

    const assignedBy = assignerUserId ?? userRecord.id;

    await db.insert(userRoles).values({
      userId: userRecord.id,
      roleId: resolvedRoleId,
      assignedBy,
      notes: `Seeded via seed-global-admins.ts on ${timestamp}`,
    });

    console.log(`✅ Assigned ${assignment.roleName} to ${assignment.email}`);
  }
}

async function main() {
  console.log("🌱 Running global admin role seed script...");

  const assignmentsInput = getAssignmentsFromInput();
  const assignments: Array<{ email: string; roleName: string }> = [];

  assignmentsInput.solstice.forEach((email) => {
    assignments.push({ email, roleName: "Solstice Admin" });
  });

  assignmentsInput.quadball.forEach((email) => {
    assignments.push({ email, roleName: "Quadball Canada Admin" });
  });

  const connectionString = getConnectionString();
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema, casing: "snake_case" });

  try {
    const ensuredRoles = await ensureRoles(db);
    const roleNames = ensuredRoles.map((role) => role.name).join(", ");
    console.log(`✅ Roles ensured: ${roleNames}`);

    if (!assignments.length) {
      console.log(
        "No admin emails provided via flags or environment. The script ensured roles exist and will now exit.",
      );
      return;
    }

    const assignerUserId = await getAssignerUserId(db);
    await assignRoles(db, assignments, assignerUserId);
  } catch (error) {
    console.error("❌ Failed to seed global admins:", error);
    process.exitCode = 1;
  } finally {
    await sql.end({ timeout: 3 });
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
