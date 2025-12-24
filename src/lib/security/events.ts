import { createServerOnlyFn } from "@tanstack/react-start";
import type { JsonRecord } from "~/shared/lib/json";

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
  }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { securityEvents } = await import("~/db/schema");
    const { getRequest } = await import("@tanstack/react-start/server");

    const request = getRequest();
    const ipAddress =
      params.ipAddress ??
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "0.0.0.0";
    const userAgent = params.userAgent ?? request.headers.get("user-agent");
    const geoCountry =
      params.geoCountry ??
      request.headers.get("cf-ipcountry") ??
      request.headers.get("x-vercel-ip-country") ??
      null;
    const geoRegion =
      params.geoRegion ??
      request.headers.get("x-vercel-ip-country-region") ??
      request.headers.get("x-country-region") ??
      null;

    const db = await getDb();
    const [event] = await db
      .insert(securityEvents)
      .values({
        userId: params.userId ?? null,
        eventType: params.eventType,
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
    const normalizedEvent = params.eventType.toUpperCase();
    await logSecurityEvent({
      action: `SECURITY.${normalizedEvent}`,
      actorUserId: params.userId ?? null,
      actorIp: ipAddress,
      actorUserAgent: userAgent ?? null,
      metadata: params.metadata ?? {},
    });

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
