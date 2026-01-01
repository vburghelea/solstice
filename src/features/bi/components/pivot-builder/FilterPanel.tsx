import type { DatasetField } from "../../bi.types";
import type { FilterConfig } from "../../bi.schemas";
import { FilterBuilder } from "../filters/FilterBuilder";

export function FilterPanel({
  fields,
  filters,
  onChange,
}: {
  fields: DatasetField[];
  filters: FilterConfig[];
  onChange: (next: FilterConfig[]) => void;
}) {
  return <FilterBuilder fields={fields} filters={filters} onChange={onChange} />;
}
