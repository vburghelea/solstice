import type { ChartType } from "~/features/bi";

export type NlQueryVisualizationSuggestion = {
  chartType: ChartType;
  reason: string;
};

export type NlQueryExecutionResult = {
  results: Array<Record<string, unknown>>;
  rowCount: number;
  suggestedVisualization: NlQueryVisualizationSuggestion | null;
};
