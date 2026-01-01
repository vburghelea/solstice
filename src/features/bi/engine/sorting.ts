import type { DatasetConfig } from "../bi.types";

export type SortDirection = "asc" | "desc";

export type SortConfig = {
  field: string;
  direction: SortDirection;
};

export const buildAllowedSortFields = (dataset: DatasetConfig) =>
  new Set(dataset.fields.filter((field) => field.allowSort).map((field) => field.id));

export const normalizeSort = (
  sort: SortConfig | null | undefined,
  allowedFields: Set<string>,
): SortConfig | null => {
  if (!sort) return null;
  if (!allowedFields.has(sort.field)) {
    throw new Error(`Sort field '${sort.field}' is not allowed`);
  }
  return {
    field: sort.field,
    direction: sort.direction ?? "asc",
  };
};
