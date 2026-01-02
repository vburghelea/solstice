import type { PivotQuery, WidgetType } from "../bi.schemas";
import type { WidgetConfig } from "../bi.types";
import { getDefaultChartOptions } from "../components/chart-config/panels";

export interface DashboardTemplateWidget {
  widgetType: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  query?: PivotQuery;
  config?: WidgetConfig;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  recommendedFor: string[];
  widgets: DashboardTemplateWidget[];
}

const buildMetricMeasure = (
  metricId: string,
  label: string,
): PivotQuery["measures"][number] => ({
  field: "id",
  aggregation: "count",
  metricId,
  label,
});

const buildCountMeasure = (field: string): PivotQuery["measures"][number] => ({
  field,
  aggregation: "count",
});

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: "pso-reporting-overview",
    name: "PSO Reporting Overview",
    description: "Track submission volume and status at a glance.",
    recommendedFor: ["PSO_REPORTER", "PSO_ADMIN"],
    widgets: [
      {
        widgetType: "kpi",
        title: "Total submissions",
        position: { x: 0, y: 0, w: 3, h: 2 },
        query: {
          datasetId: "reporting_submissions",
          rows: [],
          columns: [],
          measures: [
            buildMetricMeasure("reporting_total_submissions", "Total submissions"),
          ],
          filters: [],
          limit: 1000,
        },
        config: { title: "Total submissions" },
      },
      {
        widgetType: "chart",
        title: "Submissions by status",
        position: { x: 0, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "reporting_submissions",
          rows: ["status"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Submissions by status",
          chartType: "bar",
          chartOptions: getDefaultChartOptions("bar"),
        },
      },
      {
        widgetType: "chart",
        title: "Submissions over time",
        position: { x: 6, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "reporting_submissions",
          rows: ["submittedAtDay"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Submissions over time",
          chartType: "line",
          chartOptions: getDefaultChartOptions("line"),
        },
      },
    ],
  },
  {
    id: "submissions-qa-completeness",
    name: "Submissions QA & Completeness",
    description: "Monitor form quality and review progress.",
    recommendedFor: ["PSO_REPORTER", "PSO_ADMIN"],
    widgets: [
      {
        widgetType: "kpi",
        title: "Total form submissions",
        position: { x: 0, y: 0, w: 3, h: 2 },
        query: {
          datasetId: "form_submissions",
          rows: [],
          columns: [],
          measures: [
            buildMetricMeasure("forms_total_submissions", "Total form submissions"),
          ],
          filters: [],
          limit: 1000,
        },
        config: { title: "Total form submissions" },
      },
      {
        widgetType: "kpi",
        title: "Avg completeness",
        position: { x: 3, y: 0, w: 3, h: 2 },
        query: {
          datasetId: "form_submissions",
          rows: [],
          columns: [],
          measures: [
            {
              field: "completenessScore",
              aggregation: "avg",
              metricId: "forms_avg_completeness",
              label: "Average completeness",
            },
          ],
          filters: [],
          limit: 1000,
        },
        config: { title: "Avg completeness" },
      },
      {
        widgetType: "chart",
        title: "Submissions by status",
        position: { x: 0, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "form_submissions",
          rows: ["status"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Submissions by status",
          chartType: "bar",
          chartOptions: getDefaultChartOptions("bar"),
        },
      },
      {
        widgetType: "chart",
        title: "Submissions over time",
        position: { x: 6, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "form_submissions",
          rows: ["submittedAtDay"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Submissions over time",
          chartType: "line",
          chartOptions: getDefaultChartOptions("line"),
        },
      },
    ],
  },
  {
    id: "viasport-compliance",
    name: "viaSport Cross-org Compliance",
    description: "Track organization health across the network.",
    recommendedFor: ["VS_ADMIN", "VS_DATA_STEWARD"],
    widgets: [
      {
        widgetType: "kpi",
        title: "Total organizations",
        position: { x: 0, y: 0, w: 3, h: 2 },
        query: {
          datasetId: "organizations",
          rows: [],
          columns: [],
          measures: [buildMetricMeasure("org_total", "Total organizations")],
          filters: [],
          limit: 1000,
        },
        config: { title: "Total organizations" },
      },
      {
        widgetType: "chart",
        title: "Organizations by status",
        position: { x: 0, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "organizations",
          rows: ["status"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Organizations by status",
          chartType: "bar",
          chartOptions: getDefaultChartOptions("bar"),
        },
      },
      {
        widgetType: "chart",
        title: "Organizations by type",
        position: { x: 6, y: 2, w: 6, h: 4 },
        query: {
          datasetId: "organizations",
          rows: ["type"],
          columns: [],
          measures: [buildCountMeasure("id")],
          filters: [],
          limit: 1000,
        },
        config: {
          title: "Organizations by type",
          chartType: "pie",
          chartOptions: getDefaultChartOptions("pie"),
        },
      },
    ],
  },
];
