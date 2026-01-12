import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { canTransitionGroupMemberStatus } from "./registration-groups.rules";
import {
  acceptRegistrationInviteSchema,
  createRegistrationGroupSchema,
  declineRegistrationInviteSchema,
  inviteRegistrationGroupMemberSchema,
  removeRegistrationGroupMemberSchema,
  revokeRegistrationInviteSchema,
  updateRegistrationGroupSchema,
} from "./registration-groups.schemas";
import type {
  RegistrationGroupInvitePayload,
  RegistrationInviteRedemptionResult,
} from "./registration-groups.types";
import {
  generateRegistrationInviteToken,
  hashRegistrationInviteToken,
  normalizeInviteEmail,
  resolveInviteExpiry,
} from "./registration-groups.utils";

export const createRegistrationGroup = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(createRegistrationGroupSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { events, registrationGroupMembers, registrationGroups } =
      await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound, validationError } = await import("~/lib/server/errors");

    if (
      data.minSize !== undefined &&
      data.maxSize !== undefined &&
      data.minSize > data.maxSize
    ) {
      throw validationError("Minimum size cannot exceed maximum size.");
    }

    const db = await getDb();
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1);

    if (!event) {
      throw notFound("Event not found.");
    }

    const now = new Date();
    const result = await db.transaction(async (tx) => {
      const [group] = await tx
        .insert(registrationGroups)
        .values({
          eventId: data.eventId,
          groupType: data.groupType,
          status: "draft",
          captainUserId: user.id,
          teamId: data.teamId ?? null,
          minSize: data.minSize ?? null,
          maxSize: data.maxSize ?? null,
          metadata: data.metadata ?? null,
        })
        .returning();

      const [captainMember] = await tx
        .insert(registrationGroupMembers)
        .values({
          groupId: group.id,
          userId: user.id,
          email: user.email ?? null,
          role: "captain",
          status: "active",
          invitedByUserId: user.id,
          invitedAt: now,
          joinedAt: now,
        })
        .returning();

      return { group, captainMember };
    });

    if (result.group) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REGISTRATION_GROUP_CREATE",
        actorUserId: user.id,
        targetType: "registration_group",
        targetId: result.group.id,
        metadata: {
          eventId: result.group.eventId,
          groupType: result.group.groupType,
        },
      });
    }

    return {
      group: {
        ...result.group,
        metadata: result.group.metadata as Record<string, object> | null,
      },
      captainMember: {
        ...result.captainMember,
        rosterMetadata: result.captainMember.rosterMetadata as Record<
          string,
          object
        > | null,
      },
    };
  });

export const updateRegistrationGroup = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(updateRegistrationGroupSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { events, registrationGroups } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const { createAuditDiff, logDataChange } = await import("~/lib/audit");
    const { forbidden, notFound, validationError } = await import("~/lib/server/errors");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");

    if (
      data.data.minSize !== undefined &&
      data.data.maxSize !== undefined &&
      data.data.minSize > data.data.maxSize
    ) {
      throw validationError("Minimum size cannot exceed maximum size.");
    }

    const db = await getDb();
    const [groupRow] = await db
      .select({
        group: registrationGroups,
        organizerId: events.organizerId,
        eventName: events.name,
      })
      .from(registrationGroups)
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationGroups.id, data.groupId))
      .limit(1);

    if (!groupRow) {
      throw notFound("Registration group not found.");
    }

    const userIsAdmin = await isAdmin(user.id);
    if (
      groupRow.group.captainUserId !== user.id &&
      groupRow.organizerId !== user.id &&
      !userIsAdmin
    ) {
      throw forbidden("You do not have access to update this group.");
    }

    const updates = {
      ...(data.data.status ? { status: data.data.status } : null),
      ...(data.data.minSize !== undefined ? { minSize: data.data.minSize } : null),
      ...(data.data.maxSize !== undefined ? { maxSize: data.data.maxSize } : null),
      ...(data.data.teamId !== undefined ? { teamId: data.data.teamId } : null),
      ...(data.data.metadata !== undefined ? { metadata: data.data.metadata } : null),
      updatedAt: new Date(),
    };

    const [updated] = await db
      .update(registrationGroups)
      .set(updates)
      .where(and(eq(registrationGroups.id, data.groupId)))
      .returning();

    if (updated) {
      const changes = await createAuditDiff(groupRow.group, updated);
      await logDataChange({
        action: "REGISTRATION_GROUP_UPDATE",
        actorUserId: user.id,
        targetType: "registration_group",
        targetId: updated.id,
        changes,
      });
    }

    if (!updated) {
      return updated;
    }

    return {
      ...updated,
      metadata: updated.metadata as Record<string, object> | null,
    };
  });

export const inviteRegistrationGroupMember = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(inviteRegistrationGroupMemberSchema.parse)
  .handler(async ({ data, context }): Promise<RegistrationGroupInvitePayload> => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const {
      events,
      registrationGroupMembers,
      registrationGroups,
      registrationInvites,
      user: users,
    } = await import("~/db/schema");
    const { and, eq, inArray, or, sql } = await import("drizzle-orm");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const { forbidden, notFound, validationError } = await import("~/lib/server/errors");

    const db = await getDb();
    const normalizedEmail = normalizeInviteEmail(data.email);
    const [groupRow] = await db
      .select({
        group: registrationGroups,
        organizerId: events.organizerId,
        eventName: events.name,
      })
      .from(registrationGroups)
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationGroups.id, data.groupId))
      .limit(1);

    if (!groupRow) {
      throw notFound("Registration group not found.");
    }

    const userIsAdmin = await isAdmin(user.id);
    if (
      groupRow.group.captainUserId !== user.id &&
      groupRow.organizerId !== user.id &&
      !userIsAdmin
    ) {
      throw forbidden("You do not have access to invite members to this group.");
    }

    const memberCountResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(registrationGroupMembers)
      .where(
        and(
          eq(registrationGroupMembers.groupId, groupRow.group.id),
          inArray(registrationGroupMembers.status, ["invited", "pending", "active"]),
        ),
      )
      .limit(1);

    const memberCount = memberCountResult[0]?.count ?? 0;
    if (groupRow.group.maxSize && memberCount >= groupRow.group.maxSize) {
      throw validationError("This registration group is already full.");
    }

    const [targetUser] = await db
      .select({ id: users.id, email: users.email, name: users.name })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    const [existingMember] = await db
      .select()
      .from(registrationGroupMembers)
      .where(
        and(
          eq(registrationGroupMembers.groupId, groupRow.group.id),
          targetUser
            ? or(
                eq(registrationGroupMembers.userId, targetUser.id),
                eq(registrationGroupMembers.email, normalizedEmail),
              )
            : eq(registrationGroupMembers.email, normalizedEmail),
        ),
      )
      .limit(1);

    if (existingMember?.status === "active") {
      throw validationError("This member is already active in the group.");
    }

    if (
      existingMember &&
      !canTransitionGroupMemberStatus(existingMember.status, "invited")
    ) {
      throw validationError("This member cannot be invited at the moment.");
    }

    const token = await generateRegistrationInviteToken();
    const tokenHash = await hashRegistrationInviteToken(token);
    const expiresAt = resolveInviteExpiry(data.expiresAt);
    const now = new Date();

    const result = await db.transaction(async (tx) => {
      let memberId: string | undefined;
      if (existingMember) {
        const [updatedMember] = await tx
          .update(registrationGroupMembers)
          .set({
            status: "invited",
            role: data.role,
            userId: targetUser?.id ?? existingMember.userId,
            email: normalizedEmail,
            invitedByUserId: user.id,
            invitedAt: now,
            joinedAt: null,
            updatedAt: now,
          })
          .where(eq(registrationGroupMembers.id, existingMember.id))
          .returning({ id: registrationGroupMembers.id });
        memberId = updatedMember?.id;
      } else {
        const [createdMember] = await tx
          .insert(registrationGroupMembers)
          .values({
            groupId: groupRow.group.id,
            userId: targetUser?.id ?? null,
            email: normalizedEmail,
            role: data.role,
            status: "invited",
            invitedByUserId: user.id,
            invitedAt: now,
          })
          .returning({ id: registrationGroupMembers.id });
        memberId = createdMember?.id;
      }

      await tx
        .update(registrationInvites)
        .set({ status: "revoked", updatedAt: now })
        .where(
          and(
            eq(registrationInvites.groupId, groupRow.group.id),
            eq(registrationInvites.email, normalizedEmail),
            eq(registrationInvites.status, "pending"),
          ),
        );

      const [invite] = await tx
        .insert(registrationInvites)
        .values({
          groupId: groupRow.group.id,
          email: normalizedEmail,
          tokenHash,
          status: "pending",
          expiresAt,
        })
        .returning();

      return {
        inviteId: invite.id,
        memberId: memberId ?? invite.id,
      };
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REGISTRATION_GROUP_INVITE",
      actorUserId: user.id,
      targetType: "registration_invite",
      targetId: result.inviteId,
      metadata: {
        groupId: groupRow.group.id,
        email: normalizedEmail,
        expiresAt: expiresAt?.toISOString() ?? null,
      },
    });

    {
      const { sendRegistrationGroupInviteEmail } = await import("~/lib/email/email");
      try {
        await sendRegistrationGroupInviteEmail({
          to: {
            email: normalizedEmail,
            name: targetUser?.name ?? undefined,
          },
          eventId: groupRow.group.eventId,
          eventName: groupRow.eventName ?? undefined,
          groupType: groupRow.group.groupType,
          inviteToken: token,
          invitedByName: user.name ?? undefined,
          invitedByEmail: user.email ?? undefined,
        });
      } catch (error) {
        console.error("Failed to send registration group invite email", error);
      }
    }

    return {
      inviteId: result.inviteId,
      memberId: result.memberId,
      token,
      expiresAt,
    };
  });

export const revokeRegistrationInvite = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(revokeRegistrationInviteSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { registrationInvites, registrationGroups, events, registrationGroupMembers } =
      await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const { forbidden, notFound, validationError } = await import("~/lib/server/errors");

    const db = await getDb();
    const [invite] = await db
      .select({
        id: registrationInvites.id,
        groupId: registrationInvites.groupId,
        email: registrationInvites.email,
        status: registrationInvites.status,
        organizerId: events.organizerId,
        captainUserId: registrationGroups.captainUserId,
      })
      .from(registrationInvites)
      .innerJoin(
        registrationGroups,
        eq(registrationInvites.groupId, registrationGroups.id),
      )
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationInvites.id, data.inviteId))
      .limit(1);

    if (!invite) {
      throw notFound("Invite not found.");
    }

    if (invite.status !== "pending") {
      throw validationError("Only pending invites can be revoked.");
    }

    const userIsAdmin = await isAdmin(user.id);
    if (
      invite.captainUserId !== user.id &&
      invite.organizerId !== user.id &&
      !userIsAdmin
    ) {
      throw forbidden("You do not have access to revoke this invite.");
    }

    const now = new Date();
    const [updatedInvite] = await db
      .update(registrationInvites)
      .set({ status: "revoked", updatedAt: now })
      .where(eq(registrationInvites.id, invite.id))
      .returning();

    if (updatedInvite) {
      await db
        .update(registrationGroupMembers)
        .set({ status: "removed", updatedAt: now })
        .where(
          and(
            eq(registrationGroupMembers.groupId, invite.groupId),
            eq(registrationGroupMembers.email, invite.email),
          ),
        );

      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REGISTRATION_GROUP_INVITE_REVOKE",
        actorUserId: user.id,
        targetType: "registration_invite",
        targetId: updatedInvite.id,
        metadata: { groupId: invite.groupId, email: invite.email },
      });
    }

    return updatedInvite;
  });

export const acceptRegistrationInvite = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(acceptRegistrationInviteSchema.parse)
  .handler(async ({ data, context }): Promise<RegistrationInviteRedemptionResult> => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    if (!user.email) {
      const { validationError } = await import("~/lib/server/errors");
      throw validationError("A verified email is required to accept this invite.");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { registrationGroupMembers, registrationInvites } = await import("~/db/schema");
    const { and, eq, or } = await import("drizzle-orm");
    const { notFound, validationError } = await import("~/lib/server/errors");

    const db = await getDb();
    const tokenHash = await hashRegistrationInviteToken(data.token);
    const [invite] = await db
      .select()
      .from(registrationInvites)
      .where(eq(registrationInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite || invite.status !== "pending") {
      throw notFound("Invite is invalid or expired.");
    }

    const now = new Date();
    if (invite.expiresAt && invite.expiresAt <= now) {
      await db
        .update(registrationInvites)
        .set({ status: "expired", updatedAt: now })
        .where(eq(registrationInvites.id, invite.id));
      throw notFound("Invite is invalid or expired.");
    }

    if (normalizeInviteEmail(invite.email) !== normalizeInviteEmail(user.email)) {
      throw validationError("This invite does not match your account email.");
    }

    const [member] = await db
      .select()
      .from(registrationGroupMembers)
      .where(
        and(
          eq(registrationGroupMembers.groupId, invite.groupId),
          or(
            eq(registrationGroupMembers.userId, user.id),
            eq(registrationGroupMembers.email, normalizeInviteEmail(user.email)),
          ),
        ),
      )
      .limit(1);

    if (member?.status === "active") {
      await db
        .update(registrationInvites)
        .set({
          status: "accepted",
          acceptedByUserId: user.id,
          acceptedAt: now,
          updatedAt: now,
        })
        .where(eq(registrationInvites.id, invite.id));

      return {
        status: "already_member",
        groupId: invite.groupId,
        memberId: member.id,
      };
    }

    if (member && !canTransitionGroupMemberStatus(member.status, "active")) {
      throw validationError("This invite cannot be accepted at the moment.");
    }

    const result = await db.transaction(async (tx) => {
      let memberId = member?.id;

      if (member) {
        await tx
          .update(registrationGroupMembers)
          .set({
            status: "active",
            userId: user.id,
            email: normalizeInviteEmail(user.email ?? ""),
            joinedAt: now,
            updatedAt: now,
          })
          .where(eq(registrationGroupMembers.id, member.id));
      } else {
        const [created] = await tx
          .insert(registrationGroupMembers)
          .values({
            groupId: invite.groupId,
            userId: user.id,
            email: normalizeInviteEmail(user.email ?? ""),
            role: "member",
            status: "active",
            invitedAt: invite.createdAt,
            joinedAt: now,
          })
          .returning();
        memberId = created.id;
      }

      await tx
        .update(registrationInvites)
        .set({
          status: "accepted",
          acceptedByUserId: user.id,
          acceptedAt: now,
          updatedAt: now,
        })
        .where(eq(registrationInvites.id, invite.id));

      return memberId;
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REGISTRATION_GROUP_INVITE_ACCEPT",
      actorUserId: user.id,
      targetType: "registration_group_member",
      targetId: result ?? invite.id,
      metadata: { groupId: invite.groupId },
    });

    return {
      status: "joined",
      groupId: invite.groupId,
      memberId: result ?? invite.id,
    };
  });

export const declineRegistrationInvite = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(declineRegistrationInviteSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    if (!user.email) {
      const { validationError } = await import("~/lib/server/errors");
      throw validationError("A verified email is required to decline this invite.");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { registrationGroupMembers, registrationInvites } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const { notFound, validationError } = await import("~/lib/server/errors");

    const db = await getDb();
    const tokenHash = await hashRegistrationInviteToken(data.token);
    const [invite] = await db
      .select()
      .from(registrationInvites)
      .where(eq(registrationInvites.tokenHash, tokenHash))
      .limit(1);

    if (!invite || invite.status !== "pending") {
      throw notFound("Invite is invalid or expired.");
    }

    if (normalizeInviteEmail(invite.email) !== normalizeInviteEmail(user.email)) {
      throw validationError("This invite does not match your account email.");
    }

    const now = new Date();
    const [member] = await db
      .select()
      .from(registrationGroupMembers)
      .where(
        and(
          eq(registrationGroupMembers.groupId, invite.groupId),
          eq(registrationGroupMembers.email, normalizeInviteEmail(user.email)),
        ),
      )
      .limit(1);

    if (member && !canTransitionGroupMemberStatus(member.status, "declined")) {
      throw validationError("This invite cannot be declined.");
    }

    await db.transaction(async (tx) => {
      if (member) {
        await tx
          .update(registrationGroupMembers)
          .set({ status: "declined", updatedAt: now })
          .where(eq(registrationGroupMembers.id, member.id));
      }

      await tx
        .update(registrationInvites)
        .set({ status: "revoked", updatedAt: now })
        .where(eq(registrationInvites.id, invite.id));
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "REGISTRATION_GROUP_INVITE_DECLINE",
      actorUserId: user.id,
      targetType: "registration_invite",
      targetId: invite.id,
      metadata: { groupId: invite.groupId },
    });

    return {
      status: "declined",
      groupId: invite.groupId,
      memberId: member?.id ?? invite.id,
    };
  });

export const removeRegistrationGroupMember = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(removeRegistrationGroupMemberSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("events");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { events, registrationGroupMembers, registrationGroups } =
      await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { isAdmin } = await import("~/lib/auth/utils/admin-check");
    const { forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [memberRow] = await db
      .select({
        member: registrationGroupMembers,
        captainUserId: registrationGroups.captainUserId,
        organizerId: events.organizerId,
      })
      .from(registrationGroupMembers)
      .innerJoin(
        registrationGroups,
        eq(registrationGroupMembers.groupId, registrationGroups.id),
      )
      .innerJoin(events, eq(registrationGroups.eventId, events.id))
      .where(eq(registrationGroupMembers.id, data.groupMemberId))
      .limit(1);

    if (!memberRow) {
      throw notFound("Group member not found.");
    }

    const userIsAdmin = await isAdmin(user.id);
    if (
      memberRow.captainUserId !== user.id &&
      memberRow.organizerId !== user.id &&
      !userIsAdmin
    ) {
      throw forbidden("You do not have access to remove this member.");
    }

    const now = new Date();
    const [updated] = await db
      .update(registrationGroupMembers)
      .set({ status: "removed", updatedAt: now })
      .where(eq(registrationGroupMembers.id, data.groupMemberId))
      .returning();

    if (updated) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "REGISTRATION_GROUP_MEMBER_REMOVE",
        actorUserId: user.id,
        targetType: "registration_group_member",
        targetId: updated.id,
        metadata: { groupId: updated.groupId },
      });
    }

    if (!updated) {
      return updated;
    }

    return {
      ...updated,
      rosterMetadata: updated.rosterMetadata as Record<string, object> | null,
    };
  });
