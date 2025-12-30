/**
 * Filter Engine
 *
 * Client-side filter application for pivot queries.
 * Matches Phase 1 operators from reports.config.ts.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 */

import type { Filter, FilterOperator, FilterValue } from "../bi.schemas";

/**
 * Apply a single filter to a value
 */
export function matchesFilter(
  value: unknown,
  operator: FilterOperator,
  filterValue: FilterValue,
): boolean {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (operator === "eq" && filterValue === null) return true;
    if (operator === "neq" && filterValue !== null) return true;
    return false;
  }

  switch (operator) {
    case "eq":
      return value === filterValue;

    case "neq":
      return value !== filterValue;

    case "gt":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value > filterValue;
      }
      if (typeof value === "string" && typeof filterValue === "string") {
        return value > filterValue;
      }
      return false;

    case "gte":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value >= filterValue;
      }
      if (typeof value === "string" && typeof filterValue === "string") {
        return value >= filterValue;
      }
      return false;

    case "lt":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value < filterValue;
      }
      if (typeof value === "string" && typeof filterValue === "string") {
        return value < filterValue;
      }
      return false;

    case "lte":
      if (typeof value === "number" && typeof filterValue === "number") {
        return value <= filterValue;
      }
      if (typeof value === "string" && typeof filterValue === "string") {
        return value <= filterValue;
      }
      return false;

    case "in":
      if (Array.isArray(filterValue)) {
        return filterValue.includes(value as string | number);
      }
      return false;

    case "between": {
      if (
        Array.isArray(filterValue) &&
        filterValue.length === 2 &&
        typeof value === "number"
      ) {
        const [minVal, maxVal] = filterValue as [number, number];
        return value >= minVal && value <= maxVal;
      }
      return false;
    }

    default: {
      // Type safety - should never reach here
      const _exhaustiveCheck: never = operator;
      throw new Error(`Unknown operator: ${_exhaustiveCheck}`);
    }
  }
}

/**
 * Check if a row matches all filters (AND logic)
 */
export function matchesAllFilters(
  row: Record<string, unknown>,
  filters: Filter[],
): boolean {
  return filters.every((filter) =>
    matchesFilter(row[filter.field], filter.operator, filter.value),
  );
}

/**
 * Apply filters to a dataset
 */
export function applyFilters(
  data: Record<string, unknown>[],
  filters: Filter[],
): Record<string, unknown>[] {
  if (filters.length === 0) return data;
  return data.filter((row) => matchesAllFilters(row, filters));
}

// =============================================================================
// Phase 2 Operators (to be implemented)
// =============================================================================

/**
 * Contains operator (string contains substring)
 *
 * TODO: Implement in Phase 2
 */
export function contains(value: unknown, substring: string): boolean {
  void value; // Will be used in Phase 2
  void substring;
  throw new Error("contains not implemented - Phase 2");
}

/**
 * Starts with operator
 *
 * TODO: Implement in Phase 2
 */
export function startsWith(value: unknown, prefix: string): boolean {
  void value; // Will be used in Phase 2
  void prefix;
  throw new Error("startsWith not implemented - Phase 2");
}

/**
 * Ends with operator
 *
 * TODO: Implement in Phase 2
 */
export function endsWith(value: unknown, suffix: string): boolean {
  void value; // Will be used in Phase 2
  void suffix;
  throw new Error("endsWith not implemented - Phase 2");
}

/**
 * Is null operator
 *
 * TODO: Implement in Phase 2
 */
export function isNull(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Is not null operator
 *
 * TODO: Implement in Phase 2
 */
export function isNotNull(value: unknown): boolean {
  return value !== null && value !== undefined;
}
