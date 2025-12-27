import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  return session?.user?.id ?? null;
};

const listAccessibleOrganizationsSchema = z.void().nullish();

export const getOrganization = createServerFn({ method: "GET" })
  .inputValidator(zod$(getOrganizationSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_portal");
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
  .inputValidator(zod$(listOrganizationsSchema))
  .handler(async ({ data }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_portal");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, organizations } = await import("~/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const db = await getDb();
    const conditions = data?.includeArchived
      ? eq(organizationMembers.userId, userId)
      : and(eq(organizationMembers.userId, userId), eq(organizations.status, "active"));

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
  .inputValidator(zod$(listAccessibleOrganizationsSchema))
  .handler(async (): Promise<AccessibleOrganization[]> => {
    await assertFeatureEnabled("sin_portal");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { listAccessibleOrganizationsForUser } = await import("./organizations.access");
    return listAccessibleOrganizationsForUser(userId);
  });

export const searchOrganizations = createServerFn({ method: "GET" })
  .inputValidator(zod$(searchOrganizationsSchema))
  .handler(async ({ data }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
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

    return rows;
  });

/**
 * Admin-only query to list all organizations (not filtered by membership).
 * Requires sin_admin_orgs feature flag.
 */
export const listAllOrganizations = createServerFn({ method: "GET" })
  .inputValidator(zod$(listOrganizationsSchema))
  .handler(async ({ data }): Promise<OrganizationSummary[]> => {
    await assertFeatureEnabled("sin_admin_orgs");

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

    return rows;
  });

export const listOrganizationMembers = createServerFn({ method: "GET" })
  .inputValidator(zod$(listOrganizationMembersSchema))
  .handler(async ({ data }): Promise<OrganizationMemberRow[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { requireOrganizationMembership } = await import("~/lib/auth/guards/org-guard");
    await requireOrganizationMembership({
      userId,
      organizationId: data.organizationId,
    });

    const { getDb } = await import("~/db/server-helpers");
    const { organizationMembers, user } = await import("~/db/schema");
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
        userName: user.name,
        userEmail: user.email,
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
      .innerJoin(user, eq(organizationMembers.userId, user.id))
      .where(conditions);

    return rows;
  });

export const listDelegatedAccess = createServerFn({ method: "GET" })
  .inputValidator(zod$(listDelegatedAccessSchema))
  .handler(async ({ data }): Promise<DelegatedAccessRow[]> => {
    await assertFeatureEnabled("sin_admin_orgs");
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { requireOrganizationMembership, ORG_ADMIN_ROLES } =
      await import("~/lib/auth/guards/org-guard");
    await requireOrganizationMembership(
      { userId, organizationId: data.organizationId },
      { roles: ORG_ADMIN_ROLES },
    );

    const { getDb } = await import("~/db/server-helpers");
    const { delegatedAccess, user } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const rows = await db
      .select({
        id: delegatedAccess.id,
        organizationId: delegatedAccess.organizationId,
        delegateUserId: delegatedAccess.delegateUserId,
        delegateEmail: user.email,
        scope: delegatedAccess.scope,
        grantedBy: delegatedAccess.grantedBy,
        grantedAt: delegatedAccess.grantedAt,
        expiresAt: delegatedAccess.expiresAt,
        revokedAt: delegatedAccess.revokedAt,
        revokedBy: delegatedAccess.revokedBy,
        notes: delegatedAccess.notes,
      })
      .from(delegatedAccess)
      .innerJoin(user, eq(delegatedAccess.delegateUserId, user.id))
      .where(eq(delegatedAccess.organizationId, data.organizationId));

    return rows;
  });
