import type { AggregationType } from "~/features/bi/bi.schemas";
import type { DatasetConfig, DatasetField, QueryContext } from "~/features/bi/bi.types";
import { filterAccessibleFields } from "~/features/bi/governance";
import { DATASETS } from "~/features/bi/semantic";
import type { MetricDefinition } from "~/features/bi/semantic/metrics.config";
import { METRICS } from "~/features/bi/semantic/metrics.config";

export type SemanticMetric = {
  id: string;
  name: string;
  description: string;
  aggregation: AggregationType;
  fieldId: string | null;
  datasetId: string;
  source: "metric" | "field";
};

export type SemanticDimension = {
  id: string;
  name: string;
  description: string;
  fieldId: string;
  datasetId: string;
  type: DatasetField["dataType"];
  values?: string[];
};

export type SemanticDataset = {
  id: string;
  name: string;
  description: string;
  metrics: SemanticMetric[];
  dimensions: SemanticDimension[];
};

export type SemanticCatalog = {
  datasets: SemanticDataset[];
};

const hasPermission = (permissions: Set<string>, required?: string) => {
  if (!required) return true;
  return (
    permissions.has(required) ||
    permissions.has("analytics.admin") ||
    permissions.has("*")
  );
};

const filterDatasetsForContext = (
  datasets: DatasetConfig[],
  context: QueryContext,
): DatasetConfig[] =>
  datasets.filter((dataset) => {
    if (context.isGlobalAdmin) return true;
    if (!dataset.allowedRoles || dataset.allowedRoles.length === 0) return true;
    if (!context.orgRole) return false;
    return dataset.allowedRoles.includes(context.orgRole);
  });

const resolveFieldAggregation = (field: DatasetField): AggregationType => {
  if (field.defaultAggregation) return field.defaultAggregation;
  return field.dataType === "number" ? "sum" : "count";
};

const buildFieldMetrics = (fields: DatasetField[], datasetId: string): SemanticMetric[] =>
  fields
    .filter((field) => field.allowAggregate)
    .map((field) => ({
      id: field.id,
      name: field.name,
      description: field.description ?? field.name,
      aggregation: resolveFieldAggregation(field),
      fieldId: field.id,
      datasetId,
      source: "field",
    }));

const buildMetricDefinitions = (
  definitions: MetricDefinition[],
  fieldsById: Map<string, DatasetField>,
  permissions: Set<string>,
): SemanticMetric[] =>
  definitions
    .filter((metric) => hasPermission(permissions, metric.requiredPermission))
    .filter((metric) => {
      if (!metric.fieldId) return true;
      return fieldsById.has(metric.fieldId);
    })
    .map((metric) => ({
      id: metric.id,
      name: metric.name,
      description: metric.description ?? metric.name,
      aggregation: metric.aggregation ?? "count",
      fieldId: metric.fieldId ?? null,
      datasetId: metric.datasetId,
      source: "metric",
    }));

const buildDimensions = (
  fields: DatasetField[],
  datasetId: string,
): SemanticDimension[] =>
  fields
    .filter((field) => field.allowGroupBy && field.dataType !== "json")
    .map((field) => {
      const values = field.enumValues?.map((entry) => entry.value);
      return {
        id: field.id,
        name: field.name,
        description: field.description ?? field.name,
        fieldId: field.id,
        datasetId,
        type: field.dataType,
        ...(values ? { values } : {}),
      };
    });

const dedupeMetrics = (metrics: SemanticMetric[]) => {
  const seen = new Set<string>();
  return metrics.filter((metric) => {
    if (seen.has(metric.id)) return false;
    seen.add(metric.id);
    return true;
  });
};

export const buildNlCatalog = (context: QueryContext): SemanticCatalog => {
  const datasets = filterDatasetsForContext(Object.values(DATASETS), context);

  return {
    datasets: datasets.map((dataset) => {
      const accessibleFields = filterAccessibleFields(dataset.fields, context);
      const fieldsById = new Map(accessibleFields.map((field) => [field.id, field]));
      const metricDefinitions = METRICS.filter(
        (metric) => metric.datasetId === dataset.id,
      );

      const metrics = dedupeMetrics([
        ...buildMetricDefinitions(metricDefinitions, fieldsById, context.permissions),
        ...buildFieldMetrics(accessibleFields, dataset.id),
      ]);
      const dimensions = buildDimensions(accessibleFields, dataset.id);

      return {
        id: dataset.id,
        name: dataset.name,
        description: dataset.description ?? "",
        metrics,
        dimensions,
      };
    }),
  };
};

export const buildCatalogPrompt = (catalog: SemanticCatalog) => {
  const metrics = catalog.datasets
    .flatMap((dataset) =>
      dataset.metrics.map((metric) => {
        const label = `${metric.name} (${metric.aggregation})`;
        return `- [${dataset.id}] ${metric.id}: ${label}`;
      }),
    )
    .join("\n");

  const dimensions = catalog.datasets
    .flatMap((dataset) =>
      dataset.dimensions.map((dimension) => {
        const label = `${dimension.name} (${dimension.type})`;
        return `- [${dataset.id}] ${dimension.id}: ${label}`;
      }),
    )
    .join("\n");

  return { metrics, dimensions };
};
