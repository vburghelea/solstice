import { useMemo } from "react";
import type { FilterConfig } from "../../bi.schemas";
import type { DatasetField } from "../../bi.types";
import { FilterBuilder } from "../filters/FilterBuilder";

type FilterFieldLabel = {
  name: string;
  datasetName?: string;
};

const buildFieldKey = (field: string, datasetId?: string | null) =>
  `${datasetId ?? "any"}::${field}`;

const renderFilterLabel = (
  filter: FilterConfig,
  fieldMap: Map<string, FilterFieldLabel>,
) => {
  const field =
    fieldMap.get(buildFieldKey(filter.field, filter.datasetId)) ??
    fieldMap.get(buildFieldKey(filter.field, null));
  const fieldName = field?.name ?? filter.field;
  const datasetPrefix = field?.datasetName ? `${field.datasetName} - ` : "";
  const value = Array.isArray(filter.value)
    ? filter.value.join(", ")
    : (filter.value ?? "");
  return `${datasetPrefix}${fieldName} ${filter.operator} ${value}`.trim();
};

export function DashboardFilters({
  fields,
  fieldOptions,
  filters,
  editable,
  onChange,
}: {
  fields?: DatasetField[];
  fieldOptions?: Array<{
    key: string;
    field: DatasetField;
    datasetId?: string;
    datasetName?: string;
  }>;
  filters: FilterConfig[];
  editable?: boolean;
  onChange?: (next: FilterConfig[]) => void;
}) {
  const fieldMap = useMemo(() => {
    const map = new Map<string, FilterFieldLabel>();
    for (const option of fieldOptions ?? []) {
      map.set(buildFieldKey(option.field.id, option.datasetId), {
        name: option.field.name,
        ...(option.datasetName ? { datasetName: option.datasetName } : {}),
      });
    }
    for (const field of fields ?? []) {
      map.set(buildFieldKey(field.id, null), { name: field.name });
    }
    return map;
  }, [fieldOptions, fields]);

  if (editable && onChange) {
    return (
      <FilterBuilder
        {...(fields ? { fields } : {})}
        {...(fieldOptions ? { fieldOptions } : {})}
        filters={filters}
        onChange={onChange}
      />
    );
  }

  if (filters.length === 0) {
    return (
      <div className="text-muted-foreground text-xs">No global filters applied.</div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {filters.map((filter, index) => (
        <span
          key={`${filter.field}-${index}`}
          className="rounded-full border bg-muted px-2 py-1"
        >
          {renderFilterLabel(filter, fieldMap)}
        </span>
      ))}
    </div>
  );
}
