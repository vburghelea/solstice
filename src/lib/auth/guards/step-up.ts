import { forbidden } from "~/lib/server/errors";

// Default re-auth window: 15 minutes
const REAUTH_WINDOW_MS = 15 * 60 * 1000;

/**
 * Extract session timestamps from Better Auth session.
 * Better Auth stores timestamps in various formats depending on version/config.
 * This function attempts to extract the most recent auth time.
 */
const extractSessionTimes = (session: Record<string, unknown> | null | undefined) => {
  if (!session) return { authenticatedAt: null, lastMfaVerifiedAt: null };

  const getTimestamp = (value: unknown): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      return isNaN(parsed) ? null : new Date(parsed);
    }
    if (typeof value === "number") return new Date(value);
    return null;
  };

  // Try common session property names for auth time
  const authTimeKeys = [
    "authenticatedAt",
    "createdAt",
    "iat",
    "created_at",
    "signedInAt",
  ];
  let authenticatedAt: Date | null = null;
  for (const key of authTimeKeys) {
    const val = getTimestamp(session[key]);
    if (val) {
      authenticatedAt = val;
      break;
    }
  }

  // Try common session property names for MFA verification time
  const mfaTimeKeys = [
    "lastMfaVerifiedAt",
    "mfaVerifiedAt",
    "last_mfa_verified_at",
    "mfa_verified_at",
  ];
  let lastMfaVerifiedAt: Date | null = null;
  for (const key of mfaTimeKeys) {
    const val = getTimestamp(session[key]);
    if (val) {
      lastMfaVerifiedAt = val;
      break;
    }
  }

  return { authenticatedAt, lastMfaVerifiedAt };
};

/**
 * Checks if user has MFA enabled when required.
 * For sensitive operations, prefer requireRecentAuth() which also checks re-auth window.
 */
export const requireMfaEnabled = async (userId: string) => {
  const { getDb } = await import("~/db/server-helpers");
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const [record] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

  if (!record) {
    throw forbidden("User not found");
  }

  if (record.mfaRequired && !record.twoFactorEnabled) {
    throw forbidden("Multi-factor authentication required");
  }
};

/**
 * Requires that user has authenticated recently (within REAUTH_WINDOW_MS).
 * For MFA-enabled users, also checks that MFA was verified recently.
 *
 * Use this for sensitive operations like:
 * - Data exports
 * - Role/permission changes
 * - DSAR processing
 * - Financial operations
 */
export const requireRecentAuth = async (
  userId: string,
  session: Record<string, unknown> | null | undefined,
  options?: { reAuthWindowMs?: number },
) => {
  const { getDb } = await import("~/db/server-helpers");
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");

  const db = await getDb();
  const [record] = await db.select().from(user).where(eq(user.id, userId)).limit(1);

  if (!record) {
    throw forbidden("User not found");
  }

  if (record.mfaRequired && !record.twoFactorEnabled) {
    throw forbidden("Multi-factor authentication required");
  }

  const reAuthWindowMs = options?.reAuthWindowMs ?? REAUTH_WINDOW_MS;
  const now = Date.now();
  const { authenticatedAt, lastMfaVerifiedAt } = extractSessionTimes(session);

  // Check if session was created recently
  if (authenticatedAt) {
    const sessionAge = now - authenticatedAt.getTime();
    if (sessionAge > reAuthWindowMs) {
      throw forbidden("Re-authentication required for this action");
    }
  }

  // For MFA-enabled users, also require recent MFA verification
  if (record.twoFactorEnabled) {
    // If we have MFA verification time, check it's recent
    if (lastMfaVerifiedAt) {
      const mfaAge = now - lastMfaVerifiedAt.getTime();
      if (mfaAge > reAuthWindowMs) {
        throw forbidden("MFA re-verification required for this action");
      }
    } else if (!authenticatedAt) {
      // No auth time and no MFA time - require re-auth
      throw forbidden("Re-authentication required for this action");
    }
  }
};

/**
 * Helper to get current session for step-up checks.
 * Call this and pass result to requireRecentAuth().
 */
export const getCurrentSession = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session;
};
