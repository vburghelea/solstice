import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

const normalizeIpCandidate = (candidate: string, isIP: (value: string) => number) => {
  const trimmed = candidate.trim();
  if (!trimmed) return null;
  if (isIP(trimmed)) return trimmed;
  if (trimmed.includes(":") && trimmed.includes(".")) {
    const [withoutPort] = trimmed.split(":");
    if (withoutPort && isIP(withoutPort)) return withoutPort;
  }
  return null;
};

const resolveIpAddress = async (
  inputIp: string | null | undefined,
  headers: Headers,
): Promise<string> => {
  const { isIP } = await import("node:net");
  if (inputIp) {
    const normalized = normalizeIpCandidate(inputIp, isIP);
    if (normalized) return normalized;
  }

  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const candidates = forwardedFor
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const candidate of candidates) {
      const normalized = normalizeIpCandidate(candidate, isIP);
      if (normalized) return normalized;
    }
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) {
    const normalized = normalizeIpCandidate(realIp, isIP);
    if (normalized) return normalized;
  }

  return "0.0.0.0";
};

export const recordSecurityEvent = createServerOnlyFn(
  async (params: {
    userId?: string | null;
    eventType: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    geoCountry?: string | null;
    geoRegion?: string | null;
    riskScore?: number;
    riskFactors?: string[];
    metadata?: JsonRecord;
    headers?: Headers;
  }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { securityEvents } = await import("~/db/schema");
    const { getRequest } = await import("@tanstack/react-start/server");

    const requestHeaders = params.headers ?? getRequest().headers;
    const ipAddress = await resolveIpAddress(params.ipAddress, requestHeaders);
    const userAgent = params.userAgent ?? requestHeaders.get("user-agent");
    const geoCountry =
      params.geoCountry ??
      requestHeaders.get("cf-ipcountry") ??
      requestHeaders.get("x-vercel-ip-country") ??
      null;
    const geoRegion =
      params.geoRegion ??
      requestHeaders.get("x-vercel-ip-country-region") ??
      requestHeaders.get("x-country-region") ??
      null;

    const normalizedEventType = params.eventType.toLowerCase();
    const db = await getDb();
    const [event] = await db
      .insert(securityEvents)
      .values({
        userId: params.userId ?? null,
        eventType: normalizedEventType,
        ipAddress,
        userAgent,
        geoCountry,
        geoRegion,
        riskScore: params.riskScore ?? 0,
        riskFactors: params.riskFactors ?? [],
        metadata: params.metadata ?? {},
      })
      .returning();

    const { logAuthEvent, logSecurityEvent } = await import("~/lib/audit");
    const normalizedEvent = normalizedEventType.toUpperCase();
    await logSecurityEvent({
      action: `SECURITY.${normalizedEvent}`,
      actorUserId: params.userId ?? null,
      actorIp: ipAddress,
      actorUserAgent: userAgent ?? null,
      metadata: params.metadata ?? {},
    });

    // Emit CloudWatch metrics for high-severity security events only.
    // Skip individual login_fail/mfa_fail to avoid noise (they roll up to account_flagged).
    const HIGH_SEVERITY_EVENT_TYPES = new Set([
      "account_locked",
      "account_flagged",
      "login_anomaly",
    ]);
    if (HIGH_SEVERITY_EVENT_TYPES.has(normalizedEventType)) {
      const { recordSecurityEventMetric } = await import("~/lib/observability/metrics");
      await recordSecurityEventMetric({
        eventType: normalizedEventType,
        ...(params.riskScore !== undefined && { riskScore: params.riskScore }),
      });
    }

    const authEventTypes = new Set([
      "LOGIN_SUCCESS",
      "LOGIN_FAIL",
      "MFA_SUCCESS",
      "MFA_FAIL",
      "LOGOUT",
      "PASSWORD_RESET",
    ]);
    if (authEventTypes.has(normalizedEvent)) {
      await logAuthEvent({
        action: `AUTH.${normalizedEvent}`,
        actorUserId: params.userId ?? null,
        actorIp: ipAddress,
        actorUserAgent: userAgent ?? null,
        metadata: params.metadata ?? {},
      });
    }

    return event ?? null;
  },
);
