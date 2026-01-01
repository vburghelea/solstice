/**
 * BI Engine - Internal API
 *
 * Core computation engine for pivot tables and queries.
 */

export {
  buildPivotResult,
  groupByDimensions,
  parseDimensionKey,
  type PivotConfig,
  type PivotMeasureMeta,
} from "./pivot-aggregator";

export {
  aggregators,
  aggregatorsPhase2,
  avg,
  count,
  countDistinct,
  executeAggregation,
  max,
  median,
  min,
  stddev,
  sum,
  variance,
} from "./aggregations";

export {
  applyFilters,
  isNotNull,
  isNull,
  matchesAllFilters,
  matchesFilter,
  normalizeFilter,
  validateFilter,
  type AllowedFilterConfig,
  type FilterType,
  type NormalizedFilter,
} from "./filters";

export {
  normalizeSqlPlaceholders,
  parseAndValidateSql,
  restoreSqlPlaceholders,
  validateAgainstDataset,
  type ParsedQuery,
  type SqlParameter,
} from "./sql-parser";

export { rewriteSqlTables, type SqlRewriteResult } from "./sql-rewriter";

export { buildDatasetQueryPlan, type DatasetQueryPlan } from "./query-builder";

export {
  buildAllowedSortFields,
  normalizeSort,
  type SortConfig,
  type SortDirection,
} from "./sorting";
