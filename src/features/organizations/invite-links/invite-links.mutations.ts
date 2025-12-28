import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled, isFeatureEnabled } from "~/tenant/feature-gates";
import {
  createInviteLinkSchema,
  redeemInviteLinkSchema,
  revokeInviteLinkSchema,
} from "./invite-links.schemas";
import type { InviteRedemptionResult } from "./invite-links.types";

export const createInviteLink = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(createInviteLinkSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_invite_links");
    const user = requireUser(context);

    if (!data.autoApprove && !isFeatureEnabled("org_join_requests")) {
      const { badRequest } = await import("~/lib/server/errors");
      throw badRequest("Join requests must be enabled for approval-based links.");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isGlobalAdmin) {
      const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess(
        { userId: user.id, organizationId: data.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );
    }

    const { getDb } = await import("~/db/server-helpers");
    const { organizationInviteLinks } = await import("~/db/schema");
    const { randomBytes } = await import("node:crypto");

    const db = await getDb();
    const token = randomBytes(32).toString("hex");
    const [created] = await db
      .insert(organizationInviteLinks)
      .values({
        organizationId: data.organizationId,
        token,
        role: data.role ?? "member",
        autoApprove: data.autoApprove ?? false,
        maxUses: data.maxUses ?? null,
        useCount: 0,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        createdBy: user.id,
      })
      .returning();

    if (created) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_INVITE_LINK_CREATE",
        actorUserId: user.id,
        actorOrgId: created.organizationId,
        targetType: "organization_invite_link",
        targetId: created.id,
        targetOrgId: created.organizationId,
        metadata: {
          autoApprove: created.autoApprove,
          maxUses: created.maxUses,
          expiresAt: created.expiresAt ? created.expiresAt.toISOString() : null,
          role: created.role,
        },
      });
    }

    return created;
  });

export const revokeInviteLink = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(revokeInviteLinkSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_invite_links");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizationInviteLinks } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [link] = await db
      .select()
      .from(organizationInviteLinks)
      .where(eq(organizationInviteLinks.id, data.linkId))
      .limit(1);

    if (!link) {
      throw notFound("Invite link not found");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isGlobalAdmin) {
      const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess(
        { userId: user.id, organizationId: link.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );
    }

    const [updated] = await db
      .update(organizationInviteLinks)
      .set({
        revokedAt: link.revokedAt ?? new Date(),
        revokedBy: link.revokedBy ?? user.id,
      })
      .where(eq(organizationInviteLinks.id, data.linkId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_INVITE_LINK_REVOKE",
        actorUserId: user.id,
        actorOrgId: updated.organizationId,
        targetType: "organization_invite_link",
        targetId: updated.id,
        targetOrgId: updated.organizationId,
      });
    }

    return updated;
  });

export const redeemInviteLink = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(redeemInviteLinkSchema.parse)
  .handler(async ({ data, context }): Promise<InviteRedemptionResult> => {
    await assertFeatureEnabled("org_invite_links");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const {
      organizationInviteLinkUses,
      organizationInviteLinks,
      organizationJoinRequests,
      organizationMembers,
      organizations,
    } = await import("~/db/schema");
    const { and, eq, inArray, isNull } = await import("drizzle-orm");
    const { notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const now = new Date();

    const [link] = await db
      .select({
        id: organizationInviteLinks.id,
        organizationId: organizationInviteLinks.organizationId,
        token: organizationInviteLinks.token,
        role: organizationInviteLinks.role,
        autoApprove: organizationInviteLinks.autoApprove,
        maxUses: organizationInviteLinks.maxUses,
        useCount: organizationInviteLinks.useCount,
        expiresAt: organizationInviteLinks.expiresAt,
        organizationName: organizations.name,
        joinRequestsEnabled: organizations.joinRequestsEnabled,
      })
      .from(organizationInviteLinks)
      .innerJoin(
        organizations,
        eq(organizationInviteLinks.organizationId, organizations.id),
      )
      .where(
        and(
          eq(organizationInviteLinks.token, data.token),
          isNull(organizationInviteLinks.revokedAt),
        ),
      )
      .limit(1);

    if (!link) {
      throw notFound("Invite link is invalid or expired");
    }

    if (link.expiresAt && link.expiresAt <= now) {
      throw notFound("Invite link is invalid or expired");
    }

    if (link.maxUses !== null && link.useCount >= link.maxUses) {
      throw notFound("Invite link is invalid or expired");
    }

    const [membership] = await db
      .select({
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, link.organizationId),
          eq(organizationMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (membership?.status === "active") {
      return {
        status: "already_member",
        organizationId: link.organizationId,
        organizationName: link.organizationName,
      };
    }

    if (membership) {
      return {
        status: "already_requested",
        organizationId: link.organizationId,
        organizationName: link.organizationName,
      };
    }

    const [existingRequest] = await db
      .select()
      .from(organizationJoinRequests)
      .where(
        and(
          eq(organizationJoinRequests.organizationId, link.organizationId),
          eq(organizationJoinRequests.userId, user.id),
          eq(organizationJoinRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existingRequest) {
      return {
        status: "already_requested",
        organizationId: link.organizationId,
        organizationName: link.organizationName,
      };
    }

    const result = await db.transaction(async (tx) => {
      let joinRequestId: string | undefined;
      if (!link.autoApprove && !link.joinRequestsEnabled) {
        throw notFound("Invite link is invalid or expired");
      }

      if (link.autoApprove) {
        await tx
          .insert(organizationMembers)
          .values({
            organizationId: link.organizationId,
            userId: user.id,
            role: link.role,
            status: "active",
            approvedBy: user.id,
            approvedAt: now,
          })
          .onConflictDoUpdate({
            target: [organizationMembers.userId, organizationMembers.organizationId],
            set: {
              role: link.role,
              status: "active",
              approvedBy: user.id,
              approvedAt: now,
            },
          });
      } else {
        const [request] = await tx
          .insert(organizationJoinRequests)
          .values({
            organizationId: link.organizationId,
            userId: user.id,
            requestedRole: link.role,
            status: "pending",
          })
          .returning({ id: organizationJoinRequests.id });
        joinRequestId = request?.id;
      }

      await tx
        .insert(organizationInviteLinkUses)
        .values({
          linkId: link.id,
          userId: user.id,
        })
        .onConflictDoNothing();

      await tx
        .update(organizationInviteLinks)
        .set({ useCount: link.useCount + 1 })
        .where(eq(organizationInviteLinks.id, link.id));

      const baseResult = {
        status: link.autoApprove ? "joined" : "pending",
        organizationId: link.organizationId,
        organizationName: link.organizationName,
      } satisfies InviteRedemptionResult;

      return joinRequestId ? { ...baseResult, joinRequestId } : baseResult;
    });

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "ORG_INVITE_LINK_USE",
      actorUserId: user.id,
      actorOrgId: result.organizationId,
      targetType: "organization_invite_link",
      targetId: link.id,
      targetOrgId: result.organizationId,
      metadata: { status: result.status },
    });

    const joinRequestId = "joinRequestId" in result ? result.joinRequestId : undefined;

    if (result.status === "pending") {
      if (joinRequestId) {
        const { logDataChange } = await import("~/lib/audit");
        await logDataChange({
          action: "ORG_JOIN_REQUEST_CREATE",
          actorUserId: user.id,
          targetType: "organization_join_request",
          targetId: joinRequestId,
          targetOrgId: result.organizationId,
          metadata: { requestedRole: link.role, source: "invite_link" },
        });
      }

      const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");
      const adminRows = await db
        .select({
          userId: organizationMembers.userId,
        })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, link.organizationId),
            eq(organizationMembers.status, "active"),
            inArray(organizationMembers.role, ORG_ADMIN_ROLES),
          ),
        );

      if (adminRows.length > 0) {
        const { createNotificationInternal } = await import("~/lib/notifications/create");
        await Promise.all(
          adminRows.map((admin) =>
            createNotificationInternal({
              userId: admin.userId,
              organizationId: link.organizationId,
              type: "org_join_request_created",
              category: "system",
              title: "New join request",
              body: `${user.name ?? "A user"} requested access to ${link.organizationName}.`,
              link: "/dashboard/sin/organization-access",
              actorUserId: user.id,
              metadata: { inviteLinkId: link.id },
            }),
          ),
        );
      }
    }

    return result;
  });
