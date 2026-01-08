import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { OperationResult } from "~/shared/types/common";

const securityWindowSchema = z
  .object({
    windowDays: z.number().int().min(7).max(365).optional(),
  })
  .optional();

const securityControlMutationSchema = z.object({
  controlId: z.string().min(1),
  enabled: z.boolean(),
  reason: z.string().min(12),
});

type SecurityDirection = "up" | "down" | "flat";

type AdminSecurityControlWire = {
  id: string;
  label: string;
  description: string;
  category: "identity" | "data" | "infrastructure" | "operations";
  impact: "critical" | "high" | "medium";
  enabled: boolean;
  lastReviewedAt: string;
  lastUpdatedBy: string;
  reviewIntervalDays: number;
};

type AdminSecurityIncidentWire = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high";
  status: "investigating" | "mitigated" | "resolved";
  detectedAt: string;
  resolvedAt: string | null;
  summary: string;
  personaImpact: string;
};

type AdminSecurityEventWire = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  channel: "manual" | "automation" | "system";
  riskLevel: "low" | "medium" | "high";
  context: string;
};

type AdminSecurityRecommendationWire = {
  id: string;
  title: string;
  detail: string;
  personaImpact: string;
  effort: "low" | "medium" | "high";
  status: "open" | "in-progress" | "complete";
};

type AdminSecuritySummaryWire = {
  score: number;
  status: "stable" | "attention" | "critical";
  change: number;
  direction: SecurityDirection;
  narrative: string;
  lastUpdatedAt: string;
};

type AdminSecurityPostureWire = {
  generatedAt: string;
  windowDays: number;
  summary: AdminSecuritySummaryWire;
  controls: AdminSecurityControlWire[];
  incidents: AdminSecurityIncidentWire[];
  eventLog: AdminSecurityEventWire[];
  recommendations: AdminSecurityRecommendationWire[];
};

export type AdminSecurityControl = Omit<AdminSecurityControlWire, "lastReviewedAt"> & {
  lastReviewedAt: Date;
};

export type AdminSecurityIncident = Omit<
  AdminSecurityIncidentWire,
  "detectedAt" | "resolvedAt"
> & {
  detectedAt: Date;
  resolvedAt: Date | null;
};

export type AdminSecurityEvent = Omit<AdminSecurityEventWire, "timestamp"> & {
  timestamp: Date;
};

export type AdminSecurityRecommendation = AdminSecurityRecommendationWire;

export type AdminSecuritySummary = Omit<AdminSecuritySummaryWire, "lastUpdatedAt"> & {
  lastUpdatedAt: Date;
};

export type AdminSecurityPosture = {
  generatedAt: Date;
  windowDays: number;
  summary: AdminSecuritySummary;
  controls: AdminSecurityControl[];
  incidents: AdminSecurityIncident[];
  eventLog: AdminSecurityEvent[];
  recommendations: AdminSecurityRecommendation[];
};

function toDate(value: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return parsed;
}

export const getAdminSecurityPosture = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => securityWindowSchema.parse(input))
  .handler(async ({ data }): Promise<OperationResult<AdminSecurityPostureWire>> => {
    const [{ getCurrentUser }, { PermissionService }] = await Promise.all([
      import("~/features/auth/auth.queries"),
      import("~/features/roles/permission.service"),
    ]);

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
      } satisfies OperationResult<AdminSecurityPostureWire>;
    }

    const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
    if (!isAdmin) {
      return {
        success: false,
        errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
      } satisfies OperationResult<AdminSecurityPostureWire>;
    }

    const windowDays = data?.windowDays ?? 30;
    const now = new Date();
    const generatedAt = now.toISOString();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const securityPosture: AdminSecurityPostureWire = {
      generatedAt,
      windowDays,
      summary: {
        score: 92,
        status: "stable",
        change: 3.2,
        direction: "up",
        narrative:
          "MFA adoption improved after the March push, and no privileged tokens have been issued without review in the last 30 days.",
        lastUpdatedAt: generatedAt,
      },
      controls: [
        {
          id: "mfa-enforcement",
          label: "Require MFA for privileged personas",
          description:
            "Blocks access to `/ops`, `/gm`, and `/admin` workspaces until TOTP enrollment is verified.",
          category: "identity",
          impact: "critical",
          enabled: true,
          lastReviewedAt: generatedAt,
          lastUpdatedBy: "Jordan Harper",
          reviewIntervalDays: 30,
        },
        {
          id: "session-invalidation",
          label: "Invalidate sessions on role downgrade",
          description:
            "Immediately expires refresh tokens when an admin removes high-sensitivity roles to prevent privilege drift.",
          category: "operations",
          impact: "high",
          enabled: true,
          lastReviewedAt: generatedAt,
          lastUpdatedBy: "Jordan Harper",
          reviewIntervalDays: 14,
        },
        {
          id: "csp-lockdown",
          label: "Strict content security policy",
          description:
            "Applies nonce-based CSP headers on `/admin` routes and blocks inline scripts from unvetted extensions.",
          category: "infrastructure",
          impact: "high",
          enabled: false,
          lastReviewedAt: lastWeek.toISOString(),
          lastUpdatedBy: "Security Engineering",
          reviewIntervalDays: 7,
        },
        {
          id: "audit-log-forwarding",
          label: "Forward audit logs to SIEM",
          description:
            "Ships privileged activity trails to the managed SIEM every five minutes with integrity checks.",
          category: "data",
          impact: "medium",
          enabled: true,
          lastReviewedAt: generatedAt,
          lastUpdatedBy: "Security Engineering",
          reviewIntervalDays: 7,
        },
      ],
      incidents: [
        {
          id: "INC-2048",
          title: "Legacy webhook retries spiked",
          severity: "medium",
          status: "mitigated",
          detectedAt: lastWeek.toISOString(),
          resolvedAt: generatedAt,
          summary:
            "Payment provider webhooks retried for legacy clients. Rate limits adjusted and clients notified.",
          personaImpact:
            "Players experienced duplicate confirmation emails for two hours.",
        },
        {
          id: "INC-2052",
          title: "Abnormal admin login velocity",
          severity: "high",
          status: "investigating",
          detectedAt: now.toISOString(),
          resolvedAt: null,
          summary:
            "Multiple admin personas attempted authentication from a new ASN. MFA challenges blocked the attempts, review in progress.",
          personaImpact:
            "No customer impact, but heightened monitoring enabled for Jordan's console.",
        },
      ],
      eventLog: [
        {
          id: "EVT-501",
          timestamp: generatedAt,
          actor: "Jordan Harper",
          action: "Confirmed export schedule for compliance bundle",
          channel: "manual",
          riskLevel: "medium",
          context:
            "Exports now ship every Monday at 09:00 UTC to the compliance SFTP endpoint.",
        },
        {
          id: "EVT-502",
          timestamp: lastWeek.toISOString(),
          actor: "Automation",
          action: "Rotated service account credentials",
          channel: "automation",
          riskLevel: "low",
          context:
            "Rotation complete for analytics ingestion worker; notifying observers.",
        },
      ],
      recommendations: [
        {
          id: "REC-301",
          title: "Roll out stricter CSP preview",
          detail:
            "Pilot nonce-based CSP in staging with Jordan's console to validate inline script allowances for dashboards.",
          personaImpact:
            "Ensures governance tooling remains trustworthy under supply-chain threats.",
          effort: "medium",
          status: "open",
        },
        {
          id: "REC-302",
          title: "Complete admin U2F rollout",
          detail:
            "Ship hardware key enrollment nudge for all admin personas to move beyond OTP-based MFA.",
          personaImpact:
            "Reduces fatigue for Jordan and improves recovery workflows for operations staff.",
          effort: "high",
          status: "in-progress",
        },
        {
          id: "REC-303",
          title: "Instrument privileged action breadcrumbs",
          detail:
            "Attach contextual breadcrumbs to exports and feature toggles so audit reviews include before/after diffs.",
          personaImpact:
            "Shortens investigation time when Jordan validates governance decisions.",
          effort: "low",
          status: "open",
        },
      ],
    };

    return {
      success: true,
      data: securityPosture,
    } satisfies OperationResult<AdminSecurityPostureWire>;
  });

export const updateAdminSecurityControl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => securityControlMutationSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<
      OperationResult<{
        controlId: string;
        enabled: boolean;
        event: AdminSecurityEventWire;
      }>
    > => {
      const [{ getCurrentUser }, { PermissionService }] = await Promise.all([
        import("~/features/auth/auth.queries"),
        import("~/features/roles/permission.service"),
      ]);

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          errors: [{ code: "UNAUTHORIZED", message: "User not authenticated" }],
        } satisfies OperationResult<{
          controlId: string;
          enabled: boolean;
          event: AdminSecurityEventWire;
        }>;
      }

      const isAdmin = await PermissionService.isGlobalAdmin(currentUser.id);
      if (!isAdmin) {
        return {
          success: false,
          errors: [{ code: "FORBIDDEN", message: "Admin access required" }],
        } satisfies OperationResult<{
          controlId: string;
          enabled: boolean;
          event: AdminSecurityEventWire;
        }>;
      }

      const { randomUUID } = await import("node:crypto");
      const timestamp = new Date().toISOString();

      const event: AdminSecurityEventWire = {
        id: randomUUID(),
        timestamp,
        actor: currentUser.name ?? currentUser.email ?? "Unknown admin",
        action: `${data.enabled ? "Enabled" : "Disabled"} ${data.controlId}`,
        channel: "manual",
        riskLevel: data.enabled ? "medium" : "high",
        context: data.reason,
      };

      return {
        success: true,
        data: { controlId: data.controlId, enabled: data.enabled, event },
      } satisfies OperationResult<{
        controlId: string;
        enabled: boolean;
        event: AdminSecurityEventWire;
      }>;
    },
  );

const securityQueryKey = (windowDays: number) => ["admin", "security", { windowDays }];

function parseSecurityPosture(data: AdminSecurityPostureWire): AdminSecurityPosture {
  return {
    generatedAt: toDate(data.generatedAt),
    windowDays: data.windowDays,
    summary: {
      ...data.summary,
      lastUpdatedAt: toDate(data.summary.lastUpdatedAt),
    },
    controls: data.controls.map((control) => ({
      ...control,
      lastReviewedAt: toDate(control.lastReviewedAt),
    })),
    incidents: data.incidents.map((incident) => ({
      ...incident,
      detectedAt: toDate(incident.detectedAt),
      resolvedAt: incident.resolvedAt ? toDate(incident.resolvedAt) : null,
    })),
    eventLog: data.eventLog.map((event) => ({
      ...event,
      timestamp: toDate(event.timestamp),
    })),
    recommendations: data.recommendations,
  };
}

export function useAdminSecurityPosture({
  windowDays = 30,
}: { windowDays?: number } = {}) {
  return useQuery({
    queryKey: securityQueryKey(windowDays),
    queryFn: async () => {
      const result = await getAdminSecurityPosture({ data: { windowDays } });
      if (!result.success) {
        throw new Error(result.errors[0]?.message ?? "Unable to load security posture");
      }
      return parseSecurityPosture(result.data);
    },
    staleTime: 1000 * 60,
  });
}

export function useUpdateAdminSecurityControl(windowDays = 30) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.infer<typeof securityControlMutationSchema>) => {
      const result = await updateAdminSecurityControl({ data: input });
      if (!result.success) {
        throw new Error(result.errors[0]?.message ?? "Unable to update security control");
      }
      return result.data;
    },
    onSuccess: ({ controlId, enabled, event }) => {
      queryClient.setQueryData<AdminSecurityPosture>(
        securityQueryKey(windowDays),
        (previous) => {
          if (!previous) return previous;
          return {
            ...previous,
            controls: previous.controls.map((control) =>
              control.id === controlId
                ? {
                    ...control,
                    enabled,
                    lastUpdatedBy: event.actor,
                    lastReviewedAt: new Date(event.timestamp),
                  }
                : control,
            ),
            eventLog: [
              {
                ...event,
                timestamp: new Date(event.timestamp),
              },
              ...previous.eventLog,
            ],
          } satisfies AdminSecurityPosture;
        },
      );
    },
  });
}
