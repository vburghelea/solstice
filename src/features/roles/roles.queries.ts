import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import type {
  RoleManagementData,
  RoleOperationResult,
  RoleUserSearchResult,
} from "./roles.types";

function escapeLike(term: string) {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const searchUsersSchema = z.object({
  query: z.string().min(2, "Enter at least 2 characters"),
  limit: z.int().positive().max(25).optional().prefault(10),
});

export const getRoleManagementData = createServerFn({ method: "GET" }).handler(
  async (): Promise<RoleOperationResult<RoleManagementData>> => {
    try {
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getRequest } = await import("@tanstack/react-start/server");
      const { headers } = getRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            },
          ],
        };
      }

      const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
      await requireAdmin(session.user.id);

      const db = await getDb();
      const { roles, userRoles, user } = await import("~/db/schema");
      const { asc, desc, sql, eq } = await import("drizzle-orm");
      const { alias } = await import("drizzle-orm/pg-core");

      const roleSummaries = await db
        .select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          permissions: roles.permissions,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
          assignmentCount: sql<number>`count(${userRoles.id})`,
        })
        .from(roles)
        .leftJoin(userRoles, eq(userRoles.roleId, roles.id))
        .groupBy(
          roles.id,
          roles.name,
          roles.description,
          roles.permissions,
          roles.createdAt,
          roles.updatedAt,
        )
        .orderBy(asc(roles.name));

      const assignerUser = alias(user, "assigner_user");

      const assignments = await db
        .select({
          id: userRoles.id,
          roleId: userRoles.roleId,
          roleName: roles.name,
          roleDescription: roles.description,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          teamId: userRoles.teamId,
          eventId: userRoles.eventId,
          assignedBy: userRoles.assignedBy,
          assignedByName: assignerUser.name,
          assignedByEmail: assignerUser.email,
          assignedAt: userRoles.assignedAt,
          expiresAt: userRoles.expiresAt,
          notes: userRoles.notes,
        })
        .from(userRoles)
        .innerJoin(user, eq(userRoles.userId, user.id))
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .leftJoin(assignerUser, eq(assignerUser.id, userRoles.assignedBy))
        .orderBy(desc(userRoles.assignedAt));

      return {
        success: true,
        data: {
          roles: roleSummaries,
          assignments,
        },
      };
    } catch (error) {
      console.error("Error loading role management data:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to load role management data",
          },
        ],
      };
    }
  },
);

export const searchRoleEligibleUsers = createServerFn({ method: "POST" })
  .inputValidator(zod$(searchUsersSchema))
  .handler(async ({ data }): Promise<RoleOperationResult<RoleUserSearchResult[]>> => {
    try {
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getRequest } = await import("@tanstack/react-start/server");
      const { headers } = getRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            },
          ],
        };
      }

      const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
      await requireAdmin(session.user.id);

      const db = await getDb();
      const { user, userRoles, roles } = await import("~/db/schema");
      const { asc, ilike, or, sql, eq } = await import("drizzle-orm");

      const searchTerm = `%${escapeLike(data.query.trim())}%`;

      const matches = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          roleNames: sql<string[]>`array_remove(array_agg(${roles.name}), NULL)`,
        })
        .from(user)
        .leftJoin(userRoles, eq(userRoles.userId, user.id))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(or(ilike(user.email, searchTerm), ilike(user.name, searchTerm)))
        .groupBy(user.id)
        .orderBy(asc(user.name))
        .limit(data.limit);

      const results: RoleUserSearchResult[] = matches.map((match) => ({
        id: match.id,
        name: match.name,
        email: match.email,
        roleNames: Array.isArray(match.roleNames) ? match.roleNames : [],
      }));

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error("Error searching users for roles:", error);
      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to search users",
          },
        ],
      };
    }
  });
