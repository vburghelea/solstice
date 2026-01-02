import type {
  EChartsOption,
  LegendComponentOption,
  SeriesOption,
  TooltipComponentFormatterCallback,
  TooltipComponentFormatterCallbackParams,
  TooltipComponentOption,
} from "echarts/types/dist/option";
import type { ChartType, PivotResult } from "../../bi.schemas";
import type { ChartOptions, DatasetField } from "../../bi.types";
import {
  buildMeasureFormatters,
  formatDimensionValue,
  formatMeasureValue,
} from "../../utils/formatting";
import { COLOR_SCHEMES } from "../../utils/color-schemes";
import { extractNumericValue } from "../../utils/chart-values";

const formatDimensionLabel = (
  values: Record<string, string>,
  fieldsById: Map<string, DatasetField> | undefined,
  fallback: string,
) => {
  const entries = Object.entries(values);
  if (entries.length === 0) return fallback;
  if (entries.length === 1 && fieldsById) {
    const [fieldId, value] = entries[0];
    const field = fieldsById.get(fieldId);
    return formatDimensionValue(value, field);
  }
  return entries
    .map(([fieldId, value]) => {
      if (!fieldsById) return `${fieldId}: ${value || "-"}`;
      const field = fieldsById.get(fieldId);
      const label = field?.name ?? fieldId;
      return `${label}: ${formatDimensionValue(value, field)}`;
    })
    .join(" / ");
};

const sumValues = (values: Array<number | null>) => {
  const numericValues = values.filter(
    (value): value is number => typeof value === "number",
  );
  if (numericValues.length === 0) return null;
  return numericValues.reduce<number>((acc, value) => acc + value, 0);
};

const resolveColorScheme = (schemeId?: string) => {
  if (!schemeId) return COLOR_SCHEMES[0];
  return COLOR_SCHEMES.find((scheme) => scheme.id === schemeId) ?? COLOR_SCHEMES[0];
};

const isTemporalField = (field?: DatasetField) =>
  field?.dataType === "date" || field?.dataType === "datetime";

export const transformPivotToChart = (params: {
  pivot: PivotResult;
  chartType: ChartType;
  measureKey: string;
  chartOptions?: ChartOptions;
  fieldsById?: Map<string, DatasetField>;
}): EChartsOption | null => {
  const { pivot, chartType, measureKey, chartOptions, fieldsById } = params;
  const rowLabels = pivot.rows.map((row) =>
    formatDimensionLabel(
      row.values,
      fieldsById,
      pivot.rowFields.length === 0 ? "Total" : "",
    ),
  );
  const columnLabels = pivot.columnKeys.map((column) =>
    formatDimensionLabel(column.values, fieldsById, column.label),
  );

  const matrix = pivot.rows.map((row) =>
    pivot.columnKeys.map((column) => row.cells[column.key]?.[measureKey] ?? null),
  );

  const formatterMap = fieldsById
    ? buildMeasureFormatters(pivot.measures, fieldsById)
    : undefined;
  const formatValue = (value: number | null) => {
    const formatter = formatterMap?.get(measureKey);
    return formatter ? formatter(value) : formatMeasureValue(value, "number", undefined);
  };

  const colorScheme = resolveColorScheme(chartOptions?.colorSchemeId);
  const legendPosition = chartOptions?.legendPosition ?? "top";
  const showLegend = chartOptions?.showLegend !== false;
  const showLabels = chartOptions?.showLabels === true;
  const legendPlacement: Partial<LegendComponentOption> = {};
  if (legendPosition === "top") legendPlacement.top = 8;
  if (legendPosition === "bottom") legendPlacement.bottom = 8;
  if (legendPosition === "left") legendPlacement.left = 8;
  if (legendPosition === "right") legendPlacement.right = 8;
  const legendOrient =
    legendPosition === "left" || legendPosition === "right" ? "vertical" : "horizontal";
  const buildLegend = (data?: string[]): LegendComponentOption => ({
    show: showLegend,
    orient: legendOrient,
    ...(data ? { data } : {}),
    ...legendPlacement,
  });

  const rowField = fieldsById?.get(pivot.rowFields[0] ?? "");
  const shouldSortByValue =
    !isTemporalField(rowField) &&
    pivot.columnKeys.length <= 1 &&
    (chartType === "bar" || chartType === "pie" || chartType === "donut");

  let orderedRowLabels = rowLabels;
  let orderedMatrix = matrix;
  let orderedRows = pivot.rows;
  const emptyRow = { key: "__missing__", values: {}, cells: {} };

  if (shouldSortByValue) {
    const indices = rowLabels.map((_, index) => index);
    indices.sort((a, b) => {
      const left = matrix[a]?.[0] ?? 0;
      const right = matrix[b]?.[0] ?? 0;
      return right - left;
    });
    orderedRowLabels = indices.map((index) => rowLabels[index] ?? "");
    orderedMatrix = indices.map((index) => matrix[index] ?? []);
    orderedRows = indices.map((index) => pivot.rows[index] ?? emptyRow);
  }

  if (chartType === "pie" || chartType === "donut") {
    const innerRadius = chartType === "donut" ? (chartOptions?.donutRadius ?? 40) : 0;
    const tooltipFormatter: TooltipComponentFormatterCallback<
      TooltipComponentFormatterCallbackParams
    > = (params: TooltipComponentFormatterCallbackParams) => {
      const payload = Array.isArray(params) ? params[0] : params;
      const name =
        payload && typeof payload === "object" && "name" in payload
          ? String(payload.name ?? "")
          : "";
      const value =
        payload && typeof payload === "object" && "value" in payload
          ? extractNumericValue(payload.value)
          : null;
      return `${name}: ${formatValue(value)}`;
    };
    const data = orderedRowLabels
      .map((label, index) => {
        const value = sumValues(orderedMatrix[index] ?? []);
        if (value === null) return null;
        return {
          name: label || "Total",
          value,
          rowValues: orderedRows[index]?.values ?? {},
        };
      })
      .filter(
        (
          entry,
        ): entry is { name: string; value: number; rowValues: Record<string, string> } =>
          Boolean(entry),
      );
    return {
      color: colorScheme.colors,
      tooltip: {
        trigger: "item",
        formatter: tooltipFormatter,
      } as TooltipComponentOption,
      legend: buildLegend(data.map((entry) => entry.name)),
      series: [
        {
          type: "pie",
          radius: chartType === "donut" ? [`${innerRadius}%`, "70%"] : "65%",
          label: { show: showLabels },
          data,
        },
      ] as SeriesOption[],
    };
  }

  if (chartType === "heatmap") {
    const data: Array<{
      value: [number, number, number | null];
      rowValues: Record<string, string>;
      columnValues: Record<string, string>;
    }> = [];
    orderedMatrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        data.push({
          value: [colIndex, rowIndex, value],
          rowValues: orderedRows[rowIndex]?.values ?? {},
          columnValues: pivot.columnKeys[colIndex]?.values ?? {},
        });
      });
    });

    const tooltipFormatter: TooltipComponentFormatterCallback<
      TooltipComponentFormatterCallbackParams
    > = (params: TooltipComponentFormatterCallbackParams) => {
      const payload = Array.isArray(params) ? params[0] : params;
      if (!payload || typeof payload !== "object" || !("value" in payload)) {
        return "";
      }
      const value = Array.isArray(payload.value) ? payload.value : [];
      const rowIndex = typeof value[1] === "number" ? value[1] : 0;
      const columnIndex = typeof value[0] === "number" ? value[0] : 0;
      const metricValue = typeof value[2] === "number" ? value[2] : null;
      return `${orderedRowLabels[rowIndex] ?? ""} / ${
        columnLabels[columnIndex] ?? ""
      }: ${formatValue(metricValue)}`;
    };
    const numericValues = data
      .map((item) => item.value[2])
      .filter((value): value is number => typeof value === "number");
    const maxValue = numericValues.length > 0 ? Math.max(...numericValues) : 1;

    return {
      color: colorScheme.colors,
      tooltip: {
        position: "top",
        formatter: tooltipFormatter,
      } as TooltipComponentOption,
      grid: { height: "70%", top: "10%" },
      xAxis: { type: "category", data: columnLabels },
      yAxis: { type: "category", data: orderedRowLabels },
      visualMap: {
        min: 0,
        max: maxValue,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "2%",
      },
      series: [
        {
          type: "heatmap",
          label: { show: showLabels },
          data,
          emphasis: {
            itemStyle: { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.3)" },
          },
        },
      ] as SeriesOption[],
    };
  }

  if (chartType === "scatter") {
    const data = orderedRowLabels.map((label, index) => {
      const value = sumValues(orderedMatrix[index] ?? []);
      if (value === null) return null;
      return {
        value: [index, value, label],
        rowValues: orderedRows[index]?.values ?? {},
      };
    });
    const tooltipFormatter: TooltipComponentFormatterCallback<
      TooltipComponentFormatterCallbackParams
    > = (params: TooltipComponentFormatterCallbackParams) => {
      const payload = Array.isArray(params) ? params[0] : params;
      if (!payload || typeof payload !== "object" || !("value" in payload)) {
        return "";
      }
      const value = Array.isArray(payload.value) ? payload.value : [];
      const label = typeof value[2] === "string" ? value[2] : "";
      const metricValue = typeof value[1] === "number" ? value[1] : null;
      return `${label}: ${formatValue(metricValue)}`;
    };

    return {
      color: colorScheme.colors,
      tooltip: {
        trigger: "item",
        formatter: tooltipFormatter,
      } as TooltipComponentOption,
      xAxis: { type: "category", data: orderedRowLabels },
      yAxis: { type: "value" },
      series: [
        {
          type: "scatter",
          data: data.filter(Boolean) as Array<{
            value: [number, number, string];
            rowValues: Record<string, string>;
          }>,
        },
      ] as SeriesOption[],
    };
  }

  if (chartType === "bar" || chartType === "line" || chartType === "area") {
    const series = columnLabels.map(
      (label, index): SeriesOption => ({
        name: label,
        type: chartType === "area" ? "line" : chartType,
        ...(chartType === "area" ? { areaStyle: {} } : {}),
        ...(chartType !== "bar" && chartOptions?.smoothLines === true
          ? { smooth: true }
          : {}),
        ...(chartOptions?.stacked ? { stack: "total" } : {}),
        label: { show: showLabels },
        data: orderedMatrix.map((row, rowIndex) => ({
          value: row[index] ?? null,
          rowValues: orderedRows[rowIndex]?.values ?? {},
          columnValues: pivot.columnKeys[index]?.values ?? {},
        })),
      }),
    );
    const tooltipFormatter: TooltipComponentFormatterCallback<
      TooltipComponentFormatterCallbackParams
    > = (params: TooltipComponentFormatterCallbackParams) => {
      const items = Array.isArray(params) ? params : [params];
      if (items.length === 0) return "";
      const axisValue = String(
        items[0] && typeof items[0] === "object" && "axisValue" in items[0]
          ? (items[0].axisValue ?? "")
          : "",
      );
      const rows = items
        .map((item) => {
          if (!item || typeof item !== "object") return "";
          const name = "seriesName" in item ? String(item.seriesName ?? "") : "";
          const value = "value" in item ? extractNumericValue(item.value) : null;
          return `${name}: ${formatValue(value)}`;
        })
        .filter(Boolean)
        .join("<br />");
      return `${axisValue}<br />${rows}`;
    };

    return {
      color: colorScheme.colors,
      tooltip: {
        trigger: "axis",
        formatter: tooltipFormatter,
      } as TooltipComponentOption,
      legend: buildLegend(columnLabels),
      xAxis: { type: "category", data: orderedRowLabels },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value: number) => formatValue(value),
        },
      },
      series: series as SeriesOption[],
    };
  }

  return null;
};

export const buildPivotChartOptions = (
  pivot: PivotResult,
  chartType: ChartType,
  measureKey: string,
  chartOptions?: ChartOptions,
  fieldsById?: Map<string, DatasetField>,
) => {
  const params = {
    pivot,
    chartType,
    measureKey,
    ...(chartOptions ? { chartOptions } : {}),
    ...(fieldsById ? { fieldsById } : {}),
  };
  return transformPivotToChart(params);
};
