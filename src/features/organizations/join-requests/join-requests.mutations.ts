import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  cancelJoinRequestSchema,
  createJoinRequestSchema,
  resolveJoinRequestSchema,
  updateOrganizationAccessSchema,
} from "./join-requests.schemas";

export const createJoinRequest = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(createJoinRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_join_requests");
    const user = requireUser(context);
    const { enforceRateLimit } = await import("~/lib/security/rate-limiter");
    await enforceRateLimit({
      bucket: "join_request",
      route: "org-join-request:create",
      userId: user.id,
    });

    const { getDb } = await import("~/db/server-helpers");
    const { organizationJoinRequests, organizationMembers, organizations } =
      await import("~/db/schema");
    const { and, eq, inArray } = await import("drizzle-orm");
    const { badRequest, forbidden, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [org] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        status: organizations.status,
        joinRequestsEnabled: organizations.joinRequestsEnabled,
      })
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1);

    if (!org) {
      throw notFound("Organization not found");
    }

    if (org.status !== "active") {
      throw forbidden("Organization is not accepting join requests");
    }

    if (!org.joinRequestsEnabled) {
      throw forbidden("Join requests are not enabled for this organization");
    }

    const [membership] = await db
      .select({
        id: organizationMembers.id,
        status: organizationMembers.status,
      })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, data.organizationId),
          eq(organizationMembers.userId, user.id),
        ),
      )
      .limit(1);

    if (membership?.status === "active") {
      throw badRequest("You already belong to this organization.");
    }

    if (membership) {
      throw badRequest("You already have access pending for this organization.");
    }

    const [existingRequest] = await db
      .select()
      .from(organizationJoinRequests)
      .where(
        and(
          eq(organizationJoinRequests.organizationId, data.organizationId),
          eq(organizationJoinRequests.userId, user.id),
          eq(organizationJoinRequests.status, "pending"),
        ),
      )
      .limit(1);

    if (existingRequest) {
      return existingRequest;
    }

    const [created] = await db
      .insert(organizationJoinRequests)
      .values({
        organizationId: data.organizationId,
        userId: user.id,
        message: data.message ?? null,
        requestedRole: data.requestedRole ?? "member",
        status: "pending",
      })
      .returning();

    if (created) {
      const { logDataChange } = await import("~/lib/audit");
      await logDataChange({
        action: "ORG_JOIN_REQUEST_CREATE",
        actorUserId: user.id,
        targetType: "organization_join_request",
        targetId: created.id,
        targetOrgId: data.organizationId,
        metadata: { requestedRole: created.requestedRole },
      });

      const { ORG_ADMIN_ROLES } = await import("~/lib/auth/guards/org-guard");
      const adminRows = await db
        .select({
          userId: organizationMembers.userId,
        })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, data.organizationId),
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
              organizationId: data.organizationId,
              type: "org_join_request_created",
              category: "system",
              title: "New join request",
              body: `${user.name ?? "A user"} requested access to ${org.name}.`,
              link: "/dashboard/sin/organization-access",
              actorUserId: user.id,
              metadata: { requestId: created.id },
            }),
          ),
        );
      }
    }

    return created;
  });

export const resolveJoinRequest = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(resolveJoinRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_join_requests");
    const user = requireUser(context);
    const { enforceRateLimit } = await import("~/lib/security/rate-limiter");
    await enforceRateLimit({
      bucket: "admin",
      route: "org-join-request:resolve",
      userId: user.id,
    });

    const { getDb } = await import("~/db/server-helpers");
    const { organizationJoinRequests, organizationMembers, organizations } =
      await import("~/db/schema");
    const { eq } = await import("drizzle-orm");
    const { badRequest, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [request] = await db
      .select({
        id: organizationJoinRequests.id,
        organizationId: organizationJoinRequests.organizationId,
        userId: organizationJoinRequests.userId,
        status: organizationJoinRequests.status,
        requestedRole: organizationJoinRequests.requestedRole,
        organizationName: organizations.name,
      })
      .from(organizationJoinRequests)
      .innerJoin(
        organizations,
        eq(organizationJoinRequests.organizationId, organizations.id),
      )
      .where(eq(organizationJoinRequests.id, data.requestId))
      .limit(1);

    if (!request) {
      throw notFound("Join request not found");
    }

    if (request.status !== "pending") {
      throw badRequest("Join request is already resolved");
    }

    const { PermissionService } = await import("~/features/roles/permission.service");
    const isGlobalAdmin = await PermissionService.isGlobalAdmin(user.id);
    if (!isGlobalAdmin) {
      const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
        await import("~/lib/auth/guards/org-guard");
      await requireOrganizationAccess(
        { userId: user.id, organizationId: request.organizationId },
        { roles: ORG_ADMIN_ROLES },
      );
    }

    const now = new Date();
    const [updated] = await db.transaction(async (tx) => {
      if (data.status === "approved") {
        await tx
          .insert(organizationMembers)
          .values({
            organizationId: request.organizationId,
            userId: request.userId,
            role: request.requestedRole,
            status: "active",
            approvedBy: user.id,
            approvedAt: now,
          })
          .onConflictDoUpdate({
            target: [organizationMembers.userId, organizationMembers.organizationId],
            set: {
              role: request.requestedRole,
              status: "active",
              approvedBy: user.id,
              approvedAt: now,
            },
          });
      }

      const [resolved] = await tx
        .update(organizationJoinRequests)
        .set({
          status: data.status,
          resolvedBy: user.id,
          resolvedAt: now,
          resolutionNotes: data.resolutionNotes ?? null,
        })
        .where(eq(organizationJoinRequests.id, data.requestId))
        .returning();

      return [resolved];
    });

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_JOIN_REQUEST_RESOLVE",
        actorUserId: user.id,
        actorOrgId: request.organizationId,
        targetType: "organization_join_request",
        targetId: updated.id,
        targetOrgId: request.organizationId,
        metadata: {
          status: data.status,
          requestedRole: request.requestedRole,
        },
      });

      const { createNotificationInternal } = await import("~/lib/notifications/create");
      const statusLabel = data.status === "approved" ? "approved" : "denied";
      const resolutionNote = data.resolutionNotes ? ` Note: ${data.resolutionNotes}` : "";
      const message =
        `Your request to join ${request.organizationName} was ` +
        `${statusLabel}.${resolutionNote}`;
      await createNotificationInternal({
        userId: request.userId,
        organizationId: request.organizationId,
        type: "org_join_request_resolved",
        category: "system",
        title: `Join request ${statusLabel}`,
        body: message,
        link: "/dashboard/select-org",
        actorUserId: user.id,
        metadata: { requestId: request.id, status: data.status },
      });

      const { invalidateOrganizationAccessCache } =
        await import("../organizations.access");
      await invalidateOrganizationAccessCache({
        userId: request.userId,
        organizationId: request.organizationId,
      });
    }

    return updated;
  });

export const cancelJoinRequest = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(cancelJoinRequestSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_join_requests");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizationJoinRequests } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const { badRequest, notFound } = await import("~/lib/server/errors");

    const db = await getDb();
    const [request] = await db
      .select({
        id: organizationJoinRequests.id,
        status: organizationJoinRequests.status,
        organizationId: organizationJoinRequests.organizationId,
      })
      .from(organizationJoinRequests)
      .where(
        and(
          eq(organizationJoinRequests.id, data.requestId),
          eq(organizationJoinRequests.userId, user.id),
        ),
      )
      .limit(1);

    if (!request) {
      throw notFound("Join request not found");
    }

    if (request.status !== "pending") {
      throw badRequest("Only pending requests can be cancelled");
    }

    const [updated] = await db
      .update(organizationJoinRequests)
      .set({
        status: "cancelled",
        resolvedBy: user.id,
        resolvedAt: new Date(),
      })
      .where(eq(organizationJoinRequests.id, data.requestId))
      .returning();

    const { logDataChange } = await import("~/lib/audit");
    await logDataChange({
      action: "ORG_JOIN_REQUEST_CANCEL",
      actorUserId: user.id,
      targetType: "organization_join_request",
      targetId: updated.id,
      targetOrgId: request.organizationId,
    });

    return updated;
  });

export const updateOrganizationAccessSettings = createServerFn({ method: "POST" })
  .middleware(getAuthMiddleware())
  .inputValidator(updateOrganizationAccessSchema.parse)
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("org_join_requests");
    const user = requireUser(context);

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

    if (data.isDiscoverable === undefined && data.joinRequestsEnabled === undefined) {
      const { badRequest } = await import("~/lib/server/errors");
      throw badRequest("No access settings provided");
    }

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const updateValues = {
      ...(data.isDiscoverable === undefined
        ? {}
        : { isDiscoverable: data.isDiscoverable }),
      ...(data.joinRequestsEnabled === undefined
        ? {}
        : { joinRequestsEnabled: data.joinRequestsEnabled }),
    };

    const [updated] = await db
      .update(organizations)
      .set(updateValues)
      .where(eq(organizations.id, data.organizationId))
      .returning();

    if (updated) {
      const { logAdminAction } = await import("~/lib/audit");
      await logAdminAction({
        action: "ORG_ACCESS_SETTINGS_UPDATE",
        actorUserId: user.id,
        actorOrgId: data.organizationId,
        targetType: "organization",
        targetId: data.organizationId,
        targetOrgId: data.organizationId,
        metadata: updateValues,
      });
    }

    return updated ?? null;
  });
