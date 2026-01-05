export type DataQualityTotals = {
  totalSubmissions: number;
  missingFields: number;
  validationErrors: number;
  lowCompleteness: number;
  draftSubmissions: number;
};

export type DataQualityOrganizationSummary = {
  organizationId: string;
  organizationName: string | null;
  totalSubmissions: number;
  missingFields: number;
  validationErrors: number;
  lowCompleteness: number;
  draftSubmissions: number;
  latestSubmittedAt: string | null;
};

export type DataQualityAlertMetric =
  | "missing_fields"
  | "validation_errors"
  | "low_completeness";

export type DataQualityAlert = {
  organizationId: string;
  organizationName: string | null;
  metric: DataQualityAlertMetric;
  totalSubmissions: number;
  issueCount: number;
  issueRate: number;
  threshold: number;
};

export type DataQualityAlertSummary = {
  triggered: DataQualityAlert[];
  totalOrganizations: number;
  completenessScoreMinimum: number;
};

export type DataQualitySummary = {
  totals: DataQualityTotals;
  byOrganization: DataQualityOrganizationSummary[];
  alerts?: DataQualityAlertSummary;
};
