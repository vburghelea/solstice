import { createServerFn } from "@tanstack/react-start";
import type { User } from "~/lib/auth/types";

/**
 * Server function to get the current user with all custom fields
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    // Import server-only modules inside the handler
    const { getDb } = await import("~/db/server-helpers");
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const { getRequest } = await import("@tanstack/react-start/server");
    const auth = await getAuth();
    const { headers } = getRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return null;
    }

    // Import schema and ORM inside the handler
    const { eq } = await import("drizzle-orm");
    const { user } = await import("~/db/schema");

    // Fetch the full user data from the database
    const db = await getDb();
    const dbUser = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser[0]) {
      return null;
    }

    // Fetch user roles
    const { PermissionService } = await import("~/features/roles/permission.service");
    const userRoles = await PermissionService.getUserRoles(session.user.id);

    // Map the database user to our extended User type
    return {
      ...session.user,
      image: dbUser[0].image,
      uploadedAvatarPath: dbUser[0].uploadedAvatarPath,
      profileComplete: dbUser[0].profileComplete,
      gender: dbUser[0].gender,
      pronouns: dbUser[0].pronouns,
      phone: dbUser[0].phone,
      city: dbUser[0].city,
      country: dbUser[0].country,
      privacySettings: dbUser[0].privacySettings,
      profileVersion: dbUser[0].profileVersion,
      profileUpdatedAt: dbUser[0].profileUpdatedAt,
      roles: userRoles,
    };
  },
);

export const getProviders = createServerFn({ method: "GET" }).handler(
  async (): Promise<string[]> => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const [{ getDb }, { eq }] = await Promise.all([
      import("~/db/server-helpers"),
      import("drizzle-orm"),
    ]);
    const { account } = await import("~/db/schema");

    const db = await getDb();
    const linkedAccounts = await db
      .select({ providerId: account.providerId })
      .from(account)
      .where(eq(account.userId, currentUser.id));

    return linkedAccounts.map((acc) => acc.providerId);
  },
);

export const changePassword = createServerFn({ method: "POST" }).handler(
  //@ts-expect-error:  Start type inference issue
  async ({ data }: { data: { currentPassword: string; newPassword: string } }) => {
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const { getRequest } = await import("@tanstack/react-start/server");
    const auth = await getAuth();
    const { headers } = getRequest();

    try {
      await auth.api.changePassword({
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        },
        headers,
      });
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: "An unknown error occurred." };
    }
  },
);
