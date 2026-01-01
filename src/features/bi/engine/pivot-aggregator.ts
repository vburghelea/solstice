/**
 * Pivot Aggregator Engine
 *
 * Core pivot table computation engine extracted from reports.mutations.ts.
 *
 * @see src/features/bi/docs/PLAN-bi-implementation.md
 * @see src/features/bi/docs/GUIDE-bi-testing.md
 */

import type { AggregationType, PivotResult } from "../bi.schemas";
import { executeAggregation } from "./aggregations";

export type PivotMeasureMeta = {
  field: string | null;
  aggregation: AggregationType;
  key: string;
  label: string;
};

export type PivotConfig = {
  rowFields: string[];
  columnFields: string[];
  measures: PivotMeasureMeta[];
};

type MeasureBucket = {
  count: number;
  values: number[];
  distinct: Set<string>;
};

const toPivotKey = (fields: string[], row: Record<string, unknown>) => {
  if (fields.length === 0) return "__total__";
  return fields.map((field) => String(row[field] ?? "")).join("||");
};

const toPivotValues = (fields: string[], row: Record<string, unknown>) => {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const value = row[field];
    if (value === null || value === undefined) {
      values[field] = "";
    } else if (typeof value === "string") {
      values[field] = value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      values[field] = String(value);
    } else {
      values[field] = JSON.stringify(value);
    }
  }
  return values;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * Build pivot result from raw data
 *
 * @param rows - Raw data rows (already org-scoped and filtered)
 * @param config - Pivot config with fields and measures
 */
export function buildPivotResult(
  rows: Array<Record<string, unknown>>,
  config: PivotConfig,
): PivotResult {
  const columnKeyMap = new Map<string, Record<string, string>>();
  const rowMap = new Map<
    string,
    {
      values: Record<string, string>;
      cells: Record<string, Record<string, MeasureBucket>>;
    }
  >();

  for (const row of rows) {
    const rowKey = toPivotKey(config.rowFields, row);
    const columnKey = toPivotKey(config.columnFields, row);
    const columnValues = toPivotValues(config.columnFields, row);

    if (!columnKeyMap.has(columnKey)) {
      columnKeyMap.set(columnKey, columnValues);
    }

    const rowEntry = rowMap.get(rowKey) ?? {
      values: toPivotValues(config.rowFields, row),
      cells: {},
    };

    if (!rowEntry.cells[columnKey]) {
      rowEntry.cells[columnKey] = {};
    }

    for (const measure of config.measures) {
      if (!rowEntry.cells[columnKey][measure.key]) {
        rowEntry.cells[columnKey][measure.key] = {
          count: 0,
          values: [],
          distinct: new Set<string>(),
        };
      }

      const bucket = rowEntry.cells[columnKey][measure.key];

      if (measure.aggregation === "count") {
        bucket.count += 1;
        continue;
      }

      const field = measure.field;
      if (!field) continue;
      const rawValue = row[field];

      if (measure.aggregation === "count_distinct") {
        if (rawValue !== null && rawValue !== undefined) {
          bucket.distinct.add(String(rawValue));
        }
        continue;
      }

      const numeric = toNumber(rawValue);
      if (numeric === null) continue;
      bucket.values.push(numeric);
    }

    rowMap.set(rowKey, rowEntry);
  }

  const columnKeys = Array.from(columnKeyMap.entries()).map(([key, values]) => {
    const label =
      Object.keys(values).length === 0
        ? "Total"
        : Object.entries(values)
            .map(([field, value]) => `${field}: ${value || "-"}`)
            .join(" / ");
    return { key, label, values };
  });

  const outputRows = Array.from(rowMap.entries()).map(([key, rowEntry]) => {
    const cells: Record<string, Record<string, number | null>> = {};
    for (const columnKey of columnKeys) {
      const aggregate = rowEntry.cells[columnKey.key] ?? {};
      cells[columnKey.key] = {};
      for (const measure of config.measures) {
        const bucket = aggregate[measure.key];
        if (!bucket) {
          cells[columnKey.key][measure.key] = null;
          continue;
        }

        if (measure.aggregation === "count") {
          cells[columnKey.key][measure.key] = bucket.count;
          continue;
        }

        if (measure.aggregation === "count_distinct") {
          cells[columnKey.key][measure.key] = bucket.distinct.size;
          continue;
        }

        const value = executeAggregation(measure.aggregation, bucket.values);
        if (measure.aggregation === "avg") {
          cells[columnKey.key][measure.key] =
            value !== null ? Number(value.toFixed(2)) : null;
          continue;
        }

        cells[columnKey.key][measure.key] = value;
      }
    }

    return { key, values: rowEntry.values, cells };
  });

  return {
    rowFields: config.rowFields,
    columnFields: config.columnFields,
    measures: config.measures,
    columnKeys,
    rows: outputRows,
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
    const key =
      dimensions.length === 0
        ? "__total__"
        : dimensions.map((dimension) => String(row[dimension] ?? "")).join("|");
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
  dimensions.forEach((dimension, index) => {
    result[dimension] = values[index] ?? "";
  });
  return result;
}
