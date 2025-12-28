import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  listDiscoverableOrganizationsSchema,
  listMyJoinRequestsSchema,
  listOrganizationJoinRequestsSchema,
} from "./join-requests.schemas";
import type {
  DiscoverableOrganization,
  JoinRequestSummary,
  OrganizationJoinRequestRow,
} from "./join-requests.types";

export const listDiscoverableOrganizations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(listDiscoverableOrganizationsSchema.parse)
  .handler(async ({ data, context }): Promise<DiscoverableOrganization[]> => {
    await assertFeatureEnabled("org_join_requests");
    requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { and, asc, eq, ilike } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [
      eq(organizations.isDiscoverable, true),
      eq(organizations.status, "active"),
    ];

    if (data.search) {
      conditions.push(ilike(organizations.name, `%${data.search}%`));
    }

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        type: organizations.type,
        joinRequestsEnabled: organizations.joinRequestsEnabled,
      })
      .from(organizations)
      .where(and(...conditions))
      .orderBy(asc(organizations.name))
      .limit(50);

    return rows;
  });

export const listMyJoinRequests = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(listMyJoinRequestsSchema.parse)
  .handler(async ({ data, context }): Promise<JoinRequestSummary[]> => {
    await assertFeatureEnabled("org_join_requests");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizationJoinRequests, organizations } = await import("~/db/schema");
    const { and, desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = [eq(organizationJoinRequests.userId, user.id)];
    if (data.status) {
      conditions.push(eq(organizationJoinRequests.status, data.status));
    }

    const rows = await db
      .select({
        id: organizationJoinRequests.id,
        organizationId: organizationJoinRequests.organizationId,
        organizationName: organizations.name,
        status: organizationJoinRequests.status,
        requestedRole: organizationJoinRequests.requestedRole,
        message: organizationJoinRequests.message,
        createdAt: organizationJoinRequests.createdAt,
        resolvedAt: organizationJoinRequests.resolvedAt,
        resolutionNotes: organizationJoinRequests.resolutionNotes,
      })
      .from(organizationJoinRequests)
      .innerJoin(
        organizations,
        eq(organizationJoinRequests.organizationId, organizations.id),
      )
      .where(and(...conditions))
      .orderBy(desc(organizationJoinRequests.createdAt));

    return rows;
  });

export const listOrganizationJoinRequests = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(listOrganizationJoinRequestsSchema.parse)
  .handler(async ({ data, context }): Promise<OrganizationJoinRequestRow[]> => {
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

    const { getDb } = await import("~/db/server-helpers");
    const { organizationJoinRequests, user: userTable } = await import("~/db/schema");
    const { and, desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const resolvedStatus = data.status ?? "pending";

    const rows = await db
      .select({
        id: organizationJoinRequests.id,
        organizationId: organizationJoinRequests.organizationId,
        userId: organizationJoinRequests.userId,
        userName: userTable.name,
        userEmail: userTable.email,
        status: organizationJoinRequests.status,
        requestedRole: organizationJoinRequests.requestedRole,
        message: organizationJoinRequests.message,
        createdAt: organizationJoinRequests.createdAt,
        resolvedAt: organizationJoinRequests.resolvedAt,
        resolutionNotes: organizationJoinRequests.resolutionNotes,
      })
      .from(organizationJoinRequests)
      .innerJoin(userTable, eq(organizationJoinRequests.userId, userTable.id))
      .where(
        and(
          eq(organizationJoinRequests.organizationId, data.organizationId),
          eq(organizationJoinRequests.status, resolvedStatus),
        ),
      )
      .orderBy(desc(organizationJoinRequests.createdAt));

    return rows;
  });
