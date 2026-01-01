/**
 * Aggregation Functions
 *
 * Pure aggregation implementations for pivot computations.
 * Designed for TDD with property-based testing.
 *
 * @see src/features/bi/docs/GUIDE-bi-testing.md
 */

import type { AggregationType } from "../bi.schemas";

export type AggregatorFn = (values: number[]) => number | null;

export const count: AggregatorFn = (values) => values.length;
export const sum: AggregatorFn = (values) => values.reduce((acc, val) => acc + val, 0);
export const avg: AggregatorFn = (values) =>
  values.length > 0 ? values.reduce((acc, val) => acc + val, 0) / values.length : null;
export const min: AggregatorFn = (values) =>
  values.length > 0 ? Math.min(...values) : null;
export const max: AggregatorFn = (values) =>
  values.length > 0 ? Math.max(...values) : null;

export const aggregators: Record<
  Exclude<AggregationType, "count_distinct" | "median" | "stddev" | "variance">,
  AggregatorFn
> = {
  count,
  sum,
  avg,
  min,
  max,
};

export const countDistinct: AggregatorFn = (values) => new Set(values).size;
export const median: AggregatorFn = (values) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
export const stddev: AggregatorFn = (values) => {
  if (values.length < 2) return null;
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squaredDiffs = values.map((value) => (value - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length);
};
export const variance: AggregatorFn = (values) => {
  if (values.length < 2) return null;
  const mean = values.reduce((acc, val) => acc + val, 0) / values.length;
  const squaredDiffs = values.map((value) => (value - mean) ** 2);
  return squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
};

export const aggregatorsPhase2: Record<
  "count_distinct" | "median" | "stddev" | "variance",
  AggregatorFn
> = {
  count_distinct: countDistinct,
  median,
  stddev,
  variance,
};

const allAggregators: Record<AggregationType, AggregatorFn> = {
  ...aggregators,
  ...aggregatorsPhase2,
};

export function executeAggregation(
  type: AggregationType,
  values: number[],
): number | null {
  const aggregator = allAggregators[type];
  if (!aggregator) {
    throw new Error(`Unknown aggregation type: ${type}`);
  }
  return aggregator(values);
}
