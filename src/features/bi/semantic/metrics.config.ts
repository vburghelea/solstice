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
  expression: string;
  aggregation?: AggregationType;
  formatType?: "text" | "number" | "currency" | "percent" | "date" | "datetime";
  formatOptions?: FormatOptions;
}

export const METRICS: MetricDefinition[] = [];

export function getMetric(id: string): MetricDefinition | undefined {
  return METRICS.find((metric) => metric.id === id);
}

export function getMetricsForDataset(datasetId: string): MetricDefinition[] {
  return METRICS.filter((metric) => metric.datasetId === datasetId);
}

export function registerMetric(metric: MetricDefinition): void {
  METRICS.push(metric);
}
