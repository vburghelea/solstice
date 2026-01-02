import type { ChartType, PivotMeasure } from "../bi.schemas";
import type { DatasetField } from "../bi.types";

export interface ChartSuggestion {
  chartType: ChartType;
  reason: string;
}

const isTemporalField = (field?: DatasetField) =>
  field?.dataType === "date" || field?.dataType === "datetime";

export const suggestChartType = (params: {
  rows: string[];
  columns: string[];
  measures: PivotMeasure[];
  fieldsById: Map<string, DatasetField>;
}): ChartSuggestion | null => {
  const { rows, columns, measures, fieldsById } = params;
  const dimensionCount = rows.length + columns.length;

  if (dimensionCount === 0) {
    return {
      chartType: "table",
      reason: "Single total is best shown in a table or KPI.",
    };
  }

  if (rows.length === 1 && columns.length === 0) {
    const rowField = fieldsById.get(rows[0] ?? "");
    if (isTemporalField(rowField)) {
      return {
        chartType: "line",
        reason: "Time-based fields are easiest to read as a trend line.",
      };
    }
    if (measures.length === 1) {
      return {
        chartType: "bar",
        reason: "Single breakdowns are clearest as bars.",
      };
    }
    return {
      chartType: "bar",
      reason: "Multiple measures compare well in grouped bars.",
    };
  }

  if (rows.length === 0 && columns.length === 1) {
    const columnField = fieldsById.get(columns[0] ?? "");
    if (isTemporalField(columnField)) {
      return {
        chartType: "line",
        reason: "Time-based fields are easiest to read as a trend line.",
      };
    }
    return {
      chartType: "bar",
      reason: "Single breakdowns are clearest as bars.",
    };
  }

  if (rows.length === 1 && columns.length === 1) {
    return {
      chartType: "heatmap",
      reason: "Two dimensions read well as a heatmap grid.",
    };
  }

  return {
    chartType: "table",
    reason: "Complex pivots are easiest to scan in a table.",
  };
};
