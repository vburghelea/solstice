import type { SemanticCatalog } from "./semantic-layer";

export type CatalogSelection = {
  datasetId: string;
  metrics: string[];
  dimensions?: string[];
  filterDimensions?: string[];
  sortField?: string | null;
};

export type CatalogValidationResult = { ok: true } | { ok: false; errors: string[] };

export const getCatalogDataset = (catalog: SemanticCatalog, datasetId: string) =>
  catalog.datasets.find((dataset) => dataset.id === datasetId);

export const validateCatalogSelection = (
  catalog: SemanticCatalog,
  selection: CatalogSelection,
): CatalogValidationResult => {
  const errors: string[] = [];
  const dataset = getCatalogDataset(catalog, selection.datasetId);

  if (!dataset) {
    return { ok: false, errors: [`Unknown dataset: ${selection.datasetId}`] };
  }

  const metricIds = new Set(dataset.metrics.map((metric) => metric.id));
  const dimensionIds = new Set(dataset.dimensions.map((dimension) => dimension.id));
  const fieldIds = new Set([...metricIds, ...dimensionIds]);

  if (selection.metrics.length === 0) {
    errors.push("At least one metric is required.");
  }

  for (const metricId of selection.metrics) {
    if (!metricIds.has(metricId)) {
      errors.push(`Unknown metric: ${metricId}`);
    }
  }

  for (const dimensionId of selection.dimensions ?? []) {
    if (!dimensionIds.has(dimensionId)) {
      errors.push(`Unknown dimension: ${dimensionId}`);
    }
  }

  for (const dimensionId of selection.filterDimensions ?? []) {
    if (!dimensionIds.has(dimensionId)) {
      errors.push(`Unknown filter dimension: ${dimensionId}`);
    }
  }

  if (selection.sortField && !fieldIds.has(selection.sortField)) {
    errors.push(`Invalid sort field: ${selection.sortField}`);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true };
};
