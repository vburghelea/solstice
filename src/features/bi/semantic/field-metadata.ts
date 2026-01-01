/**
 * Field metadata helpers
 */

import type { DatasetField } from "../bi.types";
import { DATASETS } from "./datasets.config";

export function getDatasetFields(datasetId: string): DatasetField[] {
  return DATASETS[datasetId]?.fields ?? [];
}

export function getFieldById(
  datasetId: string,
  fieldId: string,
): DatasetField | undefined {
  return getDatasetFields(datasetId).find((field) => field.id === fieldId);
}
