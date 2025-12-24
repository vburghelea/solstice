import { createServerOnlyFn } from "@tanstack/react-start";
import { isAccountLocked, lockAccount } from "./lockout";

export const applySecurityRules = createServerOnlyFn(
  async (params: { userId?: string | null; eventType: string }) => {
    if (!params.userId) return null;

    const existingLock = await isAccountLocked(params.userId);
    if (existingLock) return existingLock;

    const { getDb } = await import("~/db/server-helpers");
    const { securityEvents } = await import("~/db/schema");
    const { and, count, eq, gte } = await import("drizzle-orm");

    const db = await getDb();
    const now = Date.now();

    if (params.eventType === "login_fail") {
      const fifteenMinutesAgo = new Date(now - 15 * 60 * 1000);
      const [recentFails] = await db
        .select({ total: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.userId, params.userId),
            eq(securityEvents.eventType, "login_fail"),
            gte(securityEvents.createdAt, fifteenMinutesAgo),
          ),
        );

      if ((recentFails?.total ?? 0) >= 5) {
        return lockAccount({
          userId: params.userId,
          reason: "failed_logins",
          unlockAt: new Date(now + 30 * 60 * 1000),
          metadata: { threshold: "5_in_15m" },
        });
      }

      const oneHourAgo = new Date(now - 60 * 60 * 1000);
      const [hourFails] = await db
        .select({ total: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.userId, params.userId),
            eq(securityEvents.eventType, "login_fail"),
            gte(securityEvents.createdAt, oneHourAgo),
          ),
        );

      if ((hourFails?.total ?? 0) >= 10) {
        return lockAccount({
          userId: params.userId,
          reason: "failed_logins",
          unlockAt: null,
          metadata: { threshold: "10_in_1h" },
        });
      }
    }

    if (params.eventType === "mfa_fail") {
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const [mfaFails] = await db
        .select({ total: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.userId, params.userId),
            eq(securityEvents.eventType, "mfa_fail"),
            gte(securityEvents.createdAt, fiveMinutesAgo),
          ),
        );

      if ((mfaFails?.total ?? 0) >= 3) {
        return lockAccount({
          userId: params.userId,
          reason: "mfa_failures",
          unlockAt: new Date(now + 15 * 60 * 1000),
          metadata: { threshold: "3_in_5m" },
        });
      }
    }

    return null;
  },
);
