import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type { User } from "~/lib/auth/types";

/**
 * Server function to get the current user with all custom fields
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    // Import server-only modules inside the handler
    const [{ getDb }, { getSessionFromHeaders }, { getRequest }] = await Promise.all([
      import("~/db/server-helpers"),
      import("~/lib/auth/session"),
      import("@tanstack/react-start/server"),
    ]);
    const { headers } = getRequest();
    const session = await getSessionFromHeaders(headers);

    if (!session?.user) {
      return null;
    }

    // Import schema and ORM inside the handler
    const db = await getDb();
    const { eq } = await import("drizzle-orm");
    const { user, roles, userRoles } = await import("~/db/schema");

    // Fetch user data and roles in parallel using the SAME db instance
    // This avoids the extra db() acquisition that PermissionService.getUserRoles() would do
    const [dbUserRows, roleRows] = await Promise.all([
      db
        .select({
          profileComplete: user.profileComplete,
          dateOfBirth: user.dateOfBirth,
          emergencyContact: user.emergencyContact,
          gender: user.gender,
          pronouns: user.pronouns,
          phone: user.phone,
          privacySettings: user.privacySettings,
          profileVersion: user.profileVersion,
          profileUpdatedAt: user.profileUpdatedAt,
          mfaRequired: user.mfaRequired,
          mfaEnrolledAt: user.mfaEnrolledAt,
          twoFactorEnabled: user.twoFactorEnabled,
        })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1),
      db
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
        .where(eq(userRoles.userId, session.user.id)),
    ]);

    const dbUser = dbUserRows[0];
    if (!dbUser) {
      return null;
    }

    // Map the database user to our extended User type
    return {
      ...session.user,
      ...dbUser,
      roles: roleRows,
    };
  },
);

export type AuthQueryResult = Awaited<ReturnType<typeof getCurrentUser>>;

export const authQueryKey = ["user"] as const;

export const authQueryOptions = () =>
  queryOptions({
    queryKey: authQueryKey,
    queryFn: ({ signal }) => getCurrentUser({ signal }),
  });
