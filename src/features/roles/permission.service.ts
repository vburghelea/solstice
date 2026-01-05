import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { roles, userRoles } from "~/db/schema";
import { REDIS_TTLS, buildRedisKey } from "~/lib/redis/keys";
import { getTenantConfig } from "~/tenant";

const GLOBAL_ADMIN_ROLE_NAMES = getTenantConfig().admin.globalRoleNames;
const ANY_ADMIN_ROLE_NAMES = [...GLOBAL_ADMIN_ROLE_NAMES, "Team Admin", "Event Admin"];

const getRedisClient = createServerOnlyFn(async () => {
  const { getRedis } = await import("~/lib/redis/client");
  return getRedis({ required: false });
});

const buildGlobalAdminKey = (userId: string) => `permissions:global-admin:${userId}`;
const buildUserRolesKey = (userId: string) => `permissions:user-roles:${userId}`;

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

export class PermissionService {
  /**
   * Check if a user has global admin permissions
   */
  static async isGlobalAdmin(userId: string): Promise<boolean> {
    const cacheKey = buildGlobalAdminKey(userId);
    const cached = await getCachedJson<{ value: boolean }>(cacheKey);
    if (cached) return cached.value;

    const { db } = await import("~/db");
    const database = await db();
    const [row] = await database
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(eq(userRoles.userId, userId), inArray(roles.name, GLOBAL_ADMIN_ROLE_NAMES)),
      )
      .limit(1);

    const value = !!row;
    await setCachedJson(cacheKey, { value }, REDIS_TTLS.permissionSeconds);
    return value;
  }

  static async getGlobalAdminUserIds(): Promise<string[]> {
    const { db } = await import("~/db");
    const database = await db();
    const rows = await database
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, GLOBAL_ADMIN_ROLE_NAMES));

    return Array.from(new Set(rows.map((row) => row.userId)));
  }

  /**
   * Check if a user can manage a specific team
   */
  static async canManageTeam(userId: string, teamId: string): Promise<boolean> {
    // Global admins can manage any team
    if (await this.isGlobalAdmin(userId)) return true;

    // Check for team-specific admin role
    const { db } = await import("~/db");
    const database = await db();
    const [row] = await database
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, "Team Admin"),
          eq(userRoles.teamId, teamId),
        ),
      )
      .limit(1);

    return !!row;
  }

  /**
   * Check if a user can manage a specific event
   */
  static async canManageEvent(userId: string, eventId: string): Promise<boolean> {
    // Global admins can manage any event
    if (await this.isGlobalAdmin(userId)) return true;

    // Check for event-specific admin role
    const { db } = await import("~/db");
    const database = await db();
    const [row] = await database
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(roles.name, "Event Admin"),
          eq(userRoles.eventId, eventId),
        ),
      )
      .limit(1);

    return !!row;
  }

  /**
   * Get all roles for a user including scope information
   */
  static async getUserRoles(userId: string) {
    const cacheKey = buildUserRolesKey(userId);
    const cached = await getCachedJson<UserRoleAssignment[]>(cacheKey);
    if (cached) return cached;

    const { db } = await import("~/db");
    const database = await db();
    const userRolesList = await database
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        teamId: userRoles.teamId,
        eventId: userRoles.eventId,
        assignedBy: userRoles.assignedBy,
        assignedAt: userRoles.assignedAt,
        expiresAt: userRoles.expiresAt,
        notes: userRoles.notes,
        role: {
          id: roles.id,
          name: roles.name,
          description: roles.description,
          permissions: roles.permissions,
        },
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    await setCachedJson(cacheKey, userRolesList, REDIS_TTLS.permissionSeconds);
    return userRolesList;
  }

  static async invalidateUserCache(userId: string) {
    await deleteCachedKeys([buildGlobalAdminKey(userId), buildUserRolesKey(userId)]);
  }
}

export type UserRoleAssignment = {
  id: string;
  userId: string;
  roleId: string;
  teamId: string | null;
  eventId: string | null;
  assignedBy: string | null;
  assignedAt: string | Date | null;
  expiresAt: string | Date | null;
  notes: string | null;
  role: {
    id: string;
    name: string;
    description: string | null;
    permissions: Record<string, boolean>;
  };
};

/**
 * Client-side helper to check if a user has a specific role
 * This is for UI display purposes only - actual authorization happens server-side
 */
export function userHasRole(
  user: {
    roles?: Array<{
      role: { name: string };
      teamId?: string | null;
      eventId?: string | null;
    }>;
  },
  roleName: string,
  options?: { teamId?: string; eventId?: string },
): boolean {
  if (!user.roles) return false;

  return user.roles.some((userRole) => {
    if (userRole.role.name !== roleName) return false;

    // For global roles
    if (!options?.teamId && !options?.eventId) {
      return !userRole.teamId && !userRole.eventId;
    }

    // For team-specific roles
    if (options.teamId) {
      return userRole.teamId === options.teamId;
    }

    // For event-specific roles
    if (options.eventId) {
      return userRole.eventId === options.eventId;
    }

    return false;
  });
}

/**
 * Client-side helper to check if user is any kind of admin
 */
export function isAnyAdmin(user: { roles?: Array<{ role: { name: string } }> }): boolean {
  if (!user.roles) return false;

  return user.roles.some((userRole) => ANY_ADMIN_ROLE_NAMES.includes(userRole.role.name));
}
