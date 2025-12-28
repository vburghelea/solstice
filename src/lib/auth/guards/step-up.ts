import { extractSessionTimes, getSessionFromHeaders } from "~/lib/auth/session";
import { forbidden } from "~/lib/server/errors";

// Default re-auth window: 15 minutes
const REAUTH_WINDOW_MS = 15 * 60 * 1000;
const STEP_UP_REASONS = {
  REAUTH_REQUIRED: "REAUTH_REQUIRED",
  MFA_REVERIFY_REQUIRED: "MFA_REVERIFY_REQUIRED",
  MFA_REQUIRED: "MFA_REQUIRED",
} as const;

type StepUpReason = (typeof STEP_UP_REASONS)[keyof typeof STEP_UP_REASONS];

const stepUpForbidden = (message: string, reason: StepUpReason) =>
  forbidden(message, { reason });

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
    throw stepUpForbidden(
      "Multi-factor authentication required",
      STEP_UP_REASONS.MFA_REQUIRED,
    );
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
    throw stepUpForbidden(
      "Multi-factor authentication required",
      STEP_UP_REASONS.MFA_REQUIRED,
    );
  }

  const reAuthWindowMs = options?.reAuthWindowMs ?? REAUTH_WINDOW_MS;
  const now = Date.now();
  const { authenticatedAt, lastMfaVerifiedAt } = extractSessionTimes(session);

  if (!authenticatedAt) {
    throw stepUpForbidden(
      "Re-authentication required for this action",
      STEP_UP_REASONS.REAUTH_REQUIRED,
    );
  }

  // Check if session was created recently
  const sessionAge = now - authenticatedAt.getTime();
  if (sessionAge > reAuthWindowMs) {
    throw stepUpForbidden(
      "Re-authentication required for this action",
      STEP_UP_REASONS.REAUTH_REQUIRED,
    );
  }

  // For MFA-enabled users, also require recent MFA verification
  if (record.twoFactorEnabled) {
    if (!lastMfaVerifiedAt) {
      throw stepUpForbidden(
        "MFA re-verification required for this action",
        STEP_UP_REASONS.MFA_REVERIFY_REQUIRED,
      );
    }

    const mfaAge = now - lastMfaVerifiedAt.getTime();
    if (mfaAge > reAuthWindowMs) {
      throw stepUpForbidden(
        "MFA re-verification required for this action",
        STEP_UP_REASONS.MFA_REVERIFY_REQUIRED,
      );
    }
  }
};

/**
 * Helper to get current session for step-up checks.
 * Call this and pass result to requireRecentAuth().
 */
export const getCurrentSession = async () => {
  const { getRequest } = await import("@tanstack/react-start/server");
  const { headers } = getRequest();
  return getSessionFromHeaders(headers);
};
