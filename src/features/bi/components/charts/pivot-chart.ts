import type { ChartType, PivotResult } from "../../bi.schemas";

const joinLabel = (values: Record<string, string>, fallback: string) => {
  const entries = Object.entries(values);
  if (entries.length === 0) return fallback;
  return entries.map(([field, value]) => `${field}: ${value || "-"}`).join(" / ");
};

const sumValues = (values: Array<number | null>) =>
  values.reduce<number>((acc, value) => acc + (value ?? 0), 0);

export const buildPivotChartOptions = (
  pivot: PivotResult,
  chartType: ChartType,
  measureKey: string,
) => {
  const rowLabels = pivot.rows.map((row) =>
    joinLabel(row.values, pivot.rowFields.length === 0 ? "Total" : ""),
  );
  const columnLabels = pivot.columnKeys.map((column) => column.label);

  const matrix = pivot.rows.map((row) =>
    pivot.columnKeys.map((column) => row.cells[column.key]?.[measureKey] ?? 0),
  );

  if (chartType === "pie" || chartType === "donut") {
    return {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: chartType === "donut" ? ["40%", "70%"] : "65%",
          data: rowLabels.map((label, index) => ({
            name: label || "Total",
            value: sumValues(matrix[index] ?? []),
          })),
        },
      ],
    };
  }

  if (chartType === "heatmap") {
    const data: Array<[number, number, number]> = [];
    matrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        data.push([colIndex, rowIndex, value ?? 0]);
      });
    });

    return {
      tooltip: { position: "top" },
      grid: { height: "70%", top: "10%" },
      xAxis: { type: "category", data: columnLabels },
      yAxis: { type: "category", data: rowLabels },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((item) => item[2]), 1),
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "2%",
      },
      series: [
        {
          type: "heatmap",
          data,
          emphasis: {
            itemStyle: { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.3)" },
          },
        },
      ],
    };
  }

  if (chartType === "scatter") {
    const data = rowLabels.map((label, index) => {
      const value = sumValues(matrix[index] ?? []);
      return [index, value, label];
    });

    return {
      tooltip: {
        trigger: "item",
        formatter: (params: { value: [number, number, string] }) =>
          `${params.value[2]}: ${params.value[1]}`,
      },
      xAxis: { type: "category", data: rowLabels },
      yAxis: { type: "value" },
      series: [
        {
          type: "scatter",
          data, // Include label in data for tooltip access
        },
      ],
    };
  }

  if (chartType === "bar" || chartType === "line" || chartType === "area") {
    const series = columnLabels.map((label, index) => ({
      name: label,
      type: chartType === "area" ? "line" : chartType,
      areaStyle: chartType === "area" ? {} : undefined,
      data: matrix.map((row) => row[index] ?? 0),
    }));

    return {
      tooltip: { trigger: "axis" },
      legend: { data: columnLabels },
      xAxis: { type: "category", data: rowLabels },
      yAxis: { type: "value" },
      series,
    };
  }

  return null;
};
