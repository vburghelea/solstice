import { createServerOnlyFn } from "@tanstack/react-start";
import { isAccountLocked, lockAccount } from "./lockout";

type SecurityEventContext = {
  userId: string;
  eventType: string;
  eventId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  geoCountry?: string | null;
  geoRegion?: string | null;
};

export const applySecurityRules = createServerOnlyFn(
  async (params: SecurityEventContext) => {
    if (!params.userId) return null;

    const normalizedEventType = params.eventType.toLowerCase();
    const existingLock = await isAccountLocked(params.userId);
    if (existingLock) return existingLock;

    const { SECURITY_THRESHOLDS } = await import("~/lib/security/config");
    const { getDb } = await import("~/db/server-helpers");
    const { securityEvents } = await import("~/db/schema");
    const { and, count, desc, eq, gte, ne } = await import("drizzle-orm");
    const { recordSecurityEvent } = await import("~/lib/security/events");

    const db = await getDb();
    const now = Date.now();

    const countRecent = async (eventType: string, windowMs: number) => {
      const windowStart = new Date(now - windowMs);
      const [result] = await db
        .select({ total: count() })
        .from(securityEvents)
        .where(
          and(
            eq(securityEvents.userId, params.userId),
            eq(securityEvents.eventType, eventType),
            gte(securityEvents.createdAt, windowStart),
          ),
        );
      return result?.total ?? 0;
    };

    if (normalizedEventType === "login_fail") {
      const thresholds = SECURITY_THRESHOLDS.loginFailures;
      const lockCount = await countRecent("login_fail", thresholds.lockWindowMs);

      if (lockCount >= thresholds.lockThreshold) {
        const lock = await lockAccount({
          userId: params.userId,
          reason: "failed_logins",
          unlockAt: new Date(now + thresholds.lockDurationMs),
          metadata: { threshold: "lock_5_in_15m" },
        });

        await recordSecurityEvent({
          userId: params.userId,
          eventType: "account_locked",
          riskScore: 80,
          riskFactors: ["failed_logins"],
          metadata: { threshold: "lock_5_in_15m" },
        });

        return lock;
      }

      const flagCount = await countRecent("login_fail", thresholds.flagWindowMs);
      if (flagCount === thresholds.flagThreshold) {
        await recordSecurityEvent({
          userId: params.userId,
          eventType: "account_flagged",
          riskScore: 40,
          riskFactors: ["failed_logins"],
          metadata: { threshold: "flag_3_in_15m" },
        });
      }
    }

    if (normalizedEventType === "mfa_fail") {
      const thresholds = SECURITY_THRESHOLDS.mfaFailures;
      const lockCount = await countRecent("mfa_fail", thresholds.lockWindowMs);

      if (lockCount >= thresholds.lockThreshold) {
        const lock = await lockAccount({
          userId: params.userId,
          reason: "mfa_failures",
          unlockAt: new Date(now + thresholds.lockDurationMs),
          metadata: { threshold: "lock_3_in_5m" },
        });

        await recordSecurityEvent({
          userId: params.userId,
          eventType: "account_locked",
          riskScore: 80,
          riskFactors: ["mfa_failures"],
          metadata: { threshold: "lock_3_in_5m" },
        });

        return lock;
      }

      const flagCount = await countRecent("mfa_fail", thresholds.flagWindowMs);
      if (flagCount === thresholds.flagThreshold) {
        await recordSecurityEvent({
          userId: params.userId,
          eventType: "account_flagged",
          riskScore: 40,
          riskFactors: ["mfa_failures"],
          metadata: { threshold: "flag_2_in_5m" },
        });
      }
    }

    if (normalizedEventType === "login_success") {
      const lookbackLimit = SECURITY_THRESHOLDS.newContext.lookbackLimit;
      const loginConditions = [
        eq(securityEvents.userId, params.userId),
        eq(securityEvents.eventType, "login_success"),
      ];
      if (params.eventId) {
        loginConditions.push(ne(securityEvents.id, params.eventId));
      }

      const recentLogins = await db
        .select({
          ipAddress: securityEvents.ipAddress,
          userAgent: securityEvents.userAgent,
          geoCountry: securityEvents.geoCountry,
          geoRegion: securityEvents.geoRegion,
        })
        .from(securityEvents)
        .where(and(...loginConditions))
        .orderBy(desc(securityEvents.createdAt))
        .limit(lookbackLimit);

      if (recentLogins.length > 0) {
        const riskFactors: string[] = [];
        let riskScore = 0;

        if (
          params.geoCountry &&
          !recentLogins.some((entry) => entry.geoCountry === params.geoCountry)
        ) {
          riskFactors.push("new_country");
          riskScore += 30;
        }

        if (
          params.geoRegion &&
          !recentLogins.some((entry) => entry.geoRegion === params.geoRegion)
        ) {
          riskFactors.push("new_region");
          riskScore += 15;
        }

        if (
          params.userAgent &&
          !recentLogins.some((entry) => entry.userAgent === params.userAgent)
        ) {
          riskFactors.push("new_user_agent");
          riskScore += 20;
        }

        if (
          params.ipAddress &&
          params.ipAddress !== "0.0.0.0" &&
          !recentLogins.some((entry) => entry.ipAddress === params.ipAddress)
        ) {
          riskFactors.push("new_ip");
          riskScore += 10;
        }

        if (riskScore > 0) {
          await recordSecurityEvent({
            userId: params.userId,
            eventType: "login_anomaly",
            ipAddress: params.ipAddress ?? null,
            userAgent: params.userAgent ?? null,
            geoCountry: params.geoCountry ?? null,
            geoRegion: params.geoRegion ?? null,
            riskScore,
            riskFactors,
            metadata: {
              threshold: SECURITY_THRESHOLDS.newContext.riskScoreThreshold,
            },
          });

          if (riskScore >= SECURITY_THRESHOLDS.newContext.riskScoreThreshold) {
            await recordSecurityEvent({
              userId: params.userId,
              eventType: "account_flagged",
              riskScore,
              riskFactors,
              metadata: { reason: "login_anomaly" },
            });
          }
        }
      }
    }

    return null;
  },
);
