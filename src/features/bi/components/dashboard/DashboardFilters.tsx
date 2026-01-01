import { useMemo } from "react";
import type { FilterConfig } from "../../bi.schemas";
import type { DatasetField } from "../../bi.types";
import { FilterBuilder } from "../filters/FilterBuilder";

const renderFilterLabel = (filter: FilterConfig, fieldMap: Map<string, DatasetField>) => {
  const field = fieldMap.get(filter.field);
  const fieldName = field?.name ?? filter.field;
  const value = Array.isArray(filter.value)
    ? filter.value.join(", ")
    : (filter.value ?? "");
  return `${fieldName} ${filter.operator} ${value}`.trim();
};

export function DashboardFilters({
  fields,
  filters,
  editable,
  onChange,
}: {
  fields?: DatasetField[];
  filters: FilterConfig[];
  editable?: boolean;
  onChange?: (next: FilterConfig[]) => void;
}) {
  const fieldMap = useMemo(() => {
    const map = new Map<string, DatasetField>();
    for (const field of fields ?? []) {
      map.set(field.id, field);
    }
    return map;
  }, [fields]);

  if (editable && fields && onChange) {
    return <FilterBuilder fields={fields} filters={filters} onChange={onChange} />;
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
