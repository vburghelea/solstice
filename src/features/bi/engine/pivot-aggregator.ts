/**
 * Pivot Aggregator Engine
 *
 * Core pivot table computation engine. Extracted from reports.mutations.ts
 * to enable TDD and golden master testing.
 *
 * @see docs/sin-rfp/decisions/bi/PLAN-bi-implementation.md (Slice 1)
 * @see docs/sin-rfp/decisions/bi/GUIDE-bi-testing.md (Golden Masters)
 */

import type { PivotQuery, PivotResult } from "../bi.schemas";
import type { QueryContext } from "../bi.types";

/**
 * Build pivot result from raw data
 *
 * This is the pure function extracted from reports.mutations.ts.
 * It takes already-fetched and filtered data and computes aggregations.
 *
 * TODO: Extract from reports.mutations.ts in Slice 1
 *
 * @param data - Raw data rows (already org-scoped and filtered)
 * @param query - Pivot query configuration
 * @param context - Query execution context
 * @returns Computed pivot result
 */
export function buildPivotResult(
  data: Record<string, unknown>[],
  query: PivotQuery,
  context: QueryContext,
): PivotResult {
  void context; // Will be used for ACL checks
  const startTime = performance.now();

  // TODO: Implement - extract from reports.mutations.ts
  // 1. Group by dimension values
  // 2. Compute aggregations per group
  // 3. Format result cells

  const dimensions = query.dimensions.map((d) => d.field);
  const measures = query.measures.map((m) => `${m.aggregation}(${m.field})`);

  const executionTimeMs = performance.now() - startTime;

  return {
    cells: [],
    dimensions,
    measures,
    totalRows: data.length,
    truncated: data.length >= (query.limit ?? 1000),
    executionTimeMs,
  };
}

/**
 * Group data by dimension values
 *
 * @internal
 */
export function groupByDimensions(
  data: Record<string, unknown>[],
  dimensions: string[],
): Map<string, Record<string, unknown>[]> {
  const groups = new Map<string, Record<string, unknown>[]>();

  for (const row of data) {
    const key = dimensions.map((d) => String(row[d] ?? "")).join("|");
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Extract dimension values from group key
 *
 * @internal
 */
export function parseDimensionKey(
  key: string,
  dimensions: string[],
): Record<string, string> {
  const values = key.split("|");
  const result: Record<string, string> = {};
  dimensions.forEach((d, i) => {
    result[d] = values[i] ?? "";
  });
  return result;
}
