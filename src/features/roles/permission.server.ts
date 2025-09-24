import { createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, inArray } from "drizzle-orm";
import { roles, userRoles } from "~/db/schema";

/**
 * Server-side permission service
 * All methods here use database queries and should only be called on the server
 */
export class PermissionService {
  /**
   * Check if a user has global admin permissions
   */
  static isGlobalAdmin = createServerOnlyFn(async (userId: string): Promise<boolean> => {
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const [row] = await db
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          inArray(roles.name, ["Solstice Admin", "Quadball Canada Admin"]),
        ),
      )
      .limit(1);

    return !!row;
  });

  /**
   * Check if a user can manage a specific team
   */
  static canManageTeam = createServerOnlyFn(
    async (userId: string, teamId: string): Promise<boolean> => {
      // Global admins can manage any team
      if (await PermissionService.isGlobalAdmin(userId)) return true;

      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      // Check for team-specific admin role
      const [row] = await db
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
    },
  );

  /**
   * Check if a user can manage a specific event
   */
  static canManageEvent = createServerOnlyFn(
    async (userId: string, eventId: string): Promise<boolean> => {
      // Global admins can manage any event
      if (await PermissionService.isGlobalAdmin(userId)) return true;

      const { getDb } = await import("~/db/server-helpers");
      const db = await getDb();

      // Check for event-specific admin role
      const [row] = await db
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
    },
  );

  /**
   * Get all roles for a user including scope information
   */
  static getUserRoles = createServerOnlyFn(async (userId: string) => {
    const { getDb } = await import("~/db/server-helpers");
    const db = await getDb();

    const userRolesList = await db
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
  });
}
