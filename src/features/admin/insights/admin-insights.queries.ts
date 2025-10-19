import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { z } from "zod";

import { SupportedLanguage } from "~/lib/i18n/config";
import { getServerTranslationFunction } from "~/lib/i18n/server-translations";
import type { OperationResult } from "~/shared/types/common";

const adminInsightsInputSchema = z
  .object({
    windowDays: z.number().int().min(7).max(180).optional(),
    language: z.enum(["en", "de", "pl"]).optional(),
  })
  .optional();

type TrendDirection = "up" | "down" | "flat";

type AdminInsightKpiWire = {
  id: string;
  label: string;
  value: number;
  change: number;
  direction: TrendDirection;
  supportingCopy: string;
};

type AdminIncidentWire = {
  id: number;
  source: string;
  severity: "info" | "warning" | "error";
  status: string;
  startedAt: string;
  finishedAt: string | null;
  durationMinutes: number;
  description: string;
  httpStatus: number | null;
};

type AdminAlertWire = {
  id: string;
  name: string;
  channel: string;
  threshold: string;
  enabled: boolean;
  lastTriggeredAt: string | null;
  status: "stable" | "degraded" | "critical";
};

type PersonaImpactWire = {
  personaId: "visitor" | "player" | "ops" | "gm" | "admin";
  personaLabel: string;
  headline: string;
  change: number;
  direction: TrendDirection;
};

type AdminInsightsWire = {
  generatedAt: string;
  windowDays: number;
  kpis: AdminInsightKpiWire[];
  incidents: AdminIncidentWire[];
  alerts: AdminAlertWire[];
  personaImpacts: PersonaImpactWire[];
};

export type AdminInsightKpi = {
  id: string;
  label: string;
  value: number;
  change: number;
  direction: TrendDirection;
  supportingCopy: string;
};

export type AdminIncident = {
  id: number;
  source: string;
  severity: "info" | "warning" | "error";
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMinutes: number;
  description: string;
  httpStatus: number | null;
};

export type AdminAlert = {
  id: string;
  name: string;
  channel: string;
  threshold: string;
  enabled: boolean;
  lastTriggeredAt: Date | null;
  status: "stable" | "degraded" | "critical";
};

export type PersonaImpact = {
  personaId: "visitor" | "player" | "ops" | "gm" | "admin";
  personaLabel: string;
  headline: string;
  change: number;
  direction: TrendDirection;
};

export type AdminInsightsSnapshot = {
  generatedAt: Date;
  windowDays: number;
  kpis: AdminInsightKpi[];
  incidents: AdminIncident[];
  alerts: AdminAlert[];
  personaImpacts: PersonaImpact[];
};

function computeTrend(
  current: number,
  previous: number,
): {
  change: number;
  direction: TrendDirection;
} {
  const difference = current - previous;
  if (Math.abs(difference) < 0.0001) {
    return { change: 0, direction: "flat" };
  }

  if (previous === 0) {
    return {
      change: current === 0 ? 0 : 100,
      direction: current === 0 ? "flat" : "up",
    };
  }

  const change = (difference / previous) * 100;
  return {
    change,
    direction: change > 0 ? "up" : "down",
  };
}

function toDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export const getAdminInsights = createServerFn({ method: "GET" })
  .validator((input: unknown) => adminInsightsInputSchema.parse(input))
  .handler(async ({ data }): Promise<OperationResult<AdminInsightsWire>> => {
    try {
      const [{ getCurrentUser }, { getDb }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/db/server-helpers"),
      ]);
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
        };
      }

      const { PermissionService } = await import("~/features/roles/permission.service");
      const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
      if (!isAdmin) {
        return {
          success: false,
          errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
        };
      }

      const db = await getDb();
      const windowDays = data?.windowDays ?? 30;
      const language = (data?.language as SupportedLanguage) ?? "en";
      const t = getServerTranslationFunction("admin", language);
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const windowStart = new Date(today);
      windowStart.setDate(windowStart.getDate() - windowDays);
      const previousWindowStart = new Date(windowStart);
      previousWindowStart.setDate(previousWindowStart.getDate() - windowDays);
      const expiringThreshold = new Date(today);
      expiringThreshold.setDate(expiringThreshold.getDate() + 30);

      const todayDateOnly = toDateOnlyString(today);
      const windowStartDateOnly = toDateOnlyString(windowStart);
      const previousWindowStartDateOnly = toDateOnlyString(previousWindowStart);
      const expiringThresholdDateOnly = toDateOnlyString(expiringThreshold);

      const {
        memberships,
        events,
        user,
        systemCrawlEvents,
        userRoles,
        gameParticipants,
        campaigns,
      } = await import("~/db/schema");

      const [
        [totalUsersRow],
        [activeMembershipsRow],
        [expiringMembershipsRow],
        [newMembersCurrentRow],
        [newMembersPreviousRow],
        [roleAssignmentsCurrentRow],
        [roleAssignmentsPreviousRow],
        [eventsCurrentRow],
        [eventsPreviousRow],
        [playerEngagementCurrentRow],
        [playerEngagementPreviousRow],
        [gmPipelineCurrentRow],
        [gmPipelinePreviousRow],
        incidentRows,
        [membershipExpiringTouchRow],
        [incidentLatestRow],
      ] = await Promise.all([
        db.select({ value: sql<number>`count(*)::int` }).from(user),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(memberships)
          .where(
            and(
              eq(memberships.status, "active"),
              gte(memberships.endDate, todayDateOnly),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(memberships)
          .where(
            and(
              eq(memberships.status, "active"),
              gte(memberships.endDate, todayDateOnly),
              lt(memberships.endDate, expiringThresholdDateOnly),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(memberships)
          .where(
            and(
              gte(memberships.startDate, windowStartDateOnly),
              gte(memberships.endDate, windowStartDateOnly),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(memberships)
          .where(
            and(
              gte(memberships.startDate, previousWindowStartDateOnly),
              lt(memberships.startDate, windowStartDateOnly),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(userRoles)
          .where(gte(userRoles.assignedAt, windowStart)),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(userRoles)
          .where(
            and(
              gte(userRoles.assignedAt, previousWindowStart),
              lt(userRoles.assignedAt, windowStart),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(events)
          .where(
            and(
              gte(events.createdAt, windowStart),
              inArray(events.status, [
                "published",
                "registration_open",
                "registration_closed",
                "in_progress",
              ]),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(events)
          .where(
            and(
              gte(events.createdAt, previousWindowStart),
              lt(events.createdAt, windowStart),
              inArray(events.status, [
                "published",
                "registration_open",
                "registration_closed",
                "in_progress",
              ]),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(gameParticipants)
          .where(
            and(
              eq(gameParticipants.role, "player"),
              eq(gameParticipants.status, "approved"),
              gte(gameParticipants.createdAt, windowStart),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(gameParticipants)
          .where(
            and(
              eq(gameParticipants.role, "player"),
              eq(gameParticipants.status, "approved"),
              gte(gameParticipants.createdAt, previousWindowStart),
              lt(gameParticipants.createdAt, windowStart),
            ),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(campaigns)
          .where(
            and(gte(campaigns.createdAt, windowStart), eq(campaigns.status, "active")),
          ),
        db
          .select({ value: sql<number>`count(*)::int` })
          .from(campaigns)
          .where(
            and(
              gte(campaigns.createdAt, previousWindowStart),
              lt(campaigns.createdAt, windowStart),
              eq(campaigns.status, "active"),
            ),
          ),
        db
          .select({
            id: systemCrawlEvents.id,
            source: systemCrawlEvents.source,
            severity: systemCrawlEvents.severity,
            status: systemCrawlEvents.status,
            startedAt: systemCrawlEvents.startedAt,
            finishedAt: systemCrawlEvents.finishedAt,
            httpStatus: systemCrawlEvents.httpStatus,
            errorMessage: systemCrawlEvents.errorMessage,
          })
          .from(systemCrawlEvents)
          .where(
            and(
              gte(systemCrawlEvents.startedAt, windowStart),
              inArray(systemCrawlEvents.severity, ["warning", "error"]),
            ),
          )
          .orderBy(desc(systemCrawlEvents.startedAt))
          .limit(25),
        db
          .select({
            value: sql<string | null>`max(${memberships.updatedAt})`,
          })
          .from(memberships)
          .where(
            and(
              eq(memberships.status, "active"),
              gte(memberships.endDate, todayDateOnly),
              lt(memberships.endDate, expiringThresholdDateOnly),
            ),
          ),
        db
          .select({
            value: sql<string | null>`max(${systemCrawlEvents.finishedAt})`,
          })
          .from(systemCrawlEvents)
          .where(inArray(systemCrawlEvents.severity, ["warning", "error"])),
      ]);

      const totalUsers = Number(totalUsersRow?.value ?? 0);
      const activeMemberships = Number(activeMembershipsRow?.value ?? 0);
      const expiringMemberships = Number(expiringMembershipsRow?.value ?? 0);
      const newMembersCurrent = Number(newMembersCurrentRow?.value ?? 0);
      const newMembersPrevious = Number(newMembersPreviousRow?.value ?? 0);
      const assignmentsCurrent = Number(roleAssignmentsCurrentRow?.value ?? 0);
      const assignmentsPrevious = Number(roleAssignmentsPreviousRow?.value ?? 0);
      const eventsCurrent = Number(eventsCurrentRow?.value ?? 0);
      const eventsPrevious = Number(eventsPreviousRow?.value ?? 0);
      const playersCurrent = Number(playerEngagementCurrentRow?.value ?? 0);
      const playersPrevious = Number(playerEngagementPreviousRow?.value ?? 0);
      const campaignsCurrent = Number(gmPipelineCurrentRow?.value ?? 0);
      const campaignsPrevious = Number(gmPipelinePreviousRow?.value ?? 0);

      const membershipTrend = computeTrend(newMembersCurrent, newMembersPrevious);
      const roleTrend = computeTrend(assignmentsCurrent, assignmentsPrevious);
      const visitorTrend = computeTrend(eventsCurrent, eventsPrevious);
      const playerTrend = computeTrend(playersCurrent, playersPrevious);
      const gmTrend = computeTrend(campaignsCurrent, campaignsPrevious);

      const incidentDurations = incidentRows.reduce((total, incident) => {
        if (!incident.finishedAt) {
          return total;
        }
        const duration =
          (new Date(incident.finishedAt).getTime() -
            new Date(incident.startedAt).getTime()) /
          60000;
        return total + Math.max(0, duration);
      }, 0);
      const totalMinutesInWindow = windowDays * 24 * 60;
      const downtimeRatio =
        totalMinutesInWindow === 0 ? 0 : incidentDurations / totalMinutesInWindow;
      const availability = Math.max(0, 100 - downtimeRatio * 100);

      const kpis: AdminInsightKpiWire[] = [
        {
          id: "active-memberships",
          label: t("insights.kpis.active_memberships.label"),
          value: activeMemberships,
          change: membershipTrend.change,
          direction: membershipTrend.direction,
          supportingCopy: t("insights.kpis.active_memberships.supporting_copy", {
            count: expiringMemberships,
          }),
        },
        {
          id: "governance-uptime",
          label: t("insights.kpis.platform_availability.label"),
          value: Number(availability.toFixed(2)),
          change: -Math.abs(downtimeRatio * 100),
          direction: availability >= 99 ? "up" : "down",
          supportingCopy: t("insights.kpis.platform_availability.supporting_copy", {
            count: incidentRows.length,
          }),
        },
        {
          id: "role-assignments",
          label: t("insights.kpis.role_assignments.label"),
          value: assignmentsCurrent,
          change: roleTrend.change,
          direction: roleTrend.direction,
          supportingCopy: t("insights.kpis.role_assignments.supporting_copy", {
            users: totalUsers,
            grants: assignmentsCurrent,
          }),
        },
        {
          id: "gm-pipeline",
          label: t("insights.kpis.campaign_activations.label"),
          value: campaignsCurrent,
          change: gmTrend.change,
          direction: gmTrend.direction,
          supportingCopy: t("insights.kpis.campaign_activations.supporting_copy"),
        },
      ];

      const incidents: AdminIncidentWire[] = incidentRows.map((row) => ({
        id: row.id,
        source: row.source,
        severity: (row.severity as AdminIncidentWire["severity"]) ?? "info",
        status: row.status,
        startedAt: row.startedAt.toISOString(),
        finishedAt: row.finishedAt ? row.finishedAt.toISOString() : null,
        durationMinutes: row.finishedAt
          ? Math.max(
              0,
              Math.round((row.finishedAt.getTime() - row.startedAt.getTime()) / 60000),
            )
          : 0,
        description:
          row.errorMessage?.trim() ||
          `Automated crawler reported ${row.status.toLowerCase()}`,
        httpStatus: row.httpStatus,
      }));

      const alerts: AdminAlertWire[] = [
        {
          id: "membership-expiry",
          name: t("insights.alerts.membership_expiry_watch"),
          channel: t("insights.alerts.channels.slack_email"),
          threshold: t("insights.alerts.thresholds.expiring_in_30_days", {
            count: expiringMemberships,
          }),
          enabled: true,
          lastTriggeredAt: membershipExpiringTouchRow?.value ?? null,
          status:
            expiringMemberships > 25
              ? "critical"
              : expiringMemberships > 0
                ? "degraded"
                : "stable",
        },
        {
          id: "incident-response",
          name: t("insights.alerts.system_incident_response"),
          channel: t("insights.alerts.channels.pager_email"),
          threshold: t("insights.alerts.thresholds.incidents_in_window", {
            count: incidentRows.length,
            days: windowDays,
          }),
          enabled: true,
          lastTriggeredAt: incidentLatestRow?.value ?? null,
          status: incidentRows.some((incident) => incident.severity === "error")
            ? "critical"
            : incidentRows.length > 0
              ? "degraded"
              : "stable",
        },
        {
          id: "persona-alignment",
          name: t("insights.alerts.persona_alignment_digest"),
          channel: t("insights.alerts.channels.weekly_email"),
          threshold: t("insights.alerts.thresholds.live_visitor_touchpoints", {
            count: eventsCurrent,
          }),
          enabled: true,
          lastTriggeredAt: now.toISOString(),
          status: visitorTrend.direction === "down" ? "degraded" : "stable",
        },
      ];

      const personaImpacts: PersonaImpactWire[] = [
        {
          personaId: "visitor",
          personaLabel: t("insights.persona_impacts.visitor.label"),
          headline: t("insights.persona_impacts.visitor.headline", {
            count: eventsCurrent,
          }),
          change: visitorTrend.change,
          direction: visitorTrend.direction,
        },
        {
          personaId: "player",
          personaLabel: t("insights.persona_impacts.player.label"),
          headline: t("insights.persona_impacts.player.headline", {
            count: playersCurrent,
          }),
          change: playerTrend.change,
          direction: playerTrend.direction,
        },
        {
          personaId: "ops",
          personaLabel: t("insights.persona_impacts.ops.label"),
          headline: t("insights.persona_impacts.ops.headline", { count: eventsCurrent }),
          change: visitorTrend.change,
          direction: visitorTrend.direction,
        },
        {
          personaId: "gm",
          personaLabel: t("insights.persona_impacts.gm.label"),
          headline: t("insights.persona_impacts.gm.headline", {
            count: campaignsCurrent,
          }),
          change: gmTrend.change,
          direction: gmTrend.direction,
        },
        {
          personaId: "admin",
          personaLabel: t("insights.persona_impacts.admin.label"),
          headline: t("insights.persona_impacts.admin.headline", {
            count: assignmentsCurrent,
          }),
          change: roleTrend.change,
          direction: roleTrend.direction,
        },
      ];

      const payload: AdminInsightsWire = {
        generatedAt: now.toISOString(),
        windowDays,
        kpis,
        incidents,
        alerts,
        personaImpacts,
      };

      return { success: true, data: payload };
    } catch (error) {
      console.error("getAdminInsights error", error);
      return {
        success: false,
        errors: [
          {
            code: "SERVER_ERROR",
            message: "Unable to load administration insights",
          },
        ],
      };
    }
  });

function normalizeInsights(data: AdminInsightsWire): AdminInsightsSnapshot {
  return {
    generatedAt: new Date(data.generatedAt),
    windowDays: data.windowDays,
    kpis: data.kpis,
    incidents: data.incidents.map((incident) => ({
      ...incident,
      startedAt: new Date(incident.startedAt),
      finishedAt: toDate(incident.finishedAt),
    })),
    alerts: data.alerts.map((alert) => ({
      ...alert,
      lastTriggeredAt: toDate(alert.lastTriggeredAt),
    })),
    personaImpacts: data.personaImpacts,
  };
}

export interface UseAdminInsightsOptions
  extends Omit<
    UseQueryOptions<AdminInsightsSnapshot, Error, AdminInsightsSnapshot>,
    "queryKey" | "queryFn"
  > {
  windowDays?: number;
  language?: SupportedLanguage;
}

export function useAdminInsights({
  windowDays,
  language,
  ...options
}: UseAdminInsightsOptions = {}) {
  return useQuery<AdminInsightsSnapshot, Error>({
    queryKey: ["admin", "insights", windowDays ?? 30, language],
    queryFn: async () => {
      const result = await getAdminInsights({
        data: {
          windowDays: windowDays ?? 30,
          language,
        },
      });
      if (!result.success) {
        throw new Error(result.errors?.[0]?.message ?? "Failed to load admin insights");
      }
      return normalizeInsights(result.data);
    },
    staleTime: 60_000,
    ...options,
  });
}
