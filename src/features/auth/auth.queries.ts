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

    const rows = await db
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
        roleAssignmentId: userRoles.id,
        roleAssignmentUserId: userRoles.userId,
        roleAssignmentRoleId: userRoles.roleId,
        roleAssignmentTeamId: userRoles.teamId,
        roleAssignmentEventId: userRoles.eventId,
        roleAssignmentAssignedBy: userRoles.assignedBy,
        roleAssignmentAssignedAt: userRoles.assignedAt,
        roleAssignmentExpiresAt: userRoles.expiresAt,
        roleAssignmentNotes: userRoles.notes,
        roleId: roles.id,
        roleName: roles.name,
        roleDescription: roles.description,
        rolePermissions: roles.permissions,
      })
      .from(user)
      .leftJoin(userRoles, eq(user.id, userRoles.userId))
      .leftJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(user.id, session.user.id));

    const [firstRow] = rows;
    if (!firstRow) {
      return null;
    }

    // Map the database user to our extended User type
    return {
      ...session.user,
      profileComplete: firstRow.profileComplete,
      dateOfBirth: firstRow.dateOfBirth,
      emergencyContact: firstRow.emergencyContact,
      gender: firstRow.gender,
      pronouns: firstRow.pronouns,
      phone: firstRow.phone,
      privacySettings: firstRow.privacySettings,
      profileVersion: firstRow.profileVersion,
      profileUpdatedAt: firstRow.profileUpdatedAt,
      mfaRequired: firstRow.mfaRequired,
      mfaEnrolledAt: firstRow.mfaEnrolledAt,
      twoFactorEnabled: firstRow.twoFactorEnabled,
      roles: rows
        .filter((row) => Boolean(row.roleAssignmentId && row.roleId))
        .map((row) => ({
          id: row.roleAssignmentId!,
          userId: row.roleAssignmentUserId!,
          roleId: row.roleAssignmentRoleId!,
          teamId: row.roleAssignmentTeamId,
          eventId: row.roleAssignmentEventId,
          assignedBy: row.roleAssignmentAssignedBy!,
          assignedAt: row.roleAssignmentAssignedAt!,
          expiresAt: row.roleAssignmentExpiresAt,
          notes: row.roleAssignmentNotes,
          role: {
            id: row.roleId!,
            name: row.roleName!,
            description: row.roleDescription,
            permissions: row.rolePermissions ?? {},
          },
        })),
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
