/**
 * Semantic Layer - Public API
 *
 * Dataset and metric configurations for the BI module.
 */

export { DATASETS, getDataset, getDatasetIds, hasDataset } from "./datasets.config";

export { getDatasetFields, getFieldById } from "./field-metadata";

export {
  METRICS,
  getMetric,
  getMetricsForDataset,
  registerMetric,
  type MetricDefinition,
} from "./metrics.config";

export {
  CALCULATED_FIELDS,
  getCalculatedField,
  getCalculatedFieldsForDataset,
  registerCalculatedField,
  type CalculatedField,
} from "./calculated-fields";
