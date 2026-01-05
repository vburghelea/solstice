import type { JsonRecord } from "~/shared/lib/json";
import type {
  DataQualityAlert,
  DataQualityAlertMetric,
  DataQualityAlertSummary,
  DataQualitySummary,
} from "./data-quality.types";

export type DataQualityThresholds = {
  missingFieldsRate: number;
  validationErrorRate: number;
  lowCompletenessRate: number;
  minSubmissions: number;
};

export const COMPLETENESS_SCORE_MIN = 80;

export const DEFAULT_DATA_QUALITY_THRESHOLDS: DataQualityThresholds = {
  missingFieldsRate: 0.05,
  validationErrorRate: 0.02,
  lowCompletenessRate: 0.1,
  minSubmissions: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readRate = (value: unknown, fallback: number) => {
  const candidate = readNumber(value);
  if (candidate === null || candidate < 0 || candidate > 1) return fallback;
  return candidate;
};

const readMinSubmissions = (value: unknown, fallback: number) => {
  const candidate = readNumber(value);
  if (candidate === null || candidate < 1) return fallback;
  return Math.floor(candidate);
};

export const resolveDataQualityThresholds = (
  settings: JsonRecord | null | undefined,
): DataQualityThresholds => {
  const dataQuality = isRecord(settings?.["dataQuality"])
    ? (settings?.["dataQuality"] as Record<string, unknown>)
    : null;
  const overrides = isRecord(dataQuality?.["alertThresholds"])
    ? (dataQuality?.["alertThresholds"] as Record<string, unknown>)
    : null;

  return {
    missingFieldsRate: readRate(
      overrides?.["missingFieldsRate"],
      DEFAULT_DATA_QUALITY_THRESHOLDS.missingFieldsRate,
    ),
    validationErrorRate: readRate(
      overrides?.["validationErrorRate"],
      DEFAULT_DATA_QUALITY_THRESHOLDS.validationErrorRate,
    ),
    lowCompletenessRate: readRate(
      overrides?.["lowCompletenessRate"],
      DEFAULT_DATA_QUALITY_THRESHOLDS.lowCompletenessRate,
    ),
    minSubmissions: readMinSubmissions(
      overrides?.["minSubmissions"],
      DEFAULT_DATA_QUALITY_THRESHOLDS.minSubmissions,
    ),
  };
};

export const buildDataQualityAlertKey = (alert: DataQualityAlert) =>
  `${alert.organizationId}:${alert.metric}`;

export const extractAlertKeys = (summary: unknown) => {
  if (!summary || typeof summary !== "object") return new Set<string>();
  const record = summary as { alerts?: { triggered?: DataQualityAlert[] } };
  const alerts = record.alerts?.triggered;
  if (!Array.isArray(alerts)) return new Set<string>();

  return new Set(
    alerts
      .filter((alert) => typeof alert?.organizationId === "string")
      .map((alert) => buildDataQualityAlertKey(alert)),
  );
};

const safeRate = (count: number, total: number) => (total > 0 ? count / total : 0);

const pushAlert = (params: {
  alerts: DataQualityAlert[];
  metric: DataQualityAlertMetric;
  row: DataQualitySummary["byOrganization"][number];
  threshold: number;
  issueCount: number;
}) => {
  const issueRate = safeRate(params.issueCount, params.row.totalSubmissions);
  params.alerts.push({
    organizationId: params.row.organizationId,
    organizationName: params.row.organizationName,
    metric: params.metric,
    totalSubmissions: params.row.totalSubmissions,
    issueCount: params.issueCount,
    issueRate,
    threshold: params.threshold,
  });
};

export const evaluateDataQualityAlerts = (params: {
  summary: DataQualitySummary;
  orgSettings: Map<string, JsonRecord>;
}): DataQualityAlertSummary => {
  const triggered: DataQualityAlert[] = [];

  for (const row of params.summary.byOrganization) {
    const thresholds = resolveDataQualityThresholds(
      params.orgSettings.get(row.organizationId),
    );
    if (row.totalSubmissions < thresholds.minSubmissions) continue;

    const missingFieldsRate = safeRate(row.missingFields, row.totalSubmissions);
    if (missingFieldsRate >= thresholds.missingFieldsRate) {
      pushAlert({
        alerts: triggered,
        metric: "missing_fields",
        row,
        threshold: thresholds.missingFieldsRate,
        issueCount: row.missingFields,
      });
    }

    const validationErrorRate = safeRate(row.validationErrors, row.totalSubmissions);
    if (validationErrorRate >= thresholds.validationErrorRate) {
      pushAlert({
        alerts: triggered,
        metric: "validation_errors",
        row,
        threshold: thresholds.validationErrorRate,
        issueCount: row.validationErrors,
      });
    }

    const lowCompletenessRate = safeRate(row.lowCompleteness, row.totalSubmissions);
    if (lowCompletenessRate >= thresholds.lowCompletenessRate) {
      pushAlert({
        alerts: triggered,
        metric: "low_completeness",
        row,
        threshold: thresholds.lowCompletenessRate,
        issueCount: row.lowCompleteness,
      });
    }
  }

  return {
    triggered,
    totalOrganizations: params.summary.byOrganization.length,
    completenessScoreMinimum: COMPLETENESS_SCORE_MIN,
  };
};
