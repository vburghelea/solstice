import type { FilterConfig, PivotMeasure, PivotQuery } from "../bi.schemas";
import type { DatasetField } from "../bi.types";
import { DATASETS } from "../semantic";
import { getCatalogDataset } from "./query-validator";
import type { QueryIntent } from "./nl-query.schemas";
import type { SemanticCatalog, SemanticDataset } from "./semantic-layer";

type ResolvedTimeRange = {
  start?: string;
  end?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const addDays = (date: Date, days: number) => new Date(date.getTime() + days * DAY_MS);

const resolvePresetRange = (preset: string, now: Date): ResolvedTimeRange | null => {
  const today = startOfUtcDay(now);

  switch (preset) {
    case "last_7_days":
      return { start: toIsoDate(addDays(today, -7)), end: toIsoDate(today) };
    case "last_30_days":
      return { start: toIsoDate(addDays(today, -30)), end: toIsoDate(today) };
    case "last_year":
      return { start: toIsoDate(addDays(today, -365)), end: toIsoDate(today) };
    case "ytd": {
      const start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      return { start: toIsoDate(start), end: toIsoDate(today) };
    }
    case "all_time":
      return null;
    default:
      return null;
  }
};

const resolveTimeRange = (
  intent: QueryIntent,
  now: Date = new Date(),
): ResolvedTimeRange | null => {
  const timeRange = intent.timeRange;
  if (!timeRange) return null;

  if (timeRange.preset) {
    return resolvePresetRange(timeRange.preset, now);
  }

  if (!timeRange.start && !timeRange.end) return null;
  const resolved: ResolvedTimeRange = {};
  if (timeRange.start) {
    resolved.start = timeRange.start;
  }
  if (timeRange.end) {
    resolved.end = timeRange.end;
  }
  return resolved;
};

const isTemporalField = (field: DatasetField) =>
  field.dataType === "date" || field.dataType === "datetime";

const resolveTimeFieldId = (
  dataset: SemanticDataset,
  intent: QueryIntent,
): string | null => {
  const datasetConfig = DATASETS[dataset.id];
  if (!datasetConfig) return null;

  const accessibleDimensionIds = new Set(
    dataset.dimensions.map((dimension) => dimension.id),
  );
  const candidates = datasetConfig.fields.filter(
    (field) =>
      accessibleDimensionIds.has(field.id) && isTemporalField(field) && field.allowFilter,
  );

  for (const dimensionId of intent.dimensions ?? []) {
    if (candidates.some((field) => field.id === dimensionId)) {
      return dimensionId;
    }
  }

  const preferredIds = ["createdAt", "submittedAt", "updatedAt", "startDate", "endDate"];
  for (const preferred of preferredIds) {
    if (candidates.some((field) => field.id === preferred)) {
      return preferred;
    }
  }

  return candidates[0]?.id ?? null;
};

const buildTimeFilters = (
  intent: QueryIntent,
  dataset: SemanticDataset,
): FilterConfig[] => {
  const range = resolveTimeRange(intent);
  if (!range) return [];

  const fieldId = resolveTimeFieldId(dataset, intent);
  if (!fieldId) return [];

  if (range.start && range.end) {
    return [
      {
        field: fieldId,
        datasetId: dataset.id,
        operator: "between",
        value: [range.start, range.end],
      },
    ];
  }

  if (range.start) {
    return [
      {
        field: fieldId,
        datasetId: dataset.id,
        operator: "gte",
        value: range.start,
      },
    ];
  }

  if (range.end) {
    return [
      {
        field: fieldId,
        datasetId: dataset.id,
        operator: "lte",
        value: range.end,
      },
    ];
  }

  return [];
};

const buildMeasures = (dataset: SemanticDataset, metricIds: string[]): PivotMeasure[] => {
  const metricsById = new Map(dataset.metrics.map((metric) => [metric.id, metric]));

  return metricIds.map((metricId) => {
    const metric = metricsById.get(metricId);
    if (!metric) {
      throw new Error(`Unknown metric: ${metricId}`);
    }

    const measure: PivotMeasure = {
      aggregation: metric.aggregation,
      ...(metric.source === "metric" ? { metricId: metric.id } : {}),
      ...(metric.fieldId ? { field: metric.fieldId } : {}),
      ...(metric.name ? { label: metric.name } : {}),
    };

    return measure;
  });
};

const buildFilters = (intent: QueryIntent, datasetId: string): FilterConfig[] =>
  intent.filters.map((filter) => ({
    field: filter.dimensionId,
    datasetId,
    operator: filter.operator,
    value: filter.value,
  }));

export const translateIntentToPivotQuery = (
  intent: QueryIntent,
  catalog: SemanticCatalog,
  organizationId?: string | null,
): PivotQuery => {
  const dataset = getCatalogDataset(catalog, intent.datasetId);
  if (!dataset) {
    throw new Error(`Unknown dataset: ${intent.datasetId}`);
  }

  const measures = buildMeasures(dataset, intent.metrics);
  const filters = [
    ...buildFilters(intent, dataset.id),
    ...buildTimeFilters(intent, dataset),
  ];

  return {
    datasetId: dataset.id,
    organizationId: organizationId ?? undefined,
    rows: intent.dimensions ?? [],
    columns: [],
    measures,
    filters,
    limit: Math.min(intent.limit ?? 1000, 10_000),
  };
};
