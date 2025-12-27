import { and, eq, inArray } from "drizzle-orm";
import { roles, userRoles } from "~/db/schema";
import { getTenantConfig } from "~/tenant";

const GLOBAL_ADMIN_ROLE_NAMES = getTenantConfig().admin.globalRoleNames;
const ANY_ADMIN_ROLE_NAMES = [...GLOBAL_ADMIN_ROLE_NAMES, "Team Admin", "Event Admin"];

export class PermissionService {
  /**
   * Check if a user has global admin permissions
   */
  static async isGlobalAdmin(userId: string): Promise<boolean> {
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

    return !!row;
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

    return userRolesList;
  }
}

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
