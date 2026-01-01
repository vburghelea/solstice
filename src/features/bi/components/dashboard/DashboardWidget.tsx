import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2, Settings2 } from "lucide-react";
import type { FilterConfig, PivotResult } from "~/features/bi/bi.schemas";
import type { WidgetConfig } from "~/features/bi/bi.types";
import { executePivotQuery } from "~/features/bi/bi.queries";
import { buildPivotChartOptions } from "~/features/bi/components/charts/pivot-chart";
import { ChartContainer } from "~/features/bi/components/charts/ChartContainer";
import { KpiCard } from "~/features/bi/components/charts/KpiCard";
import { PivotTable } from "~/features/bi/components/pivot-table/PivotTable";
import { mergeDashboardFilters } from "~/features/bi/components/dashboard/dashboard-utils";
import { WidgetToolbar } from "~/features/bi/components/dashboard/WidgetToolbar";

const sumMeasure = (pivot: PivotResult, measureKey: string) => {
  const values = pivot.rows.flatMap((row) =>
    pivot.columnKeys.map((column) => row.cells[column.key]?.[measureKey] ?? null),
  );
  const hasValue = values.some((value) => typeof value === "number");
  if (!hasValue) return null;
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
};

export function DashboardWidget({
  widget,
  globalFilters = [],
  onEdit,
  onRemove,
  editable = false,
}: {
  widget: {
    id: string;
    widgetType: string;
    config?: WidgetConfig | null;
  };
  globalFilters?: FilterConfig[];
  onEdit?: () => void;
  onRemove?: () => void;
  editable?: boolean;
}) {
  const config = (widget.config ?? {}) as WidgetConfig;
  const query = config.query;

  const mergedQuery = useMemo(
    () => mergeDashboardFilters(query ?? null, globalFilters),
    [query, globalFilters],
  );

  const queryKey = useMemo(() => {
    return ["bi-widget", widget.id, mergedQuery ? JSON.stringify(mergedQuery) : "none"];
  }, [widget.id, mergedQuery]);

  const pivotQuery = useQuery({
    queryKey,
    queryFn: () =>
      mergedQuery
        ? executePivotQuery({ data: { ...mergedQuery } })
        : Promise.resolve(null),
    enabled:
      Boolean(mergedQuery) &&
      !editable &&
      (widget.widgetType === "chart" ||
        widget.widgetType === "pivot" ||
        widget.widgetType === "kpi"),
  });

  const pivot = pivotQuery.data?.pivot ?? null;

  const measureKey = pivot?.measures?.[0]?.key ?? "";
  const chartType = config.chartType ?? "bar";
  const chartOptions =
    pivot && measureKey ? buildPivotChartOptions(pivot, chartType, measureKey) : null;

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-md border bg-background"
      data-testid="dashboard-widget"
    >
      <WidgetToolbar
        title={config.title ?? "Widget"}
        {...(editable && onEdit ? { onEdit } : {})}
        {...(editable && onRemove ? { onRemove } : {})}
      />
      <div className="flex-1 overflow-auto p-3">
        {widget.widgetType === "text" ? (
          <p className="text-sm whitespace-pre-wrap">
            {config.textContent ?? "No content"}
          </p>
        ) : !mergedQuery ? (
          // No query configured
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Settings2 className="h-8 w-8 opacity-50" />
            <p className="text-sm">No data source configured</p>
            {editable && <p className="text-xs">Click edit to configure</p>}
          </div>
        ) : editable ? (
          // Edit mode - show placeholder for all data widgets
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <p className="text-sm">Preview paused while editing</p>
            <p className="text-xs">Finish editing to see live data</p>
          </div>
        ) : pivotQuery.isLoading ? (
          // Loading state
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pivotQuery.isError ? (
          // Error state
          <div className="flex h-full flex-col items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8 opacity-70" />
            <p className="text-sm">Failed to load data</p>
            <p className="text-muted-foreground text-xs">
              {pivotQuery.error instanceof Error
                ? pivotQuery.error.message
                : "Unknown error"}
            </p>
          </div>
        ) : widget.widgetType === "kpi" ? (
          pivot ? (
            <KpiCard
              title={config.title ?? "KPI"}
              value={sumMeasure(pivot, measureKey) ?? "-"}
              {...(config.subtitle ? { subtitle: config.subtitle } : {})}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No data returned</p>
          )
        ) : widget.widgetType === "pivot" ? (
          pivot ? (
            <PivotTable pivot={pivot} />
          ) : (
            <p className="text-muted-foreground text-sm">No data returned</p>
          )
        ) : widget.widgetType === "chart" ? (
          chartOptions ? (
            <ChartContainer option={chartOptions} />
          ) : (
            <p className="text-muted-foreground text-sm">No data returned</p>
          )
        ) : (
          <p className="text-muted-foreground text-sm">Unsupported widget</p>
        )}
      </div>
    </div>
  );
}
