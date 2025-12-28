import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  getOrganizationSchema,
  listDelegatedAccessSchema,
  listOrganizationMembersSchema,
  listOrganizationsSchema,
  searchOrganizationsSchema,
} from "./organizations.schemas";
import type {
  AccessibleOrganization,
  DelegatedAccessRow,
  OrganizationMemberRow,
  OrganizationSummary,
} from "./organizations.types";

const listAccessibleOrganizationsSchema = z.void().nullish();
const validateActiveOrganizationSchema = z.object({
  organizationId: z.string().nullable().optional(),
});

export const getOrganization = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(getOrganizationSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_portal");
    const user = requireUser(context);
    const { requireOrganizationAccess } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess({
      userId: user.id,
      organizationId: data.organizationId,
    });

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, data.organizationId))
      .limit(1);

    return org ?? null;
  });

export const listOrganizations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listOrganizationsSchema))
  .handler(async ({ data, context }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_portal");
    const user = requireUser(context);

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, organizations } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = data?.includeArchived
      ? and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, "active"),
        )
      : and(
          eq(organizationMembers.userId, user.id),
          eq(organizationMembers.status, "active"),
          eq(organizations.status, "active"),
        );

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        type: organizations.type,
        status: organizations.status,
        parentOrgId: organizations.parentOrgId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(conditions);

    return rows;
  });

export const listAccessibleOrganizations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listAccessibleOrganizationsSchema))
  .handler(async ({ context }): Promise<AccessibleOrganization[]> => {
    await assertFeatureEnabled("sin_portal");
    const user = requireUser(context);

    const { listAccessibleOrganizationsForUser } = await import("./organizations.access");
    return listAccessibleOrganizationsForUser(user.id);
  });

export const validateActiveOrganization = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(validateActiveOrganizationSchema))
  .handler(
    async ({
      data,
      context,
    }): Promise<{ organizationId: string; role: OrganizationRole } | null> => {
      const user = requireUser(context);
      const organizationId = data?.organizationId ?? null;
      if (!organizationId) return null;

      const parsedOrganizationId = z.uuid().safeParse(organizationId);
      if (!parsedOrganizationId.success) return null;

      const { resolveOrganizationAccess } = await import("./organizations.access");
      const access = await resolveOrganizationAccess({
        userId: user.id,
        organizationId: parsedOrganizationId.data,
      });
      if (!access) return null;

      return {
        organizationId: access.organizationId,
        role: access.role as OrganizationRole,
      };
    },
  );

export const searchOrganizations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(searchOrganizationsSchema))
  .handler(async ({ data, context }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const user = requireUser(context);
    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(user.id);

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { ilike } = await import("drizzle-orm");

    const db = await getDb();
    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        type: organizations.type,
        status: organizations.status,
        parentOrgId: organizations.parentOrgId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(ilike(organizations.name, `%${data.query}%`))
      .limit(25);

    const { logAdminAction } = await import("~/lib/audit");
    await logAdminAction({
      action: "ORG_SEARCH",
      actorUserId: user.id,
      metadata: { query: data.query, resultCount: rows.length },
    });

    return rows;
  });

/**
 * Admin-only query to list all organizations (not filtered by membership).
 * Requires sin_admin_orgs feature flag.
 */
export const listAllOrganizations = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listOrganizationsSchema))
  .handler(async ({ data, context }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const user = requireUser(context);
    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(user.id);

    const { getDb } = await import("~/db/server-helpers");
    const { organizations } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = data?.includeArchived
      ? undefined
      : eq(organizations.status, "active");

    const rows = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        slug: organizations.slug,
        type: organizations.type,
        status: organizations.status,
        parentOrgId: organizations.parentOrgId,
        createdAt: organizations.createdAt,
        updatedAt: organizations.updatedAt,
      })
      .from(organizations)
      .where(conditions);

    const { logAdminAction } = await import("~/lib/audit");
    await logAdminAction({
      action: "ORG_LIST_ALL",
      actorUserId: user.id,
      metadata: {
        includeArchived: Boolean(data?.includeArchived),
        resultCount: rows.length,
      },
    });

    return rows;
  });

export const listOrganizationMembers = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listOrganizationMembersSchema))
  .handler(async ({ data, context }): Promise<OrganizationMemberRow[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const user = requireUser(context);

    const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess(
      { userId: user.id, organizationId: data.organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, user: userTable } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = data.includeInactive
      ? eq(organizationMembers.organizationId, data.organizationId)
      : and(
          eq(organizationMembers.organizationId, data.organizationId),
          eq(organizationMembers.status, "active"),
        );

    const rows = await db
      .select({
        id: organizationMembers.id,
        organizationId: organizationMembers.organizationId,
        userId: organizationMembers.userId,
        userName: userTable.name,
        userEmail: userTable.email,
        role: organizationMembers.role,
        status: organizationMembers.status,
        invitedBy: organizationMembers.invitedBy,
        invitedAt: organizationMembers.invitedAt,
        approvedBy: organizationMembers.approvedBy,
        approvedAt: organizationMembers.approvedAt,
        createdAt: organizationMembers.createdAt,
        updatedAt: organizationMembers.updatedAt,
      })
      .from(organizationMembers)
      .innerJoin(userTable, eq(organizationMembers.userId, userTable.id))
      .where(conditions);

    return rows;
  });

export const listDelegatedAccess = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listDelegatedAccessSchema))
  .handler(async ({ data, context }): Promise<DelegatedAccessRow[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const user = requireUser(context);

    const { requireOrganizationAccess, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationAccess(
      { userId: user.id, organizationId: data.organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    const { getDb } = await import("~/db/server-helpers");
    const { delegatedAccess, user: userTable } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const rows = await db
      .select({
        id: delegatedAccess.id,
        organizationId: delegatedAccess.organizationId,
        delegateUserId: delegatedAccess.delegateUserId,
        delegateEmail: userTable.email,
        scope: delegatedAccess.scope,
        grantedBy: delegatedAccess.grantedBy,
        grantedAt: delegatedAccess.grantedAt,
        expiresAt: delegatedAccess.expiresAt,
        revokedAt: delegatedAccess.revokedAt,
        revokedBy: delegatedAccess.revokedBy,
        notes: delegatedAccess.notes,
      })
      .from(delegatedAccess)
      .innerJoin(userTable, eq(delegatedAccess.delegateUserId, userTable.id))
      .where(eq(delegatedAccess.organizationId, data.organizationId));

    return rows;
  });
