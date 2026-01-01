import type { FilterConfig, PivotMeasure } from "./bi.schemas";
import type { DatasetConfig } from "./bi.types";
import type { PivotMeasureMeta } from "./engine/pivot-aggregator";
import {
  normalizeFilter,
  type AllowedFilterConfig,
  type FilterType,
  type NormalizedFilter,
} from "./engine/filters";

const operatorsByType: Record<FilterType, AllowedFilterConfig["operators"]> = {
  string: [
    "eq",
    "neq",
    "in",
    "not_in",
    "contains",
    "starts_with",
    "ends_with",
    "is_null",
    "is_not_null",
  ],
  enum: ["eq", "neq", "in", "not_in", "is_null", "is_not_null"],
  uuid: ["eq", "neq", "in", "not_in", "is_null", "is_not_null"],
  number: [
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "in",
    "not_in",
    "is_null",
    "is_not_null",
  ],
  date: ["eq", "gt", "gte", "lt", "lte", "between", "is_null", "is_not_null"],
  boolean: ["eq", "neq", "is_null", "is_not_null"],
};

const mapFilterType = (
  dataType: DatasetConfig["fields"][number]["dataType"],
): FilterType | null => {
  switch (dataType) {
    case "datetime":
    case "date":
      return "date";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "enum":
      return "enum";
    case "uuid":
      return "uuid";
    case "string":
      return "string";
    default:
      return null;
  }
};

export const buildAllowedFilters = (
  dataset: DatasetConfig,
): Record<string, AllowedFilterConfig> => {
  return dataset.fields.reduce<Record<string, AllowedFilterConfig>>((acc, field) => {
    if (!field.allowFilter) return acc;
    const type = mapFilterType(field.dataType);
    if (!type) return acc;
    acc[field.id] = {
      type,
      operators: operatorsByType[type],
    };
    return acc;
  }, {});
};

export type NormalizedPivotConfig = {
  rowFields: string[];
  columnFields: string[];
  measures: PivotMeasureMeta[];
  selectedFields: string[];
  filters: NormalizedFilter[];
};

export type NormalizationResult =
  | { ok: true; value: NormalizedPivotConfig }
  | { ok: false; errors: string[] };

export const normalizePivotConfig = (params: {
  dataset: DatasetConfig;
  rows?: string[] | undefined;
  columns?: string[] | undefined;
  measures: PivotMeasure[];
  filters: FilterConfig[];
}): NormalizationResult => {
  const errors: string[] = [];
  const rowFields = Array.from(new Set(params.rows ?? []));
  const columnFields = Array.from(new Set(params.columns ?? []));

  const fieldById = new Map(params.dataset.fields.map((field) => [field.id, field]));

  for (const field of rowFields) {
    const definition = fieldById.get(field);
    if (!definition) {
      errors.push(`Row field '${field}' is not in dataset '${params.dataset.id}'`);
      continue;
    }
    if (!definition.allowGroupBy) {
      errors.push(`Row field '${field}' does not support grouping`);
    }
  }

  for (const field of columnFields) {
    const definition = fieldById.get(field);
    if (!definition) {
      errors.push(`Column field '${field}' is not in dataset '${params.dataset.id}'`);
      continue;
    }
    if (!definition.allowGroupBy) {
      errors.push(`Column field '${field}' does not support grouping`);
    }
  }

  const measures: PivotMeasureMeta[] = params.measures.map((measure) => {
    if (measure.aggregation !== "count" && !measure.field) {
      errors.push("Measures require a field for non-count aggregations.");
    }

    if (measure.field) {
      const definition = fieldById.get(measure.field);
      if (!definition) {
        errors.push(`Measure field '${measure.field}' is not in dataset`);
      } else if (!definition.allowAggregate) {
        errors.push(`Measure field '${measure.field}' does not allow aggregation`);
      }
    }

    const field = measure.field ?? null;
    const key = `${measure.aggregation}:${field ?? "count"}`;
    const label =
      measure.aggregation === "count"
        ? "Count"
        : `${measure.aggregation.toUpperCase()}(${field ?? "-"})`;
    return {
      field,
      aggregation: measure.aggregation,
      key,
      label: measure.label ?? label,
    };
  });

  const measureFields = measures
    .map((measure) => measure.field)
    .filter((field): field is string => Boolean(field));

  const selectedFields = Array.from(
    new Set([...rowFields, ...columnFields, ...measureFields]),
  );

  if (selectedFields.length === 0) {
    const fallback = params.dataset.fields[0]?.id;
    if (fallback) {
      selectedFields.push(fallback);
    } else {
      errors.push("No fields available for pivot query.");
    }
  }

  const allowedFilters = buildAllowedFilters(params.dataset);
  const normalizedFilters: NormalizedFilter[] = [];

  for (const filter of params.filters) {
    try {
      normalizedFilters.push(normalizeFilter(filter, allowedFilters));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Invalid filter");
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      rowFields,
      columnFields,
      measures,
      selectedFields,
      filters: normalizedFilters,
    },
  };
};
