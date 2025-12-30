import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  getRegistrationGroupSchema,
  getRegistrationInvitePreviewSchema,
  listRegistrationGroupsSchema,
} from "./registration-groups.schemas";
import type {
  RegistrationGroupRoster,
  RegistrationInvitePreview,
} from "./registration-groups.types";
import { hashRegistrationInviteToken } from "./registration-groups.utils";

export const getRegistrationGroup = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(getRegistrationGroupSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const authUser = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { events, registrationGroupMembers, registrationGroups, user } =
      await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const { forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [groupRow] = await db
      .select({
        group: registrationGroups,
        organizerId: events.organizerId,
      })
      .from(registrationGroups)
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationGroups.id, data.groupId))
      .limit(1);

    if (!groupRow) {
      throw notFound("Registration group not found.");
    }

    const userIsAdmin = await isAdmin(authUser.id);
    const [memberAccess] = await db
      .select({ id: registrationGroupMembers.id })
      .from(registrationGroupMembers)
      .where(
        and(
          eq(registrationGroupMembers.groupId, data.groupId),
          eq(registrationGroupMembers.userId, authUser.id),
        ),
      )
      .limit(1);

    if (!memberAccess && groupRow.organizerId !== authUser.id && !userIsAdmin) {
      throw forbidden("You do not have access to this registration group.");
    }

    const members = await db
      .select({
        id: registrationGroupMembers.id,
        userId: registrationGroupMembers.userId,
        email: registrationGroupMembers.email,
        status: registrationGroupMembers.status,
        role: registrationGroupMembers.role,
        invitedAt: registrationGroupMembers.invitedAt,
        joinedAt: registrationGroupMembers.joinedAt,
        userName: user.name,
        userEmail: user.email,
      })
      .from(registrationGroupMembers)
      .leftJoin(user, eq(registrationGroupMembers.userId, user.id))
      .where(eq(registrationGroupMembers.groupId, data.groupId))
      .orderBy(registrationGroupMembers.createdAt);

    return {
      group: {
        ...groupRow.group,
        metadata: groupRow.group.metadata as Record<string, object> | null,
      },
      members: members.map((member) => ({
        id: member.id,
        userId: member.userId,
        email: member.email ?? member.userEmail ?? null,
        status: member.status,
        role: member.role,
        invitedAt: member.invitedAt ?? null,
        joinedAt: member.joinedAt ?? null,
        userName: member.userName ?? null,
      })),
    };
  });

export const listRegistrationGroupsForEvent = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(listRegistrationGroupsSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const authUser = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const {
      eventRegistrations,
      events,
      registrationGroupMembers,
      registrationGroups,
      user,
    } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const { forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [event] = await db
      .select({ organizerId: events.organizerId })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) {
      throw notFound("Event not found.");
    }

    const userIsAdmin = await isAdmin(authUser.id);
    if (event.organizerId !== authUser.id && !userIsAdmin) {
      throw forbidden("Only organizers can export registration rosters.");
    }

    const rows = await db
      .select({
        group: registrationGroups,
        registrationId: eventRegistrations.id,
        registrationStatus: eventRegistrations.status,
        paymentStatus: eventRegistrations.paymentStatus,
        memberId: registrationGroupMembers.id,
        memberUserId: registrationGroupMembers.userId,
        memberEmail: registrationGroupMembers.email,
        memberStatus: registrationGroupMembers.status,
        memberRole: registrationGroupMembers.role,
        memberInvitedAt: registrationGroupMembers.invitedAt,
        memberJoinedAt: registrationGroupMembers.joinedAt,
        memberName: user.name,
      })
      .from(registrationGroups)
      .leftJoin(
        eventRegistrations,
        eq(eventRegistrations.registrationGroupId, registrationGroups.id),
      )
      .leftJoin(
        registrationGroupMembers,
        eq(registrationGroupMembers.groupId, registrationGroups.id),
      )
      .leftJoin(user, eq(registrationGroupMembers.userId, user.id))
      .where(eq(registrationGroups.eventId, data.eventId))
      .orderBy(
        desc(registrationGroups.createdAt),
        desc(registrationGroupMembers.createdAt),
      );

    const groups = new Map<string, RegistrationGroupRoster>();
    for (const row of rows) {
      const existing = groups.get(row.group.id);
      const registration = row.registrationId
        ? {
            id: row.registrationId,
            status: row.registrationStatus ?? "pending",
            paymentStatus: row.paymentStatus ?? "pending",
          }
        : null;

      if (!existing) {
        groups.set(row.group.id, {
          group: {
            ...row.group,
            metadata: row.group.metadata as Record<string, object> | null,
          },
          registration,
          members: [],
        });
      }

      if (row.memberId) {
        groups.get(row.group.id)?.members.push({
          id: row.memberId,
          userId: row.memberUserId,
          email: row.memberEmail ?? null,
          status: row.memberStatus ?? "pending",
          role: row.memberRole ?? "member",
          invitedAt: row.memberInvitedAt ?? null,
          joinedAt: row.memberJoinedAt ?? null,
          userName: row.memberName ?? null,
        });
      }
    }

    return Array.from(groups.values());
  });

/**
 * Get invite preview details by token (public - no auth required).
 * Used to show event/group info before user accepts/declines.
 * Note: No feature gate check - invites should be accessible cross-tenant.
 */
export const getRegistrationInvitePreview = createServerFn({ method: "GET" })
  .inputValidator(getRegistrationInvitePreviewSchema.parse)
  .handler(async ({ data }): Promise<RegistrationInvitePreview> => {
    const { getDb } = await import("~/db/server-helpers");
    const {
      events,
      registrationGroups,
      registrationInvites,
      user: users,
      registrationGroupMembers,
    } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const tokenHash = await hashRegistrationInviteToken(data.token);

    const [invite] = await db
      .select({
        id: registrationInvites.id,
        status: registrationInvites.status,
        expiresAt: registrationInvites.expiresAt,
        email: registrationInvites.email,
        groupId: registrationInvites.groupId,
      })
      .from(registrationInvites)
      .where(eq(registrationInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite) {
      return {
        valid: false,
        expired: false,
        eventId: null,
        eventName: null,
        eventStartDate: null,
        groupType: null,
        invitedByName: null,
        invitedByEmail: null,
        inviteEmail: null,
      };
    }

    const now = new Date();
    const isExpired =
      invite.status !== "pending" ||
      (invite.expiresAt !== null && invite.expiresAt <= now);

    const [groupRow] = await db
      .select({
        groupType: registrationGroups.groupType,
        eventId: registrationGroups.eventId,
        eventName: events.name,
        eventStartDate: events.startDate,
      })
      .from(registrationGroups)
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationGroups.id, invite.groupId))
      .limit(1);

    // Get inviter info from the captain member
    const [captainMember] = await db
      .select({
        invitedByUserId: registrationGroupMembers.invitedByUserId,
      })
      .from(registrationGroupMembers)
      .where(eq(registrationGroupMembers.groupId, invite.groupId))
      .limit(1);

    let invitedByName: string | null = null;
    let invitedByEmail: string | null = null;

    if (captainMember?.invitedByUserId) {
      const [inviter] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, captainMember.invitedByUserId))
        .limit(1);

      if (inviter) {
        invitedByName = inviter.name;
        invitedByEmail = inviter.email;
      }
    }

    return {
      valid: invite.status === "pending",
      expired: isExpired,
      eventId: groupRow?.eventId ?? null,
      eventName: groupRow?.eventName ?? null,
      eventStartDate: groupRow?.eventStartDate ? new Date(groupRow.eventStartDate) : null,
      groupType: groupRow?.groupType ?? null,
      invitedByName,
      invitedByEmail,
      inviteEmail: invite.email,
    };
  });
