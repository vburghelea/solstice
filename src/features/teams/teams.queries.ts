import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
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
  .validator(zod$(getTeamSchema))
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
  .validator(zod$(getTeamBySlugSchema))
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
  .validator(zod$(listTeamsSchema))
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
  .validator(zod$(listTeamsSchema))
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
  .validator(zod$(getTeamMembersSchema))
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { teamMembers, user } = await import("~/db/schema");
    const { and, eq, inArray, sql } = await import("drizzle-orm");

    const db = await getDb();

    const statusCondition = data.includeInactive
      ? undefined
      : inArray(teamMembers.status, ["active", "pending"]);

    const conditions = and(eq(teamMembers.teamId, data.teamId), statusCondition);

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
          invitedAt: teamMembers.invitedAt,
          requestedAt: teamMembers.requestedAt,
          invitationReminderCount: teamMembers.invitationReminderCount,
          lastInvitationReminderAt: teamMembers.lastInvitationReminderAt,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          uploadedAvatarPath: user.uploadedAvatarPath,
        },
        invitedBy: {
          id: sql<string | null>`inviter.id`,
          name: sql<string | null>`inviter.name`,
          email: sql<string | null>`inviter.email`,
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

export const getPendingTeamInvites = createServerFn({ method: "POST" }).handler(
  async () => {
    const [{ getCurrentUser }, { getDb }, { and, eq, sql }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers, teams, user } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    const invites = await db
      .select({
        membership: {
          id: teamMembers.id,
          teamId: teamMembers.teamId,
          role: teamMembers.role,
          invitedAt: teamMembers.invitedAt,
          requestedAt: teamMembers.requestedAt,
          invitedBy: teamMembers.invitedBy,
        },
        team: {
          id: teams.id,
          name: teams.name,
          slug: teams.slug,
        },
        inviter: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(teamMembers)
      .innerJoin(teams, eq(teamMembers.teamId, teams.id))
      .leftJoin(user, eq(teamMembers.invitedBy, user.id))
      .where(
        and(eq(teamMembers.userId, currentUser.id), eq(teamMembers.status, "pending")),
      )
      .orderBy(sql`COALESCE(${teamMembers.invitedAt}, ${teamMembers.requestedAt}) DESC`);

    return invites;
  },
);

/**
 * Check if a user is a member of a team
 */
export const isTeamMember = createServerFn({ method: "POST" })
  .validator(zod$(isTeamMemberSchema))
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
 * Determine if the current user and a target user are teammates (share the same active team)
 */
export const areTeammatesWithCurrentUser = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ userId: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const [{ getDb }, { teamMembers }, { and, eq }] = await Promise.all([
      import("~/db/server-helpers"),
      import("~/db/schema"),
      import("drizzle-orm"),
    ]);

    // Get current session user
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const auth = await getAuth();
    const { getWebRequest } = await import("@tanstack/react-start/server");
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });
    const viewerId = session?.user?.id;

    if (!viewerId) return { areTeammates: false };

    const db = await getDb();

    // Find viewer's active team
    const [viewerMembership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(and(eq(teamMembers.userId, viewerId), eq(teamMembers.status, "active")))
      .limit(1);

    if (!viewerMembership?.teamId) return { areTeammates: false };

    // Check if target user has an active membership in the same team
    const [targetMembership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.userId, data.userId),
          eq(teamMembers.status, "active"),
          eq(teamMembers.teamId, viewerMembership.teamId),
        ),
      )
      .limit(1);

    return { areTeammates: !!targetMembership };
  });

/**
 * Search teams by name or city
 */
export const searchTeams = createServerFn({ method: "POST" })
  .validator(zod$(searchTeamsSchema))
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
export type PendingTeamInvite = Awaited<ReturnType<typeof getPendingTeamInvites>>[number];
