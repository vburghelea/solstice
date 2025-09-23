import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { TeamMemberRole, TeamMemberStatus } from "~/db/schema";
import {
  addTeamMemberSchema,
  createTeamSchema,
  removeTeamMemberSchema,
  requestTeamMembershipSchema,
  teamInviteActionSchema,
  updateTeamMemberSchema,
  updateTeamSchema,
} from "./teams.schemas";

/**
 * Create a new team
 */
export const createTeam = createServerFn({ method: "POST" })
  .validator(createTeamSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { createId }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("@paralleldrive/cuid2"),
    ]);
    const { teams, teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    // Debug logging for E2E tests

    const db = await getDb();

    // Start a transaction
    return await db.transaction(async (tx) => {
      // Create the team
      const [newTeam] = await tx
        .insert(teams)
        .values({
          id: createId(),
          name: data.name,
          slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          description: data.description,
          city: data.city,
          country: data.country,
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          foundedYear: data.foundedYear,
          website: data.website,
          socialLinks: data.socialLinks ? JSON.stringify(data.socialLinks) : null,
          createdBy: currentUser.id,
        })
        .returning();

      // Add the creator as captain
      await tx.insert(teamMembers).values({
        id: createId(),
        teamId: newTeam.id,
        userId: currentUser.id,
        role: "captain" as TeamMemberRole,
        status: "active" as TeamMemberStatus,
        invitedBy: currentUser.id,
      });

      return newTeam;
    });
  });

/**
 * Update team details
 */
export const updateTeam = createServerFn({ method: "POST" })
  .validator(
    updateTeamSchema.extend({
      data: updateTeamSchema.shape.data.extend({
        socialLinks: z.record(z.string()).optional(),
        logoUrl: z.string().optional(),
      }),
    }).parse,
  )
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teams, teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check if user is captain or coach
    const [memberCheck] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!memberCheck || !["captain", "coach"].includes(memberCheck.role)) {
      throw new Error("Insufficient permissions");
    }

    // Update team
    const [updatedTeam] = await db
      .update(teams)
      .set({
        name: data.data.name,
        description: data.data.description,
        city: data.data.city,
        country: data.data.country,
        primaryColor: data.data.primaryColor,
        secondaryColor: data.data.secondaryColor,
        foundedYear: data.data.foundedYear,
        website: data.data.website,
        socialLinks: data.data.socialLinks
          ? JSON.stringify(data.data.socialLinks)
          : undefined,
        logoUrl: data.data.logoUrl,
      })
      .where(eq(teams.id, data.teamId))
      .returning();

    return updatedTeam;
  });

/**
 * Deactivate a team (soft delete)
 */
export const deactivateTeam = createServerFn({ method: "POST" })
  .validator(z.object({ teamId: z.string() }).parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teams, teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check if user is captain
    const [memberCheck] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!memberCheck || memberCheck.role !== "captain") {
      throw new Error("Only team captains can deactivate teams");
    }

    // Deactivate team
    const [deactivatedTeam] = await db
      .update(teams)
      .set({ isActive: "false" })
      .where(eq(teams.id, data.teamId))
      .returning();

    return deactivatedTeam;
  });

/**
 * Add a member to a team
 */
export const addTeamMember = createServerFn({ method: "POST" })
  .validator(addTeamMemberSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }, { createId }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
      import("@paralleldrive/cuid2"),
    ]);
    const { teamMembers, teams, user } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check if current user has permission to add members
    const [memberCheck] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!memberCheck || !["captain", "coach"].includes(memberCheck.role)) {
      throw new Error("Only captains and coaches can add team members");
    }

    // Find user by email
    const [targetUser] = await db
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.email, data.email))
      .limit(1);

    if (!targetUser) {
      throw new Error("User not found with that email address");
    }

    // Check if user is already a member
    const [existingMember] = await db
      .select({ status: teamMembers.status })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, data.teamId), eq(teamMembers.userId, targetUser.id)),
      )
      .limit(1);

    if (existingMember) {
      if (existingMember.status === "active") {
        throw new Error("User is already an active member of this team");
      }
      // Reactivate if they were previously removed
      const [reactivated] = await db
        .update(teamMembers)
        .set({
          status: "pending" as TeamMemberStatus,
          invitedBy: currentUser.id,
          role: data.role,
          jerseyNumber: data.jerseyNumber,
          position: data.position,
          leftAt: null,
          invitedAt: new Date(),
          invitationReminderCount: 0,
          lastInvitationReminderAt: null,
          requestedAt: null,
        })
        .where(
          and(eq(teamMembers.teamId, data.teamId), eq(teamMembers.userId, targetUser.id)),
        )
        .returning();
      return reactivated;
    }

    // Add new member
    const [newMember] = await db
      .insert(teamMembers)
      .values({
        id: createId(),
        teamId: data.teamId,
        userId: targetUser.id,
        role: data.role,
        status: "pending" as TeamMemberStatus,
        jerseyNumber: data.jerseyNumber,
        position: data.position,
        invitedBy: currentUser.id,
        invitedAt: new Date(),
        invitationReminderCount: 0,
        lastInvitationReminderAt: null,
        requestedAt: null,
      })
      .returning();

    // Send invitation email in the background; failure shouldn't block flow
    const { sendTeamInvitationEmail } = await import("~/lib/email/sendgrid");
    if (targetUser?.email) {
      try {
        const [teamInfo] = await db
          .select({ name: teams.name, slug: teams.slug })
          .from(teams)
          .where(eq(teams.id, data.teamId))
          .limit(1);

        await sendTeamInvitationEmail({
          to: {
            email: targetUser.email,
            name: targetUser.name ?? undefined,
          },
          teamName: teamInfo?.name ?? "Quadball Canada Team",
          teamSlug: teamInfo?.slug ?? data.teamId,
          role: data.role,
          invitedByName: currentUser.name ?? undefined,
          invitedByEmail: currentUser.email ?? undefined,
        });
      } catch (error) {
        console.error("Failed to send team invitation email", error);
      }
    }

    return newMember;
  });

/**
 * Update team member details
 */
export const updateTeamMember = createServerFn({ method: "POST" })
  .validator(updateTeamMemberSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check if current user has permission
    const [memberCheck] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!memberCheck || !["captain", "coach"].includes(memberCheck.role)) {
      throw new Error("Only captains and coaches can update team members");
    }

    // Don't allow demoting the last captain
    if (data.role && data.role !== "captain") {
      const [targetMember] = await db
        .select({ role: teamMembers.role })
        .from(teamMembers)
        .where(eq(teamMembers.id, data.memberId))
        .limit(1);

      if (targetMember?.role === "captain") {
        const captainCount = await db
          .select({ count: teamMembers.id })
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, data.teamId),
              eq(teamMembers.role, "captain"),
              eq(teamMembers.status, "active"),
            ),
          );
        if (captainCount.length <= 1) {
          throw new Error("Cannot demote the last captain");
        }
      }
    }

    // Update member
    const [updatedMember] = await db
      .update(teamMembers)
      .set({
        role: data.role,
        jerseyNumber: data.jerseyNumber,
        position: data.position,
        notes: data.notes,
      })
      .where(eq(teamMembers.id, data.memberId))
      .returning();

    return updatedMember;
  });

/**
 * Remove a member from team
 */
export const removeTeamMember = createServerFn({ method: "POST" })
  .validator(removeTeamMemberSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check if current user has permission
    const [memberCheck] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!memberCheck || !["captain", "coach"].includes(memberCheck.role)) {
      throw new Error("Only captains and coaches can remove team members");
    }

    // Don't allow removing the last captain
    const [targetMember] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(eq(teamMembers.id, data.memberId))
      .limit(1);

    if (targetMember?.role === "captain") {
      const captainCount = await db
        .select({ count: teamMembers.id })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, data.teamId),
            eq(teamMembers.role, "captain"),
            eq(teamMembers.status, "active"),
          ),
        );
      if (captainCount.length <= 1) {
        throw new Error("Cannot remove the last captain");
      }
    }

    // Soft delete by updating status
    const [removedMember] = await db
      .update(teamMembers)
      .set({
        status: "inactive" as TeamMemberStatus,
        leftAt: new Date(),
      })
      .where(eq(teamMembers.id, data.memberId))
      .returning();

    return removedMember;
  });

/**
 * Accept a team invite
 */
export const acceptTeamInvite = createServerFn({ method: "POST" })
  .validator(teamInviteActionSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Update membership status
    const [updatedMember] = await db
      .update(teamMembers)
      .set({
        status: "active" as TeamMemberStatus,
        joinedAt: new Date(),
        requestedAt: null,
      })
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "pending"),
        ),
      )
      .returning();

    if (!updatedMember) {
      throw new Error("No pending invite found for this team");
    }

    return updatedMember;
  });

/**
 * Decline a team invite
 */
export const declineTeamInvite = createServerFn({ method: "POST" })
  .validator(teamInviteActionSchema.parse)
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Update membership status
    const [declinedMember] = await db
      .update(teamMembers)
      .set({
        status: "inactive" as TeamMemberStatus,
        leftAt: new Date(),
        requestedAt: null,
      })
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "pending"),
        ),
      )
      .returning();

    if (!declinedMember) {
      throw new Error("No pending invite found for this team");
    }

    return declinedMember;
  });

export const requestTeamMembership = createServerFn({ method: "POST" })
  .validator(requestTeamMembershipSchema.parse)
  .handler(async ({ data }) => {
    const [{ getCurrentUser }, { getDb }, { and, eq }, { createId }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
      import("@paralleldrive/cuid2"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    const [existingMember] = await db
      .select({
        id: teamMembers.id,
        status: teamMembers.status,
        invitedBy: teamMembers.invitedBy,
      })
      .from(teamMembers)
      .where(
        and(eq(teamMembers.teamId, data.teamId), eq(teamMembers.userId, currentUser.id)),
      )
      .limit(1);

    if (existingMember) {
      if (existingMember.status === "active") {
        throw new Error("You are already an active member of this team");
      }

      if (existingMember.status === "pending") {
        if (existingMember.invitedBy) {
          throw new Error("You already have a pending invitation for this team");
        }

        const [refreshedMember] = await db
          .update(teamMembers)
          .set({
            requestedAt: new Date(),
            invitationReminderCount: 0,
            lastInvitationReminderAt: null,
          })
          .where(eq(teamMembers.id, existingMember.id))
          .returning();

        return refreshedMember;
      }

      const [reactivatedMember] = await db
        .update(teamMembers)
        .set({
          status: "pending" as TeamMemberStatus,
          invitedBy: null,
          requestedAt: new Date(),
          invitedAt: null,
          invitationReminderCount: 0,
          lastInvitationReminderAt: null,
          leftAt: null,
        })
        .where(eq(teamMembers.id, existingMember.id))
        .returning();

      return reactivatedMember;
    }

    const [newRequest] = await db
      .insert(teamMembers)
      .values({
        id: createId(),
        teamId: data.teamId,
        userId: currentUser.id,
        role: "player" as TeamMemberRole,
        status: "pending" as TeamMemberStatus,
        invitedBy: null,
        requestedAt: new Date(),
        invitationReminderCount: 0,
        lastInvitationReminderAt: null,
      })
      .returning();

    return newRequest;
  });

/**
 * Leave a team voluntarily
 */
export const leaveTeam = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    return data as { teamId: string };
  })
  .handler(async ({ data }) => {
    // Import server-only modules inside the handler
    const [{ getCurrentUser }, { getDb }, { and, eq }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { teamMembers } = await import("~/db/schema");

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Not authenticated");
    }

    const db = await getDb();

    // Check membership
    const [member] = await db
      .select({ role: teamMembers.role })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, data.teamId),
          eq(teamMembers.userId, currentUser.id),
          eq(teamMembers.status, "active"),
        ),
      )
      .limit(1);

    if (!member) {
      throw new Error("You are not an active member of this team");
    }

    // Don't allow the last captain to leave
    if (member.role === "captain") {
      const captainCount = await db
        .select({ count: teamMembers.id })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.teamId, data.teamId),
            eq(teamMembers.role, "captain"),
            eq(teamMembers.status, "active"),
          ),
        );
      if (captainCount.length <= 1) {
        throw new Error(
          "Cannot leave team as the last captain. Promote another member first.",
        );
      }
    }

    // Update membership status
    const [leftMember] = await db
      .update(teamMembers)
      .set({
        status: "inactive" as TeamMemberStatus,
        leftAt: new Date(),
      })
      .where(
        and(eq(teamMembers.teamId, data.teamId), eq(teamMembers.userId, currentUser.id)),
      )
      .returning();

    return leftMember;
  });
