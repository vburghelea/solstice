/**
 * Metric definitions for the BI semantic layer.
 */

import type { AggregationType } from "../bi.schemas";
import type { FormatOptions } from "../bi.types";

export interface MetricDefinition {
  id: string;
  name: string;
  description?: string;
  datasetId: string;
  fieldId?: string | null;
  expression: string;
  aggregation?: AggregationType;
  formatType?: "text" | "number" | "currency" | "percent" | "date" | "datetime";
  formatOptions?: FormatOptions;
  requiredPermission?: string;
}

export const METRICS: MetricDefinition[] = [
  {
    id: "org_total",
    name: "Total organizations",
    description: "Count of organizations in scope.",
    datasetId: "organizations",
    fieldId: "id",
    expression: "id",
    aggregation: "count",
    formatType: "number",
    formatOptions: { decimals: 0, thousandsSeparator: "," },
  },
  {
    id: "reporting_total_submissions",
    name: "Total submissions",
    description: "Count of reporting submissions in scope.",
    datasetId: "reporting_submissions",
    fieldId: "id",
    expression: "id",
    aggregation: "count",
    formatType: "number",
    formatOptions: { decimals: 0, thousandsSeparator: "," },
  },
  {
    id: "forms_total_submissions",
    name: "Total form submissions",
    description: "Count of form submissions in scope.",
    datasetId: "form_submissions",
    fieldId: "id",
    expression: "id",
    aggregation: "count",
    formatType: "number",
    formatOptions: { decimals: 0, thousandsSeparator: "," },
  },
  {
    id: "forms_avg_completeness",
    name: "Average completeness",
    description: "Average completeness score across submissions.",
    datasetId: "form_submissions",
    fieldId: "completenessScore",
    expression: "completenessScore",
    aggregation: "avg",
    formatType: "percent",
    formatOptions: { decimals: 1 },
  },
  {
    id: "events_total",
    name: "Total events",
    description: "Count of events in scope.",
    datasetId: "events",
    fieldId: "id",
    expression: "id",
    aggregation: "count",
    formatType: "number",
    formatOptions: { decimals: 0, thousandsSeparator: "," },
  },
];

export function getMetric(id: string): MetricDefinition | undefined {
  return METRICS.find((metric) => metric.id === id);
}

export function getMetricsForDataset(datasetId: string): MetricDefinition[] {
  return METRICS.filter((metric) => metric.datasetId === datasetId);
}

export function registerMetric(metric: MetricDefinition): void {
  METRICS.push(metric);
}
