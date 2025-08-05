import { createServerFn } from "@tanstack/react-start";
import {
  getTeamBySlugSchema,
  getTeamMembersSchema,
  getTeamSchema,
  isTeamMemberSchema,
  listTeamsSchema,
  searchTeamsSchema,
} from "./teams.schemas";

/**
 * Get a team by ID with member count
 */
export const getTeam = createServerFn({ method: "POST" })
  .validator(getTeamSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teams, teamMembers } = await import("~/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");

    const db = await getDb();

    const result = await db
      .select({
        team: teams,
        memberCount: sql<number>`count(distinct ${teamMembers.userId})::int`,
      })
      .from(teams)
      .leftJoin(
        teamMembers,
        and(eq(teamMembers.teamId, teams.id), eq(teamMembers.status, "active")),
      )
      .where(eq(teams.id, data.teamId))
      .groupBy(teams.id)
      .limit(1);

    return result[0] || null;
  });

/**
 * Get a team by slug
 */
export const getTeamBySlug = createServerFn({ method: "POST" })
  .validator(getTeamBySlugSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teams, teamMembers } = await import("~/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");

    const db = await getDb();

    const result = await db
      .select({
        team: teams,
        memberCount: sql<number>`count(distinct ${teamMembers.userId})::int`,
      })
      .from(teams)
      .leftJoin(
        teamMembers,
        and(eq(teamMembers.teamId, teams.id), eq(teamMembers.status, "active")),
      )
      .where(eq(teams.slug, data.slug))
      .groupBy(teams.id)
      .limit(1);

    return result[0] || null;
  });

/**
 * List all active teams
 */
export const listTeams = createServerFn({ method: "POST" })
  .validator(listTeamsSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teams, teamMembers, user } = await import("~/db/schema");
    const { and, desc, eq, sql } = await import("drizzle-orm");

    const db = await getDb();

    const conditions = data?.includeInactive ? undefined : eq(teams.isActive, "true");

    const result = await db
      .select({
        team: teams,
        memberCount: sql<number>`count(distinct ${teamMembers.userId})::int`,
        creator: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(teams)
      .leftJoin(user, eq(teams.createdBy, user.id))
      .leftJoin(
        teamMembers,
        and(eq(teamMembers.teamId, teams.id), eq(teamMembers.status, "active")),
      )
      .where(conditions)
      .groupBy(teams.id, user.id, user.name, user.email)
      .orderBy(desc(teams.createdAt));

    return result;
  });

/**
 * Get teams for the current user
 */
export const getUserTeams = createServerFn({ method: "POST" })
  .validator(listTeamsSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
    ]);
    const { teams, teamMembers } = await import("~/db/schema");
    const { and, desc, eq, sql } = await import("drizzle-orm");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    const statusConditions = data?.includeInactive
      ? undefined
      : eq(teamMembers.status, "active");

    const result = await db
      .select({
        team: teams,
        membership: {
          role: teamMembers.role,
          status: teamMembers.status,
          joinedAt: teamMembers.joinedAt,
          jerseyNumber: teamMembers.jerseyNumber,
          position: teamMembers.position,
        },
        memberCount: sql<number>`count(distinct tm2.user_id)::int`,
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .leftJoin(
        sql`${teamMembers} as tm2`,
        and(sql`tm2.team_id = ${teams.id}`, sql`tm2.status = 'active'`),
      )
      .where(and(eq(teamMembers.userId, currentUser.id), statusConditions))
      .groupBy(
        teams.id,
        teamMembers.role,
        teamMembers.status,
        teamMembers.joinedAt,
        teamMembers.jerseyNumber,
        teamMembers.position,
      )
      .orderBy(desc(teamMembers.joinedAt));

    return result;
  });

/**
 * Get team members
 */
export const getTeamMembers = createServerFn({ method: "POST" })
  .validator(getTeamMembersSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teamMembers, user } = await import("~/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");

    const db = await getDb();

    const conditions = and(
      eq(teamMembers.teamId, data.teamId),
      data.includeInactive ? undefined : eq(teamMembers.status, "active"),
    );

    const result = await db
      .select({
        member: {
          id: teamMembers.id,
          role: teamMembers.role,
          status: teamMembers.status,
          jerseyNumber: teamMembers.jerseyNumber,
          position: teamMembers.position,
          joinedAt: teamMembers.joinedAt,
          leftAt: teamMembers.leftAt,
          notes: teamMembers.notes,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        invitedBy: {
          id: sql<string | null>`inviter.id`,
          name: sql<string | null>`inviter.name`,
        },
      })
      .from(teamMembers)
      .innerJoin(user, eq(teamMembers.userId, user.id))
      .leftJoin(sql`${user} as inviter`, sql`${teamMembers.invitedBy} = inviter.id`)
      .where(conditions)
      .orderBy(
        sql`CASE ${teamMembers.role} 
          WHEN 'captain' THEN 1 
          WHEN 'coach' THEN 2 
          WHEN 'player' THEN 3 
          WHEN 'substitute' THEN 4 
        END`,
        teamMembers.joinedAt,
      );

    return result;
  });

/**
 * Check if a user is a member of a team
 */
export const isTeamMember = createServerFn({ method: "POST" })
  .validator(isTeamMemberSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teamMembers } = await import("~/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");

    const db = await getDb();

    const result = await db
      .select({
        isMember: sql<boolean>`COUNT(*) > 0`,
        role: teamMembers.role,
        status: teamMembers.status,
      })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, data.teamId), eq(teamMembers.userId, data.userId)),
      )
      .groupBy(teamMembers.role, teamMembers.status)
      .limit(1);

    return result[0] || { isMember: false, role: null, status: null };
  });

/**
 * Search teams by name or city
 */
export const searchTeams = createServerFn({ method: "POST" })
  .validator(searchTeamsSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teams, teamMembers } = await import("~/db/schema");
    const { and, eq, sql } = await import("drizzle-orm");

    const db = await getDb();
    const searchTerm = `%${data.query}%`;

    const result = await db
      .select({
        team: teams,
        memberCount: sql<number>`count(distinct ${teamMembers.userId})::int`,
      })
      .from(teams)
      .leftJoin(
        teamMembers,
        and(eq(teamMembers.teamId, teams.id), eq(teamMembers.status, "active")),
      )
      .where(
        and(
          eq(teams.isActive, "true"),
          sql`(
            ${teams.name} ILIKE ${searchTerm} OR
            ${teams.city} ILIKE ${searchTerm}
          )`,
        ),
      )
      .groupBy(teams.id)
      .orderBy(teams.name)
      .limit(20);

    return result;
  });

// Export types
export type TeamWithMemberCount = Awaited<ReturnType<typeof getTeam>>;
export type TeamListItem = Awaited<ReturnType<typeof listTeams>>[number];
export type UserTeam = Awaited<ReturnType<typeof getUserTeams>>[number];
export type TeamMemberDetails = Awaited<ReturnType<typeof getTeamMembers>>[number];
