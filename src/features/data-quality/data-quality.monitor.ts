import type { JsonRecord } from "~/shared/lib/json";
import type {
  DataQualityAlert,
  DataQualityAlertMetric,
  DataQualitySummary,
} from "./data-quality.types";
import {
  COMPLETENESS_SCORE_MIN,
  buildDataQualityAlertKey,
  evaluateDataQualityAlerts,
  extractAlertKeys,
} from "./data-quality.alerts";

const ALERT_METRIC_LABELS: Record<DataQualityAlertMetric, string> = {
  missing_fields: "missing fields",
  validation_errors: "validation errors",
  low_completeness: "low completeness",
};

const buildSummary = async (): Promise<{
  summary: DataQualitySummary;
  orgSettingsById: Map<string, JsonRecord>;
}> => {
  const { getDb } = await import("~/db/server-helpers");
  const { formSubmissions, organizations } = await import("~/db/schema");
  const { inArray, sql } = await import("drizzle-orm");

  const db = await getDb();

  const stats = await db
    .select({
      organizationId: formSubmissions.organizationId,
      totalSubmissions: sql<number>`count(*)`,
      missingFields: sql<number>`count(*) filter (where jsonb_array_length(${formSubmissions.missingFields}) > 0)`,
      validationErrors: sql<number>`count(*) filter (where jsonb_array_length(${formSubmissions.validationErrors}) > 0)`,
      lowCompleteness: sql<number>`count(*) filter (where ${formSubmissions.completenessScore} < ${COMPLETENESS_SCORE_MIN})`,
      draftSubmissions: sql<number>`count(*) filter (where ${formSubmissions.status} = 'draft')`,
      latestSubmittedAt: sql<Date | null>`max(${formSubmissions.submittedAt})`,
    })
    .from(formSubmissions)
    .groupBy(formSubmissions.organizationId);

  const orgIds = stats.map((row) => row.organizationId).filter(Boolean);
  const orgRows =
    orgIds.length === 0
      ? []
      : await db
          .select({
            id: organizations.id,
            name: organizations.name,
            settings: organizations.settings,
          })
          .from(organizations)
          .where(inArray(organizations.id, orgIds));

  const orgNameById = new Map(orgRows.map((org) => [org.id, org.name]));
  const orgSettingsById = new Map(
    orgRows.map((org) => [org.id, (org.settings ?? {}) as JsonRecord]),
  );

  const toIsoString = (value: Date | string | null) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  };

  const byOrganization = stats.map((row) => ({
    organizationId: row.organizationId,
    organizationName: orgNameById.get(row.organizationId) ?? null,
    totalSubmissions: Number(row.totalSubmissions ?? 0),
    missingFields: Number(row.missingFields ?? 0),
    validationErrors: Number(row.validationErrors ?? 0),
    lowCompleteness: Number(row.lowCompleteness ?? 0),
    draftSubmissions: Number(row.draftSubmissions ?? 0),
    latestSubmittedAt: toIsoString(row.latestSubmittedAt),
  }));

  const totals = byOrganization.reduce(
    (acc, row) => ({
      totalSubmissions: acc.totalSubmissions + row.totalSubmissions,
      missingFields: acc.missingFields + row.missingFields,
      validationErrors: acc.validationErrors + row.validationErrors,
      lowCompleteness: acc.lowCompleteness + row.lowCompleteness,
      draftSubmissions: acc.draftSubmissions + row.draftSubmissions,
    }),
    {
      totalSubmissions: 0,
      missingFields: 0,
      validationErrors: 0,
      lowCompleteness: 0,
      draftSubmissions: 0,
    },
  );

  return { summary: { totals, byOrganization }, orgSettingsById };
};

const summarizeAlerts = (alerts: DataQualityAlert[]) => {
  const metricCounts: Record<DataQualityAlertMetric, number> = {
    missing_fields: 0,
    validation_errors: 0,
    low_completeness: 0,
  };

  const orgMap = new Map<
    string,
    { name: string | null; metrics: Set<DataQualityAlertMetric> }
  >();

  for (const alert of alerts) {
    metricCounts[alert.metric] += 1;
    const existing = orgMap.get(alert.organizationId);
    if (existing) {
      existing.metrics.add(alert.metric);
      continue;
    }
    orgMap.set(alert.organizationId, {
      name: alert.organizationName ?? null,
      metrics: new Set([alert.metric]),
    });
  }

  const organizations = Array.from(orgMap.entries()).map(([organizationId, info]) => ({
    organizationId,
    organizationName: info.name,
    metrics: Array.from(info.metrics),
  }));

  const organizationCount = organizations.length;
  const examples = organizations
    .slice(0, 3)
    .map((org) => {
      const label = org.organizationName ?? org.organizationId;
      const metrics = org.metrics.map((metric) => ALERT_METRIC_LABELS[metric]).join(", ");
      return `${label} (${metrics})`;
    })
    .join("; ");

  const bodySegments = [
    `New data quality alerts for ${organizationCount} organization${
      organizationCount === 1 ? "" : "s"
    }.`,
    `Missing fields: ${metricCounts.missing_fields}, validation errors: ${metricCounts.validation_errors}, low completeness: ${metricCounts.low_completeness}.`,
    examples ? `Examples: ${examples}.` : "",
  ].filter(Boolean);

  return {
    body: bodySegments.join(" "),
    metricCounts,
    organizationCount,
    organizations,
  };
};

export const runDataQualityCheck = async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { dataQualityRuns } = await import("~/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  const db = await getDb();
  const startedAt = new Date();

  try {
    const [previousRun] = await db
      .select({ summary: dataQualityRuns.summary })
      .from(dataQualityRuns)
      .where(eq(dataQualityRuns.status, "success"))
      .orderBy(desc(dataQualityRuns.startedAt))
      .limit(1);

    const { summary, orgSettingsById } = await buildSummary();
    const alertSummary = evaluateDataQualityAlerts({
      summary,
      orgSettings: orgSettingsById,
    });
    const summaryWithAlerts = { ...summary, alerts: alertSummary };
    const [run] = await db
      .insert(dataQualityRuns)
      .values({
        status: "success",
        summary: summaryWithAlerts as unknown as JsonRecord,
        startedAt,
        completedAt: new Date(),
      })
      .returning();

    if (run && alertSummary.triggered.length > 0) {
      const previousAlertKeys = extractAlertKeys(previousRun?.summary);
      const newAlerts = alertSummary.triggered.filter(
        (alert) => !previousAlertKeys.has(buildDataQualityAlertKey(alert)),
      );

      if (newAlerts.length > 0) {
        const { PermissionService } = await import("~/features/roles/permission.service");
        const { enqueueNotification } = await import("~/lib/notifications/queue");

        const adminIds = await PermissionService.getGlobalAdminUserIds();
        if (adminIds.length > 0) {
          const summaryDetails = summarizeAlerts(newAlerts);
          const metadata: JsonRecord = {
            runId: run.id,
            alertCount: newAlerts.length,
            organizationCount: summaryDetails.organizationCount,
            metrics: summaryDetails.metricCounts,
            organizations: summaryDetails.organizations,
            alerts: newAlerts.map((alert) => ({
              organizationId: alert.organizationId,
              organizationName: alert.organizationName,
              metric: alert.metric,
              issueCount: alert.issueCount,
              issueRate: alert.issueRate,
              threshold: alert.threshold,
            })),
          };

          await Promise.all(
            adminIds.map((adminId) =>
              enqueueNotification({
                userId: adminId,
                type: "data_quality_alert",
                category: "reporting",
                title: "Data quality alert",
                body: summaryDetails.body,
                link: "/dashboard/admin/sin/data-quality",
                metadata,
              }),
            ),
          );
        }
      }
    }

    return { run, summary: summaryWithAlerts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Data quality check failed";
    await db.insert(dataQualityRuns).values({
      status: "failed",
      summary: {} as JsonRecord,
      errorMessage: message,
      startedAt,
      completedAt: new Date(),
    });
    throw error;
  }
};
