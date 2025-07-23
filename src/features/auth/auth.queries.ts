import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { user } from "~/db/schema";
import { auth } from "~/lib/auth";
import type { User } from "~/lib/auth/types";

/**
 * Server function to get the current user with all custom fields
 */
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    const { getWebRequest } = await import("@tanstack/react-start/server");
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user) {
      return null;
    }

    // Fetch the full user data from the database
    const dbUser = await db()
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser[0]) {
      return null;
    }

    // Map the database user to our extended User type
    return {
      ...session.user,
      profileComplete: dbUser[0].profileComplete,
      dateOfBirth: dbUser[0].dateOfBirth,
      emergencyContact: dbUser[0].emergencyContact,
      gender: dbUser[0].gender,
      pronouns: dbUser[0].pronouns,
      phone: dbUser[0].phone,
      privacySettings: dbUser[0].privacySettings,
      profileVersion: dbUser[0].profileVersion,
      profileUpdatedAt: dbUser[0].profileUpdatedAt,
    };
  },
);
