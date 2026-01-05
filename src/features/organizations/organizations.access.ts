import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { delegatedAccess, organizationMembers, organizations } from "~/db/schema";
import { getDb } from "~/db/server-helpers";
import { REDIS_TTLS, buildRedisKey } from "~/lib/redis/keys";
import type { OrganizationRole } from "~/lib/auth/guards/org-guard";
import type { AccessibleOrganization } from "./organizations.types";

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

const buildOrgListKey = (userId: string) => `org-access:list:${userId}`;
const buildOrgAccessKey = (userId: string, organizationId: string) =>
  `org-access:resolve:${userId}:${organizationId}`;

const getCachedJson = async <T>(key: string): Promise<T | null> => {
  const redis = await getRedisClient();
  if (!redis) return null;
  const redisKey = await buildRedisKey(key);
  const cached = await redis.get(redisKey);
  if (!cached) return null;
  return JSON.parse(cached) as T;
};

const setCachedJson = async (key: string, value: unknown, ttlSeconds: number) => {
  const redis = await getRedisClient();
  if (!redis) return;
  const redisKey = await buildRedisKey(key);
  await redis.set(redisKey, JSON.stringify(value), { EX: ttlSeconds });
};

const deleteCachedKeys = async (keys: string[]) => {
  const redis = await getRedisClient();
  if (!redis) return;
  const redisKeys = await Promise.all(keys.map((key) => buildRedisKey(key)));
  await redis.del(redisKeys);
};

export const rolePriority: Record<OrganizationRole, number> = {
  owner: 5,
  admin: 4,
  reporter: 3,
  viewer: 2,
  member: 1,
};

export const pickHighestRole = (roles: Array<OrganizationRole | null | undefined>) => {
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

export const deriveRoleFromScopes = (scopes: string[]): OrganizationRole | null => {
  if (scopes.includes("admin")) return "admin";
  if (scopes.includes("reporting")) return "reporter";
  if (scopes.includes("analytics")) return "viewer";
  return null;
};

export const buildOrgMaps = (orgs: Array<{ id: string; parentOrgId: string | null }>) => {
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

export const collectDescendants = (
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

export const resolveOrganizationRole = (params: {
  organizationId: string;
  parentById: Map<string, string | null>;
  membershipByOrg: Map<string, OrganizationRole>;
  delegatedScopesByOrg: Map<string, string[]>;
}) => {
  const { organizationId, parentById, membershipByOrg, delegatedScopesByOrg } = params;
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

  return pickHighestRole(roles);
};

export const listAccessibleOrganizationsForUser = async (
  userId: string,
): Promise<AccessibleOrganization[]> => {
  const cacheKey = buildOrgListKey(userId);
  const cached = await getCachedJson<AccessibleOrganization[]>(cacheKey);
  if (cached) return cached;

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
    const result: AccessibleOrganization[] = orgRows.map((org) => ({
      ...org,
      role: "admin" as const,
    }));
    await setCachedJson(cacheKey, result, REDIS_TTLS.orgListSeconds);
    return result;
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

  const resolveRole = (orgId: string) =>
    resolveOrganizationRole({
      organizationId: orgId,
      parentById,
      membershipByOrg,
      delegatedScopesByOrg,
    });

  const result = orgRows
    .filter((org) => accessibleIds.has(org.id))
    .map(
      (org): AccessibleOrganization => ({
        ...org,
        role: resolveRole(org.id),
        delegatedScopes: delegatedScopesByOrg.get(org.id) ?? [],
      }),
    );

  await setCachedJson(cacheKey, result, REDIS_TTLS.orgListSeconds);
  return result;
};

export const resolveOrganizationAccess = async (params: {
  userId: string;
  organizationId: string;
}) => {
  const { userId, organizationId } = params;
  const cacheKey = buildOrgAccessKey(userId, organizationId);
  const cached = await getCachedJson<{
    value: { organizationId: string; role: string } | null;
  }>(cacheKey);
  if (cached) return cached.value;

  const { PermissionService } = await import("~/features/roles/permission.service");
  const isAdmin = await PermissionService.isGlobalAdmin(userId);
  if (isAdmin) {
    const result = { organizationId, role: "admin" };
    await setCachedJson(cacheKey, { value: result }, REDIS_TTLS.orgAccessSeconds);
    return result;
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

  const role = resolveOrganizationRole({
    organizationId,
    parentById,
    membershipByOrg,
    delegatedScopesByOrg,
  });
  if (!role) {
    await setCachedJson(cacheKey, { value: null }, REDIS_TTLS.orgAccessSeconds);
    return null;
  }

  const result = { organizationId, role };
  await setCachedJson(cacheKey, { value: result }, REDIS_TTLS.orgAccessSeconds);
  return result;
};

export const invalidateOrganizationAccessCache = async (params: {
  userId: string;
  organizationId?: string | null;
}) => {
  const keys = [buildOrgListKey(params.userId)];
  if (params.organizationId) {
    keys.push(buildOrgAccessKey(params.userId, params.organizationId));
  }
  await deleteCachedKeys(keys);
};
