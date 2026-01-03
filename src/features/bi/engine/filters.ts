/**
 * Filter Engine
 *
 * Normalization + client-side matching helpers for BI filters.
 */

import type { FilterConfig, FilterOperator, FilterValue } from "../bi.schemas";

export type FilterType = "string" | "number" | "date" | "enum" | "uuid" | "boolean";

export type NormalizedFilter = {
  field: string;
  operator: FilterOperator;
  value: unknown;
};

export type AllowedFilterConfig = {
  operators: FilterOperator[];
  type: FilterType;
};

const coerceBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("Value must be a boolean");
};

const coerceNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Value must be a number");
  }
  return parsed;
};

const coerceDate = (value: unknown): Date => {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error("Value must be a valid date");
  }
  return date;
};

const coerceString = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) return value;
  throw new Error("Value must be a non-empty string");
};

const coerceValue = (value: unknown, type: FilterType) => {
  switch (type) {
    case "number":
      return coerceNumber(value);
    case "boolean":
      return coerceBoolean(value);
    case "date":
      return coerceDate(value);
    case "string":
    case "enum":
    case "uuid":
      return coerceString(value);
    default:
      return value;
  }
};

const coerceFilterValue = (
  rawValue: unknown,
  type: FilterType,
  operator: FilterOperator,
): unknown => {
  if (operator === "is_null" || operator === "is_not_null") {
    return null;
  }

  if (operator === "in" || operator === "not_in") {
    if (!Array.isArray(rawValue) || rawValue.length === 0) {
      throw new Error("Value must be a non-empty array");
    }
    return rawValue.map((value) => coerceValue(value, type));
  }

  if (operator === "between") {
    if (!Array.isArray(rawValue) || rawValue.length !== 2) {
      throw new Error("Value must be a [start, end] array");
    }
    return rawValue.map((value) => coerceValue(value, type));
  }

  if (Array.isArray(rawValue)) {
    throw new Error("Value must be a single value");
  }

  return coerceValue(rawValue, type);
};

export function normalizeFilter(
  filter: FilterConfig,
  allowedFilters: Record<string, AllowedFilterConfig>,
): NormalizedFilter {
  const config = allowedFilters[filter.field];
  if (!config) {
    throw new Error(`Field '${filter.field}' is not allowed`);
  }

  if (!config.operators.includes(filter.operator)) {
    throw new Error(`Operator '${filter.operator}' not allowed for '${filter.field}'`);
  }

  return {
    field: filter.field,
    operator: filter.operator,
    value: coerceFilterValue(filter.value, config.type, filter.operator),
  };
}

export function validateFilter(
  filter: FilterConfig,
  allowedFilters: Record<string, AllowedFilterConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const config = allowedFilters[filter.field];
  if (!config) {
    return { valid: false, errors: [`Field '${filter.field}' is not allowed`] };
  }

  if (!config.operators.includes(filter.operator)) {
    errors.push(`Operator '${filter.operator}' not allowed for field '${filter.field}'`);
  }

  try {
    coerceFilterValue(filter.value, config.type, filter.operator);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Invalid filter value");
  }

  return { valid: errors.length === 0, errors };
}

const toComparable = (value: unknown): string | number | null => {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.getTime();
    return value;
  }
  return null;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  return value.toLowerCase();
};

/**
 * Apply a single filter to a value
 */
export function matchesFilter(
  value: unknown,
  operator: FilterOperator,
  filterValue: FilterValue | undefined,
): boolean {
  if (operator === "is_null") return value === null || value === undefined;
  if (operator === "is_not_null") return value !== null && value !== undefined;

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
    case "gt": {
      const left = toComparable(value);
      const right = toComparable(filterValue);
      return left !== null && right !== null ? left > right : false;
    }
    case "gte": {
      const left = toComparable(value);
      const right = toComparable(filterValue);
      return left !== null && right !== null ? left >= right : false;
    }
    case "lt": {
      const left = toComparable(value);
      const right = toComparable(filterValue);
      return left !== null && right !== null ? left < right : false;
    }
    case "lte": {
      const left = toComparable(value);
      const right = toComparable(filterValue);
      return left !== null && right !== null ? left <= right : false;
    }
    case "in":
      return Array.isArray(filterValue)
        ? filterValue.includes(value as string | number | boolean | null)
        : false;
    case "not_in":
      return Array.isArray(filterValue)
        ? !filterValue.includes(value as string | number | boolean | null)
        : false;
    case "between": {
      if (Array.isArray(filterValue) && filterValue.length === 2) {
        const [minVal, maxVal] = filterValue;
        const left = toComparable(value);
        const min = toComparable(minVal);
        const max = toComparable(maxVal);
        return left !== null && min !== null && max !== null
          ? left >= min && left <= max
          : false;
      }
      return false;
    }
    case "contains":
      return (() => {
        const left = normalizeString(value);
        const right = normalizeString(filterValue);
        return left && right ? left.includes(right) : false;
      })();
    case "starts_with":
      return (() => {
        const left = normalizeString(value);
        const right = normalizeString(filterValue);
        return left && right ? left.startsWith(right) : false;
      })();
    case "ends_with":
      return (() => {
        const left = normalizeString(value);
        const right = normalizeString(filterValue);
        return left && right ? left.endsWith(right) : false;
      })();
    default: {
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
  filters: FilterConfig[],
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
  filters: FilterConfig[],
): Record<string, unknown>[] {
  if (filters.length === 0) return data;
  return data.filter((row) => matchesAllFilters(row, filters));
}

export function isNull(value: unknown): boolean {
  return value === null || value === undefined;
}

export function isNotNull(value: unknown): boolean {
  return value !== null && value !== undefined;
}
