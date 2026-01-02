import type { PivotQuery } from "../bi.schemas";
import { QUERY_GUARDRAILS } from "../governance/query-guardrails";

export interface QueryCost {
  estimatedCardinality: number;
  estimatedRows: number;
  isSafe: boolean;
  reason?: string;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const countActiveFilters = (filters: PivotQuery["filters"]) =>
  filters.filter((filter) => {
    if (filter.operator === "is_null" || filter.operator === "is_not_null") {
      return true;
    }
    if (Array.isArray(filter.value)) return filter.value.length > 0;
    return filter.value !== undefined && filter.value !== null && filter.value !== "";
  }).length;

export const estimateQueryCost = (query: PivotQuery): QueryCost => {
  const dimensionCount = query.rows.length + query.columns.length;
  const filterCount = countActiveFilters(query.filters);

  if (query.measures.length === 0) {
    return {
      estimatedCardinality: 0,
      estimatedRows: 0,
      isSafe: false,
      reason: "Add at least one measure before running a query.",
    };
  }

  if (dimensionCount === 0) {
    return {
      estimatedCardinality: 1,
      estimatedRows: 1,
      isSafe: true,
    };
  }

  const baseCardinality = Math.pow(10, dimensionCount);
  const filterFactor = filterCount > 0 ? Math.max(1, filterCount) * 8 : 1;
  const estimatedCardinality = clamp(
    Math.round(baseCardinality / filterFactor),
    1,
    QUERY_GUARDRAILS.maxPivotCells * 20,
  );

  const isSafe =
    estimatedCardinality <= QUERY_GUARDRAILS.maxPivotCells &&
    (filterCount > 0 || dimensionCount <= 1);

  const result: QueryCost = {
    estimatedCardinality,
    estimatedRows: Math.min(estimatedCardinality, QUERY_GUARDRAILS.maxRowsUi),
    isSafe,
  };
  if (!isSafe) {
    result.reason =
      "Query may return too many categories; add filters or reduce dimensions.";
  }
  return result;
};
