import type { FilterConfig, PivotQuery } from "~/features/bi/bi.schemas";
import { getDataset } from "~/features/bi/semantic";

export const mergeDashboardFilters = (
  query: PivotQuery | null | undefined,
  globalFilters: FilterConfig[],
): { query: PivotQuery | null; ignoredFilters: FilterConfig[] } => {
  if (!query) return { query: null, ignoredFilters: [] };

  const baseFilters = query.filters ?? [];
  if (globalFilters.length === 0) {
    return { query: { ...query, filters: baseFilters }, ignoredFilters: [] };
  }

  const dataset = getDataset(query.datasetId);
  if (!dataset) {
    return { query: { ...query, filters: baseFilters }, ignoredFilters: [] };
  }

  const allowedFields = new Set(dataset.fields.map((field) => field.id));
  const applicableFilters: FilterConfig[] = [];
  const ignoredFilters: FilterConfig[] = [];

  for (const filter of globalFilters) {
    if (filter.datasetId && filter.datasetId !== query.datasetId) {
      ignoredFilters.push(filter);
      continue;
    }
    if (!allowedFields.has(filter.field)) {
      ignoredFilters.push(filter);
      continue;
    }
    applicableFilters.push(filter);
  }

  return {
    query: { ...query, filters: [...baseFilters, ...applicableFilters] },
    ignoredFilters,
  };
};
