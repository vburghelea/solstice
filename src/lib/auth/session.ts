import { createServerOnlyFn } from "@tanstack/react-start";

const AUTH_TIME_KEYS = [
  "authenticatedAt",
  "createdAt",
  "iat",
  "created_at",
  "signedInAt",
] as const;

const MFA_TIME_KEYS = [
  "lastMfaVerifiedAt",
  "mfaVerifiedAt",
  "last_mfa_verified_at",
  "mfa_verified_at",
] as const;

type SessionTimeResult = {
  authenticatedAt: Date | null;
  lastMfaVerifiedAt: Date | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toTimestamp = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  if (typeof value === "number") {
    const normalized = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(normalized);
  }
  return null;
};

/**
 * Extract session timestamps from Better Auth session results.
 * Supports nested shapes (session.session.*) and top-level keys.
 */
export const extractSessionTimes = (
  session: Record<string, unknown> | null | undefined,
): SessionTimeResult => {
  if (!session) {
    return { authenticatedAt: null, lastMfaVerifiedAt: null };
  }

  const candidates: Record<string, unknown>[] = [];

  const nestedSession = session["session"];
  if (isRecord(nestedSession)) {
    candidates.push(nestedSession);
  }

  candidates.push(session);

  const findTimestamp = (keys: readonly string[]) => {
    for (const candidate of candidates) {
      for (const key of keys) {
        const value = toTimestamp(candidate[key]);
        if (value) return value;
      }
    }
    return null;
  };

  return {
    authenticatedAt: findTimestamp(AUTH_TIME_KEYS),
    lastMfaVerifiedAt: findTimestamp(MFA_TIME_KEYS),
  };
};

/**
 * Fetch a fresh session from Better Auth with cookie cache disabled.
 */
export const getSessionFromHeaders = createServerOnlyFn(async (headers: Headers) => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const auth = await getAuth();

  return auth.api.getSession({
    headers,
    query: { disableCookieCache: true },
  });
});
