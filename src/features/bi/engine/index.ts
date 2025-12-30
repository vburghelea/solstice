/**
 * BI Engine - Internal API
 *
 * Core computation engine for pivot tables and queries.
 */

export {
  buildPivotResult,
  groupByDimensions,
  parseDimensionKey,
} from "./pivot-aggregator";

export {
  aggregators,
  avg,
  count,
  executeAggregation,
  max,
  min,
  sum,
} from "./aggregations";

export {
  applyFilters,
  isNotNull,
  isNull,
  matchesAllFilters,
  matchesFilter,
} from "./filters";
