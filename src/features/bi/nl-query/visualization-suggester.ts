import { suggestChartType } from "../utils/chart-suggestion";
import { DATASETS } from "../semantic";
import type { ChartSuggestion } from "../utils/chart-suggestion";
import type { QueryIntent } from "./nl-query.schemas";
import { translateIntentToPivotQuery } from "./intent-translator";
import { getCatalogDataset } from "./query-validator";
import type { SemanticCatalog } from "./semantic-layer";

export const suggestVisualization = (
  intent: QueryIntent,
  catalog: SemanticCatalog,
): ChartSuggestion | null => {
  const dataset = getCatalogDataset(catalog, intent.datasetId);
  if (!dataset) return null;

  const datasetConfig = DATASETS[dataset.id];
  if (!datasetConfig) return null;

  const pivotQuery = translateIntentToPivotQuery(intent, catalog);
  const fieldsById = new Map(datasetConfig.fields.map((field) => [field.id, field]));

  return suggestChartType({
    rows: pivotQuery.rows,
    columns: pivotQuery.columns,
    measures: pivotQuery.measures,
    fieldsById,
  });
};
