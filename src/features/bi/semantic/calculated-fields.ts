/**
 * Calculated fields for the BI semantic layer.
 */

export interface CalculatedField {
  id: string;
  name: string;
  datasetId: string;
  expression: string;
  description?: string;
}

export const CALCULATED_FIELDS: CalculatedField[] = [];

export function getCalculatedField(id: string): CalculatedField | undefined {
  return CALCULATED_FIELDS.find((field) => field.id === id);
}

export function getCalculatedFieldsForDataset(datasetId: string): CalculatedField[] {
  return CALCULATED_FIELDS.filter((field) => field.datasetId === datasetId);
}

export function registerCalculatedField(field: CalculatedField): void {
  CALCULATED_FIELDS.push(field);
}
