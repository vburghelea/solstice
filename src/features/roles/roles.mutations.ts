import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RoleAssignmentRow, RoleOperationResult } from "./roles.types";

const assignRoleSchema = z
  .object({
    userId: z.string().min(1, "User is required"),
    roleId: z.string().min(1, "Role is required"),
    teamId: z.string().min(1).optional().nullable(),
    eventId: z.string().min(1).optional().nullable(),
    notes: z.string().trim().max(500, "Notes must be 500 characters or fewer").optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.teamId && data.eventId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Choose either a team scope or an event scope—not both.",
        path: ["teamId"],
      });
    }
  });

const removeRoleSchema = z.object({
  assignmentId: z.string().min(1, "Assignment id is required"),
});

function normalizeNotes(notes?: string) {
  if (!notes) return null;
  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const assignRoleToUser = createServerFn({ method: "POST" })
  .validator(assignRoleSchema.parse)
  .handler(async ({ data }): Promise<RoleOperationResult<RoleAssignmentRow>> => {
    try {
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
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

      const { requireAdmin, GLOBAL_ADMIN_ROLE_NAMES } = await import(
        "~/lib/auth/utils/admin-check"
      );
      await requireAdmin(session.user.id);

      const db = await getDb();
      const { roles, user, userRoles } = await import("~/db/schema");
      const { alias } = await import("drizzle-orm/pg-core");
      const { and, eq, isNull } = await import("drizzle-orm");

      const assignerUser = alias(user, "assigner_user");

      const [targetUser] = await db
        .select({ id: user.id, email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, data.userId))
        .limit(1);

      if (!targetUser) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "User not found",
            },
          ],
        };
      }

      const [roleRecord] = await db
        .select({ id: roles.id, name: roles.name })
        .from(roles)
        .where(eq(roles.id, data.roleId))
        .limit(1);

      if (!roleRecord) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Role not found",
            },
          ],
        };
      }

      let teamId: string | null = data.teamId ?? null;
      let eventId: string | null = data.eventId ?? null;

      if (GLOBAL_ADMIN_ROLE_NAMES.includes(roleRecord.name)) {
        teamId = null;
        eventId = null;
      } else if (roleRecord.name === "Team Admin") {
        if (!teamId) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Team Admin roles must be scoped to a specific team.",
              },
            ],
          };
        }
        eventId = null;
      } else if (roleRecord.name === "Event Admin") {
        if (!eventId) {
          return {
            success: false,
            errors: [
              {
                code: "VALIDATION_ERROR",
                message: "Event Admin roles must be scoped to a specific event.",
              },
            ],
          };
        }
        teamId = null;
      } else {
        teamId = teamId ?? null;
        eventId = eventId ?? null;
      }

      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
      if (expiresAt && Number.isNaN(expiresAt.getTime())) {
        return {
          success: false,
          errors: [
            {
              code: "VALIDATION_ERROR",
              message: "Invalid expiration date provided.",
            },
          ],
        };
      }

      const scopeConditions = [
        eq(userRoles.userId, targetUser.id),
        eq(userRoles.roleId, roleRecord.id),
        teamId ? eq(userRoles.teamId, teamId) : isNull(userRoles.teamId),
        eventId ? eq(userRoles.eventId, eventId) : isNull(userRoles.eventId),
      ];

      const [existingAssignment] = await db
        .select({ id: userRoles.id })
        .from(userRoles)
        .where(and(...scopeConditions))
        .limit(1);

      const fetchAssignment = async (assignmentId: string) => {
        const [assignment] = await db
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
          .where(eq(userRoles.id, assignmentId))
          .limit(1);

        return assignment ?? null;
      };

      if (existingAssignment) {
        const existing = await fetchAssignment(existingAssignment.id);
        if (!existing) {
          return {
            success: false,
            errors: [
              {
                code: "DATABASE_ERROR",
                message: "Existing role assignment could not be loaded.",
              },
            ],
          };
        }

        return {
          success: true,
          data: existing,
        };
      }

      const [inserted] = await db
        .insert(userRoles)
        .values({
          userId: targetUser.id,
          roleId: roleRecord.id,
          teamId,
          eventId,
          assignedBy: session.user.id,
          notes: normalizeNotes(data.notes),
          expiresAt,
        })
        .returning();

      const created = await fetchAssignment(inserted.id);
      if (!created) {
        return {
          success: false,
          errors: [
            {
              code: "DATABASE_ERROR",
              message: "Role assignment was created but could not be loaded.",
            },
          ],
        };
      }

      return {
        success: true,
        data: created,
      };
    } catch (error) {
      console.error("Error assigning role:", error);

      if (error instanceof Error && error.message.includes("Admin access required")) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "Admin access required",
            },
          ],
        };
      }

      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to assign role",
          },
        ],
      };
    }
  });

export const removeRoleAssignment = createServerFn({ method: "POST" })
  .validator(removeRoleSchema.parse)
  .handler(async ({ data }): Promise<RoleOperationResult<RoleAssignmentRow>> => {
    try {
      const [{ getDb }, { getAuth }] = await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/server-helpers"),
      ]);

      const auth = await getAuth();
      const { getWebRequest } = await import("@tanstack/react-start/server");
      const { headers } = getWebRequest();
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
      const { alias } = await import("drizzle-orm/pg-core");
      const { eq } = await import("drizzle-orm");

      const assignerUser = alias(user, "assigner_user");

      const [existingAssignment] = await db
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
        .where(eq(userRoles.id, data.assignmentId))
        .limit(1);

      if (!existingAssignment) {
        return {
          success: false,
          errors: [
            {
              code: "NOT_FOUND",
              message: "Role assignment not found",
            },
          ],
        };
      }

      await db.delete(userRoles).where(eq(userRoles.id, data.assignmentId));

      return {
        success: true,
        data: existingAssignment,
      };
    } catch (error) {
      console.error("Error removing role assignment:", error);

      if (error instanceof Error && error.message.includes("Admin access required")) {
        return {
          success: false,
          errors: [
            {
              code: "UNAUTHORIZED",
              message: "Admin access required",
            },
          ],
        };
      }

      return {
        success: false,
        errors: [
          {
            code: "DATABASE_ERROR",
            message: "Failed to remove role assignment",
          },
        ],
      };
    }
  });
