/**
 * Aggregation Functions
 *
 * Pure aggregation implementations for pivot computations.
 * Designed for TDD with property-based testing.
 *
 * @see docs/sin-rfp/decisions/bi/GUIDE-bi-testing.md (Property Tests)
 */

import type { AggregationType } from "../bi.schemas";

/**
 * Extract numeric values from data, handling nulls and type coercion
 */
function extractNumbers(values: unknown[]): number[] {
  return values
    .map((v) => {
      if (v === null || v === undefined) return null;
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const parsed = parseFloat(v);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    })
    .filter((v): v is number => v !== null);
}

/**
 * Count aggregation - counts non-null values
 */
export function count(values: unknown[]): number {
  return values.filter((v) => v !== null && v !== undefined).length;
}

/**
 * Sum aggregation - sums numeric values
 */
export function sum(values: unknown[]): number | null {
  const numbers = extractNumbers(values);
  if (numbers.length === 0) return null;
  return numbers.reduce((acc, val) => acc + val, 0);
}

/**
 * Average aggregation - arithmetic mean of numeric values
 */
export function avg(values: unknown[]): number | null {
  const numbers = extractNumbers(values);
  if (numbers.length === 0) return null;
  return numbers.reduce((acc, val) => acc + val, 0) / numbers.length;
}

/**
 * Minimum aggregation - smallest numeric value
 */
export function min(values: unknown[]): number | null {
  const numbers = extractNumbers(values);
  if (numbers.length === 0) return null;
  return Math.min(...numbers);
}

/**
 * Maximum aggregation - largest numeric value
 */
export function max(values: unknown[]): number | null {
  const numbers = extractNumbers(values);
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

// =============================================================================
// Phase 2 Aggregations (to be implemented)
// =============================================================================

/**
 * Count distinct aggregation - counts unique non-null values
 *
 * TODO: Implement in Phase 2
 */
export function countDistinct(values: unknown[]): number | null {
  void values; // Will be used in Phase 2
  throw new Error("countDistinct not implemented - Phase 2");
}

/**
 * Median aggregation - middle value
 *
 * TODO: Implement in Phase 2
 */
export function median(values: unknown[]): number | null {
  void values; // Will be used in Phase 2
  throw new Error("median not implemented - Phase 2");
}

/**
 * Standard deviation aggregation
 *
 * TODO: Implement in Phase 2
 */
export function stddev(values: unknown[]): number | null {
  void values; // Will be used in Phase 2
  throw new Error("stddev not implemented - Phase 2");
}

/**
 * Variance aggregation
 *
 * TODO: Implement in Phase 2
 */
export function variance(values: unknown[]): number | null {
  void values; // Will be used in Phase 2
  throw new Error("variance not implemented - Phase 2");
}

// =============================================================================
// Aggregator Registry
// =============================================================================

/**
 * Map of aggregation type to implementation function
 */
export const aggregators: Record<AggregationType, (values: unknown[]) => number | null> =
  {
    count,
    sum,
    avg,
    min,
    max,
  };

/**
 * Execute an aggregation by type
 */
export function executeAggregation(
  type: AggregationType,
  values: unknown[],
): number | null {
  const aggregator = aggregators[type];
  if (!aggregator) {
    throw new Error(`Unknown aggregation type: ${type}`);
  }
  return aggregator(values);
}
