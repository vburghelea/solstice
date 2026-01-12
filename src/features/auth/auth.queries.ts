import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { User } from "~/lib/auth/types";

export type SocialAuthProvider = "google" | "microsoft" | "apple";

const checkPasskeysByEmailSchema = z.object({
  email: z.string().email(),
});

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

export const getAvailableSocialProviders = createServerFn({ method: "GET" }).handler(
  async (): Promise<SocialAuthProvider[]> => {
    const { env } = await import("~/lib/env.server");
    const providers: SocialAuthProvider[] = [];

    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
      providers.push("google");
    }

    if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
      providers.push("microsoft");
    }

    if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
      providers.push("apple");
    }

    return providers;
  },
);

/**
 * Check if a user (by email) has any passkeys registered.
 * Used for identifier-first login flow - check after email entry.
 */
export const checkPasskeysByEmail = createServerFn({ method: "POST" })
  .inputValidator(checkPasskeysByEmailSchema.parse)
  .handler(async ({ data }): Promise<{ hasPasskeys: boolean }> => {
    const [{ getDb }, { eq }] = await Promise.all([
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { user, passkey } = await import("~/db/schema");

    const db = await getDb();

    // Find user by email first
    const [foundUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, data.email));

    if (!foundUser) {
      // Don't reveal whether user exists - return false
      return { hasPasskeys: false };
    }

    // Check if user has any passkeys
    const passkeys = await db
      .select({ id: passkey.id })
      .from(passkey)
      .where(eq(passkey.userId, foundUser.id))
      .limit(1);

    return { hasPasskeys: passkeys.length > 0 };
  });

/**
 * Get passkey prompt status for the current user.
 * Includes passkey count, permanent dismissal, and MFA enrollment flag.
 */
export const getCurrentUserPasskeyPromptStatus = createServerFn({
  method: "GET",
}).handler(
  async (): Promise<{
    count: number;
    dismissed: boolean;
    twoFactorEnabled: boolean;
  }> => {
    const [{ getDb }, { getSessionFromHeaders }, { getRequest }, { eq, count }] =
      await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/session"),
        import("@tanstack/react-start/server"),
        import("drizzle-orm"),
      ]);
    const { headers } = getRequest();
    const session = await getSessionFromHeaders(headers);

    if (!session?.user) {
      return { count: 0, dismissed: false, twoFactorEnabled: false };
    }

    const { passkey, user } = await import("~/db/schema");
    const db = await getDb();

    const [passkeyCount, userRow] = await Promise.all([
      db
        .select({ count: count() })
        .from(passkey)
        .where(eq(passkey.userId, session.user.id)),
      db
        .select({
          dismissed: user.passkeyPromptDismissed,
          twoFactorEnabled: user.twoFactorEnabled,
        })
        .from(user)
        .where(eq(user.id, session.user.id)),
    ]);

    return {
      count: passkeyCount?.[0]?.count ?? 0,
      dismissed: userRow?.[0]?.dismissed ?? false,
      twoFactorEnabled: userRow?.[0]?.twoFactorEnabled ?? false,
    };
  },
);

/**
 * Permanently dismiss the passkey enrollment prompt for the current user.
 * This persists across devices since it's stored in the database.
 */
export const dismissPasskeyPrompt = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ success: boolean }> => {
    const [{ getDb }, { getSessionFromHeaders }, { getRequest }, { eq }] =
      await Promise.all([
        import("~/db/server-helpers"),
        import("~/lib/auth/session"),
        import("@tanstack/react-start/server"),
        import("drizzle-orm"),
      ]);
    const { headers } = getRequest();
    const session = await getSessionFromHeaders(headers);

    if (!session?.user) {
      return { success: false };
    }

    const { user } = await import("~/db/schema");
    const db = await getDb();

    await db
      .update(user)
      .set({ passkeyPromptDismissed: true })
      .where(eq(user.id, session.user.id));

    return { success: true };
  },
);
