import { badRequest } from "~/lib/server/errors";
import type { JsonRecord } from "~/shared/lib/json";
import {
  DATA_SOURCE_CONFIG,
  type DataSourceConfig,
  type FilterOperator,
  type FilterType,
  type ReportDataSource,
  type SortDirection,
} from "./reports.config";

export type NormalizedFilter = {
  operator: FilterOperator;
  value: unknown;
};

export type NormalizedFilters = Record<string, NormalizedFilter>;

export type NormalizedSort = {
  field: string;
  direction: SortDirection;
};

export type NormalizedReportQuery = {
  dataSource: ReportDataSource;
  columns: string[];
  filters: NormalizedFilters;
  sort: NormalizedSort | null;
};

const ensureObject = (value: unknown, label: string) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`${label} must be an object`);
  }
};

const coerceString = (value: unknown, label: string) => {
  if (typeof value !== "string" || !value.trim()) {
    throw badRequest(`${label} must be a non-empty string`);
  }
  return value;
};

const coerceNumber = (value: unknown, label: string) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw badRequest(`${label} must be a number`);
  }
  return parsed;
};

const coerceBoolean = (value: unknown, label: string) => {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  throw badRequest(`${label} must be a boolean`);
};

const coerceDate = (value: unknown, label: string) => {
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`${label} must be a valid date`);
  }
  return date;
};

const coerceValue = (value: unknown, type: FilterType, label: string) => {
  switch (type) {
    case "string":
    case "uuid":
    case "enum":
      return coerceString(value, label);
    case "number":
      return coerceNumber(value, label);
    case "boolean":
      return coerceBoolean(value, label);
    case "date":
      return coerceDate(value, label);
    default:
      return value;
  }
};

const normalizeFilterValue = (
  rawValue: unknown,
  type: FilterType,
  operator: FilterOperator,
  label: string,
) => {
  if (operator === "in") {
    if (!Array.isArray(rawValue) || rawValue.length === 0) {
      throw badRequest(`${label} must be a non-empty array`);
    }
    return rawValue.map((value) => coerceValue(value, type, label));
  }

  if (operator === "between") {
    if (!Array.isArray(rawValue) || rawValue.length !== 2) {
      throw badRequest(`${label} must be a [start, end] array`);
    }
    return rawValue.map((value) => coerceValue(value, type, label));
  }

  if (Array.isArray(rawValue)) {
    throw badRequest(`${label} must be a single value`);
  }

  return coerceValue(rawValue, type, label);
};

const normalizeColumns = (columns: string[] | undefined, config: DataSourceConfig) => {
  if (!columns || columns.length === 0) {
    return [...config.allowedColumns];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const column of columns) {
    if (!config.allowedColumns.includes(column)) {
      throw badRequest(`Column "${column}" not allowed`);
    }
    if (!seen.has(column)) {
      seen.add(column);
      normalized.push(column);
    }
  }

  if (normalized.length === 0) {
    throw badRequest("No valid columns provided");
  }

  return normalized;
};

const normalizeFilters = (filters: JsonRecord | undefined, config: DataSourceConfig) => {
  if (!filters) return {};
  ensureObject(filters, "Filters");

  const normalized: NormalizedFilters = {};

  for (const [field, rawValue] of Object.entries(filters)) {
    if (rawValue === undefined) continue;

    const filterConfig = config.allowedFilters[field];
    if (!filterConfig) {
      throw badRequest(`Filter on "${field}" not allowed`);
    }

    let operator: FilterOperator = "eq";
    let value: unknown = rawValue;

    if (
      rawValue &&
      typeof rawValue === "object" &&
      !Array.isArray(rawValue) &&
      "operator" in rawValue &&
      "value" in rawValue
    ) {
      operator = String((rawValue as { operator: unknown }).operator) as FilterOperator;
      value = (rawValue as { value: unknown }).value;
    } else if (Array.isArray(rawValue)) {
      operator = "in";
      value = rawValue;
    }

    if (!filterConfig.operators.includes(operator)) {
      throw badRequest(`Operator "${operator}" not allowed for "${field}"`);
    }

    const normalizedValue = normalizeFilterValue(
      value,
      filterConfig.type,
      operator,
      `Filter "${field}"`,
    );

    normalized[field] = { operator, value: normalizedValue };
  }

  return normalized;
};

const normalizeSort = (sort: JsonRecord | undefined, config: DataSourceConfig) => {
  if (!sort) return null;
  ensureObject(sort, "Sort");

  let field: string | undefined;
  let direction: string | undefined;

  if ("field" in sort || "direction" in sort) {
    field = typeof sort["field"] === "string" ? sort["field"] : undefined;
    direction = typeof sort["direction"] === "string" ? sort["direction"] : undefined;
  } else {
    const entries = Object.entries(sort);
    if (entries.length !== 1) {
      throw badRequest("Sort must specify a single field");
    }
    field = entries[0]?.[0];
    direction = typeof entries[0]?.[1] === "string" ? entries[0][1] : undefined;
  }

  if (!field) {
    throw badRequest("Sort field is required");
  }

  if (!config.allowedSorts.includes(field)) {
    throw badRequest(`Sort on "${field}" not allowed`);
  }

  const normalizedDirection = direction?.toLowerCase() as SortDirection;
  if (normalizedDirection !== "asc" && normalizedDirection !== "desc") {
    throw badRequest('Sort direction must be "asc" or "desc"');
  }

  return { field, direction: normalizedDirection };
};

export const normalizeReportQuery = (params: {
  dataSource: string;
  columns?: string[] | undefined;
  filters?: JsonRecord | undefined;
  sort?: JsonRecord | undefined;
}): NormalizedReportQuery => {
  const dataSource = params.dataSource as ReportDataSource;
  const config = DATA_SOURCE_CONFIG[dataSource];
  if (!config) {
    throw badRequest(`Invalid data source: ${params.dataSource}`);
  }

  return {
    dataSource,
    columns: normalizeColumns(params.columns, config),
    filters: normalizeFilters(params.filters, config),
    sort: normalizeSort(params.sort, config),
  };
};
