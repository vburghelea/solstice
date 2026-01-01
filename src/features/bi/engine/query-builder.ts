import type { DatasetConfig, DatasetField } from "../bi.types";

export type QueryColumn = {
  fieldId: string;
  sourceColumn: string;
  sourceTable: string;
};

export type DatasetQueryPlan = {
  baseTable: string;
  joins: DatasetConfig["joins"];
  columns: QueryColumn[];
};

const resolveField = (fieldId: string, fields: DatasetField[]) => {
  const field = fields.find((entry) => entry.id === fieldId);
  if (!field) {
    throw new Error(`Unknown field '${fieldId}'`);
  }
  return field;
};

export const buildDatasetQueryPlan = (
  dataset: DatasetConfig,
  selectedFields: string[],
): DatasetQueryPlan => {
  const columns = selectedFields.map((fieldId) => {
    const field = resolveField(fieldId, dataset.fields);
    return {
      fieldId: field.id,
      sourceColumn: field.sourceColumn,
      sourceTable: field.sourceTable ?? dataset.baseTable,
    };
  });

  return {
    baseTable: dataset.baseTable,
    joins: dataset.joins ?? [],
    columns,
  };
};
