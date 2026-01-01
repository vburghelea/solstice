import type { FilterConfig, PivotQuery } from "~/features/bi/bi.schemas";
import { getDataset } from "~/features/bi/semantic";

export const mergeDashboardFilters = (
  query: PivotQuery | null | undefined,
  globalFilters: FilterConfig[],
): PivotQuery | null => {
  if (!query) return null;

  const baseFilters = query.filters ?? [];
  if (globalFilters.length === 0) {
    return { ...query, filters: baseFilters };
  }

  const dataset = getDataset(query.datasetId);
  if (!dataset) {
    return { ...query, filters: baseFilters };
  }

  const allowedFields = new Set(dataset.fields.map((field) => field.id));
  const applicableFilters = globalFilters.filter((filter) =>
    allowedFields.has(filter.field),
  );

  return { ...query, filters: [...baseFilters, ...applicableFilters] };
};
