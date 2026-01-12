import type { ChartType } from "../../bi.schemas";
import type { ChartOptions } from "../../bi.types";
import { COLOR_SCHEMES } from "../../utils/color-schemes";
import type { ChartControlPanel, ControlConfig } from "./types";

const colorSchemeOptions = COLOR_SCHEMES.map((scheme) => {
  const badges: string[] = [];
  if (scheme.isHighContrast) badges.push("WCAG");
  if (scheme.isColorblindSafe && !scheme.isHighContrast) badges.push("CVD");
  const suffix = badges.length > 0 ? ` (${badges.join(", ")})` : "";
  return {
    value: scheme.id,
    label: `${scheme.label}${suffix}`,
  };
});

const baseControls: ControlConfig[] = [
  {
    name: "colorSchemeId",
    type: "color-scheme",
    label: "Color scheme",
    defaultValue: "echarts",
    options: colorSchemeOptions,
  },
  {
    name: "showLegend",
    type: "checkbox",
    label: "Show legend",
    defaultValue: true,
  },
  {
    name: "legendPosition",
    type: "select",
    label: "Legend position",
    defaultValue: "top",
    options: [
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
    ],
    visibility: (formData) => formData["showLegend"] !== false,
  },
  {
    name: "showLabels",
    type: "checkbox",
    label: "Show labels",
    defaultValue: false,
  },
];

const stackedControl: ControlConfig = {
  name: "stacked",
  type: "checkbox",
  label: "Stack series",
  defaultValue: false,
};

const smoothControl: ControlConfig = {
  name: "smoothLines",
  type: "checkbox",
  label: "Smooth lines",
  defaultValue: false,
};

const donutRadiusControl: ControlConfig = {
  name: "donutRadius",
  type: "slider",
  label: "Donut radius",
  defaultValue: 40,
  min: 20,
  max: 70,
  step: 5,
};

const panels: Record<ChartType, ChartControlPanel | null> = {
  table: null,
  kpi: null,
  bar: {
    chartType: "bar",
    sections: [
      { label: "Appearance", controls: baseControls },
      { label: "Series", controls: [stackedControl] },
    ],
  },
  line: {
    chartType: "line",
    sections: [
      { label: "Appearance", controls: baseControls },
      { label: "Series", controls: [smoothControl] },
    ],
  },
  area: {
    chartType: "area",
    sections: [
      { label: "Appearance", controls: baseControls },
      { label: "Series", controls: [stackedControl, smoothControl] },
    ],
  },
  pie: {
    chartType: "pie",
    sections: [{ label: "Appearance", controls: baseControls }],
  },
  donut: {
    chartType: "donut",
    sections: [
      { label: "Appearance", controls: baseControls },
      { label: "Donut", controls: [donutRadiusControl] },
    ],
  },
  heatmap: {
    chartType: "heatmap",
    sections: [{ label: "Appearance", controls: baseControls }],
  },
  scatter: {
    chartType: "scatter",
    sections: [{ label: "Appearance", controls: baseControls }],
  },
};

export const getChartControlPanel = (chartType: ChartType): ChartControlPanel | null =>
  panels[chartType] ?? null;

export const getDefaultChartOptions = (chartType: ChartType): ChartOptions => {
  const panel = getChartControlPanel(chartType);
  if (!panel) return {};
  const defaults: ChartOptions = {};
  for (const section of panel.sections) {
    for (const control of section.controls) {
      if (control.name) {
        defaults[control.name as keyof ChartOptions] = control.defaultValue as never;
      }
    }
  }
  return defaults;
};
