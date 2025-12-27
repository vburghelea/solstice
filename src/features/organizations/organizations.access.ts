import { and, eq, gt, isNull, or } from "drizzle-orm";
import { delegatedAccess, organizationMembers, organizations } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { AccessibleOrganization } from "./organizations.types";

const rolePriority: Record<OrganizationRole, number> = {
  owner: 5,
  admin: 4,
  reporter: 3,
  viewer: 2,
  member: 1,
};

const pickHighestRole = (roles: Array<OrganizationRole | null | undefined>) => {
  let highest: OrganizationRole | null = null;
  let max = 0;
  for (const role of roles) {
    if (!role) continue;
    const rank = rolePriority[role] ?? 0;
    if (rank > max) {
      max = rank;
      highest = role;
    }
  }
  return highest;
};

const deriveRoleFromScopes = (scopes: string[]): OrganizationRole | null => {
  if (scopes.includes("admin")) return "admin";
  if (scopes.includes("reporting")) return "reporter";
  if (scopes.includes("analytics")) return "viewer";
  return null;
};

const buildOrgMaps = (orgs: Array<{ id: string; parentOrgId: string | null }>) => {
  const parentById = new Map<string, string | null>();
  const childrenByParent = new Map<string | null, string[]>();

  orgs.forEach((org) => {
    parentById.set(org.id, org.parentOrgId ?? null);
    const parentKey = org.parentOrgId ?? null;
    const children = childrenByParent.get(parentKey) ?? [];
    children.push(org.id);
    childrenByParent.set(parentKey, children);
  });

  return { parentById, childrenByParent };
};

const collectDescendants = (
  childrenByParent: Map<string | null, string[]>,
  rootIds: Iterable<string>,
) => {
  const queue = [...rootIds];
  const result = new Set(queue);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    const children = childrenByParent.get(current) ?? [];
    for (const child of children) {
      if (result.has(child)) continue;
      result.add(child);
      queue.push(child);
    }
  }

  return result;
};

export const listAccessibleOrganizationsForUser = async (
  userId: string,
): Promise<AccessibleOrganization[]> => {
  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(userId);

  const db = await getDb();
  const orgRows = await db
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
    .from(organizations);

  if (isAdmin) {
    return orgRows.map((org) => ({
      ...org,
      role: "admin",
    }));
  }

  const memberships = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, "active"),
      ),
    );

  const now = new Date();
  const delegated = await db
    .select({
      organizationId: delegatedAccess.organizationId,
      scope: delegatedAccess.scope,
    })
    .from(delegatedAccess)
    .where(
      and(
        eq(delegatedAccess.delegateUserId, userId),
        isNull(delegatedAccess.revokedAt),
        or(isNull(delegatedAccess.expiresAt), gt(delegatedAccess.expiresAt, now)),
      ),
    );

  const membershipByOrg = new Map<string, OrganizationRole>(
    memberships.map((membership) => [
      membership.organizationId,
      membership.role as OrganizationRole,
    ]),
  );

  const delegatedScopesByOrg = new Map<string, string[]>();
  delegated.forEach((entry) => {
    const scopes = delegatedScopesByOrg.get(entry.organizationId) ?? [];
    scopes.push(entry.scope);
    delegatedScopesByOrg.set(entry.organizationId, scopes);
  });

  const baseOrgIds = new Set<string>([
    ...membershipByOrg.keys(),
    ...delegatedScopesByOrg.keys(),
  ]);

  if (baseOrgIds.size === 0) {
    return [];
  }

  const { parentById, childrenByParent } = buildOrgMaps(orgRows);
  const accessibleIds = collectDescendants(childrenByParent, baseOrgIds);

  const resolveRole = (orgId: string) => {
    const roles: OrganizationRole[] = [];
    let currentId: string | null | undefined = orgId;
    while (currentId) {
      const membershipRole = membershipByOrg.get(currentId);
      if (membershipRole) roles.push(membershipRole);
      const scopes = delegatedScopesByOrg.get(currentId);
      if (scopes && scopes.length > 0) {
        const delegatedRole = deriveRoleFromScopes(scopes);
        if (delegatedRole) roles.push(delegatedRole);
      }
      currentId = parentById.get(currentId) ?? null;
    }

    return pickHighestRole(roles);
  };

  return orgRows
    .filter((org) => accessibleIds.has(org.id))
    .map(
      (org): AccessibleOrganization => ({
        ...org,
        role: resolveRole(org.id),
        delegatedScopes: delegatedScopesByOrg.get(org.id) ?? [],
      }),
    );
};

export const resolveOrganizationAccess = async (params: {
  userId: string;
  organizationId: string;
}) => {
  const { userId, organizationId } = params;
  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(userId);
  if (isAdmin) {
    return { organizationId, role: "admin" };
  }

  const db = await getDb();
  const orgRows = await db
    .select({
      id: organizations.id,
      parentOrgId: organizations.parentOrgId,
    })
    .from(organizations);

  const { parentById } = buildOrgMaps(orgRows);
  const membershipRows = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.status, "active"),
      ),
    );

  const now = new Date();
  const delegatedRows = await db
    .select({
      organizationId: delegatedAccess.organizationId,
      scope: delegatedAccess.scope,
    })
    .from(delegatedAccess)
    .where(
      and(
        eq(delegatedAccess.delegateUserId, userId),
        isNull(delegatedAccess.revokedAt),
        or(isNull(delegatedAccess.expiresAt), gt(delegatedAccess.expiresAt, now)),
      ),
    );

  const membershipByOrg = new Map<string, OrganizationRole>(
    membershipRows.map((membership) => [
      membership.organizationId,
      membership.role as OrganizationRole,
    ]),
  );

  const delegatedScopesByOrg = new Map<string, string[]>();
  delegatedRows.forEach((entry) => {
    const scopes = delegatedScopesByOrg.get(entry.organizationId) ?? [];
    scopes.push(entry.scope);
    delegatedScopesByOrg.set(entry.organizationId, scopes);
  });

  const roles: OrganizationRole[] = [];
  let currentId: string | null | undefined = organizationId;
  while (currentId) {
    const membershipRole = membershipByOrg.get(currentId);
    if (membershipRole) roles.push(membershipRole);
    const scopes = delegatedScopesByOrg.get(currentId);
    if (scopes && scopes.length > 0) {
      const delegatedRole = deriveRoleFromScopes(scopes);
      if (delegatedRole) roles.push(delegatedRole);
    }
    currentId = parentById.get(currentId) ?? null;
  }

  const role = pickHighestRole(roles);
  if (!role) {
    return null;
  }

  return { organizationId, role };
};
