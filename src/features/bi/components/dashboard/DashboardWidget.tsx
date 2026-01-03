import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Loader2, Settings2 } from "lucide-react";
import type { FilterConfig, PivotResult } from "~/features/bi/bi.schemas";
import type { WidgetConfig } from "~/features/bi/bi.types";
import { executePivotQuery } from "~/features/bi/bi.queries";
import { logBiTelemetryEvent } from "~/features/bi/bi.telemetry";
import { buildPivotChartOptions } from "~/features/bi/components/charts/pivot-chart";
import {
  ChartWrapper,
  type ChartElementClick,
} from "~/features/bi/components/charts/ChartWrapper";
import { KpiCard } from "~/features/bi/components/charts/KpiCard";
import { PivotTable } from "~/features/bi/components/pivot-table/PivotTable";
import { mergeDashboardFilters } from "~/features/bi/components/dashboard/dashboard-utils";
import { WidgetToolbar } from "~/features/bi/components/dashboard/WidgetToolbar";
import { buildMeasureFormatters } from "~/features/bi/utils/formatting";
import { getDatasetFields as getSemanticFields } from "~/features/bi/semantic";
import { FilterWidget } from "~/features/bi/components/dashboard/FilterWidget";

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
  onFilterChange,
  onFilterAdd,
  prefetchedResult,
  prefetchedLoading,
  prefetchedError,
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
  onFilterChange?: (
    filter: FilterConfig | null,
    target?: { field: string; datasetId?: string },
  ) => void;
  onFilterAdd?: (filters: FilterConfig[]) => void;
  prefetchedResult?: {
    widgetId: string;
    pivot?: PivotResult;
    rowCount?: number;
    error?: string;
  };
  prefetchedLoading?: boolean;
  prefetchedError?: unknown;
}) {
  const config = (widget.config ?? {}) as WidgetConfig;
  const query = config.query;

  const { query: mergedQuery, ignoredFilters } = useMemo(
    () => mergeDashboardFilters(query ?? null, globalFilters),
    [query, globalFilters],
  );
  const baseFilterCount = query?.filters?.length ?? 0;
  const appliedGlobalFilterCount = mergedQuery
    ? Math.max(0, mergedQuery.filters.length - baseFilterCount)
    : 0;
  const isFiltered = appliedGlobalFilterCount > 0;

  const queryKey = useMemo(() => {
    return ["bi-widget", widget.id, mergedQuery ? JSON.stringify(mergedQuery) : "none"];
  }, [widget.id, mergedQuery]);

  const shouldUsePrefetch = Boolean(prefetchedResult) || (prefetchedLoading ?? false);

  const pivotQuery = useQuery({
    queryKey,
    queryFn: () =>
      mergedQuery
        ? executePivotQuery({ data: { ...mergedQuery } })
        : Promise.resolve(null),
    enabled:
      !shouldUsePrefetch &&
      Boolean(mergedQuery) &&
      (widget.widgetType === "chart" ||
        widget.widgetType === "pivot" ||
        widget.widgetType === "kpi"),
    refetchOnMount: !editable,
    refetchOnWindowFocus: !editable,
    refetchOnReconnect: !editable,
    staleTime: editable ? Infinity : 0,
  });

  const pivot = shouldUsePrefetch
    ? (prefetchedResult?.pivot ?? null)
    : (pivotQuery.data?.pivot ?? null);
  const rowCount = shouldUsePrefetch
    ? (prefetchedResult?.rowCount ?? 0)
    : (pivotQuery.data?.rowCount ?? 0);
  const queryErrorMessage = prefetchedResult?.error
    ? prefetchedResult.error
    : prefetchedError instanceof Error
      ? prefetchedError.message
      : pivotQuery.error instanceof Error
        ? pivotQuery.error.message
        : null;
  const isLoading = shouldUsePrefetch ? Boolean(prefetchedLoading) : pivotQuery.isLoading;

  const measureKey = pivot?.measures?.[0]?.key ?? "";
  const measureLabel =
    pivot?.measures?.find((measure) => measure.key === measureKey)?.label ?? "Value";
  const chartType = config.chartType ?? "bar";
  const fieldsById = useMemo(() => {
    if (!mergedQuery) return new Map();
    return new Map(
      getSemanticFields(mergedQuery.datasetId).map((field) => [field.id, field]),
    );
  }, [mergedQuery]);
  const chartOptions =
    pivot && measureKey
      ? buildPivotChartOptions(
          pivot,
          chartType,
          measureKey,
          config.chartOptions,
          fieldsById,
        )
      : null;
  const chartAriaLabel = `${config.title ?? "Chart"} chart`;
  const chartAriaDescription = `Chart of ${measureLabel}`;
  const measureFormatters = useMemo(() => {
    if (!pivot) return undefined;
    return buildMeasureFormatters(pivot.measures, fieldsById);
  }, [fieldsById, pivot]);

  const filterDatasetId = config.filterDatasetId ?? config.query?.datasetId;
  const filterFieldId = config.filterField;
  const filterField = useMemo(() => {
    if (!filterDatasetId || !filterFieldId) return undefined;
    return getSemanticFields(filterDatasetId).find((field) => field.id === filterFieldId);
  }, [filterDatasetId, filterFieldId]);
  const filterValue = useMemo(() => {
    if (!filterFieldId) return null;
    return (
      globalFilters.find(
        (filter) =>
          filter.field === filterFieldId &&
          (filter.datasetId ?? null) === (filterDatasetId ?? null),
      ) ?? null
    );
  }, [filterDatasetId, filterFieldId, globalFilters]);

  const handleChartClick = (event: ChartElementClick) => {
    if (!onFilterAdd || !mergedQuery) return;
    const nextFilters: FilterConfig[] = [];
    const applyValues = (values?: Record<string, string>) => {
      if (!values) return;
      for (const [field, value] of Object.entries(values)) {
        if (!value) continue;
        nextFilters.push({
          field,
          operator: "eq",
          value,
          datasetId: mergedQuery.datasetId,
        });
      }
    };
    applyValues(event.rowValues);
    applyValues(event.columnValues);
    if (nextFilters.length > 0) {
      onFilterAdd(nextFilters);
    }
  };

  const isQuerySuccess = shouldUsePrefetch
    ? Boolean(pivot) && !prefetchedResult?.error
    : pivotQuery.isSuccess;
  const isQueryError = shouldUsePrefetch
    ? Boolean(prefetchedResult?.error)
    : pivotQuery.isError;

  useEffect(() => {
    if (!mergedQuery || !isQuerySuccess) return;
    void logBiTelemetryEvent({
      data: {
        event: "pivot.query.run",
        datasetId: mergedQuery.datasetId,
        rowCount,
        chartType: config.chartType,
        widgetId: widget.id,
      },
    });
  }, [mergedQuery, isQuerySuccess, rowCount, widget.id, config.chartType]);

  useEffect(() => {
    if (!mergedQuery || !isQueryError) return;
    void logBiTelemetryEvent({
      data: {
        event: "pivot.query.fail",
        datasetId: mergedQuery.datasetId,
        errorType: "QueryError",
        widgetId: widget.id,
      },
    });
  }, [mergedQuery, isQueryError, widget.id]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-md border bg-background"
      data-testid="dashboard-widget"
    >
      <WidgetToolbar
        title={config.title ?? "Widget"}
        statusLabels={[
          ...(editable &&
          (widget.widgetType === "chart" ||
            widget.widgetType === "pivot" ||
            widget.widgetType === "kpi")
            ? ["Stale"]
            : []),
          ...(isFiltered ? ["Filtered"] : []),
        ]}
        {...(editable && onEdit ? { onEdit } : {})}
        {...(editable && onRemove ? { onRemove } : {})}
      />
      {ignoredFilters.length > 0 ? (
        <div
          className={
            "flex items-center gap-2 border-b bg-amber-50 px-3 py-1 " +
            "text-[11px] text-amber-700"
          }
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Some global filters don't apply to this widget.</span>
        </div>
      ) : null}
      <div className="flex-1 overflow-auto p-3">
        {widget.widgetType === "filter" ? (
          <FilterWidget
            config={config}
            {...(filterField ? { field: filterField } : {})}
            value={filterValue}
            filters={globalFilters}
            onChange={(next) =>
              onFilterChange?.(next, {
                field: filterFieldId ?? "",
                ...(filterDatasetId ? { datasetId: filterDatasetId } : {}),
              })
            }
            disabled={editable}
          />
        ) : widget.widgetType === "text" ? (
          <p className="text-sm whitespace-pre-wrap">
            {config.textContent ?? "No content"}
          </p>
        ) : !mergedQuery ? (
          // No query configured
          <div
            className={
              "flex h-full flex-col items-center justify-center gap-2 " +
              "text-muted-foreground"
            }
          >
            <Settings2 className="h-8 w-8 opacity-50" />
            <p className="text-sm">No data source configured</p>
            {editable && <p className="text-xs">Click edit to configure</p>}
          </div>
        ) : isLoading ? (
          // Loading state
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : queryErrorMessage ? (
          // Error state
          <div
            className={
              "flex h-full flex-col items-center justify-center gap-2 " +
              "text-destructive"
            }
          >
            <AlertCircle className="h-8 w-8 opacity-70" />
            <p className="text-sm">Failed to load data</p>
            <p className="text-muted-foreground text-xs">{queryErrorMessage}</p>
          </div>
        ) : widget.widgetType === "kpi" ? (
          pivot ? (
            <KpiCard
              title={config.title ?? "KPI"}
              value={
                measureFormatters?.get(measureKey)
                  ? measureFormatters.get(measureKey)!(sumMeasure(pivot, measureKey))
                  : (sumMeasure(pivot, measureKey) ?? "-")
              }
              {...(config.subtitle ? { subtitle: config.subtitle } : {})}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No data returned</p>
          )
        ) : widget.widgetType === "pivot" ? (
          pivot ? (
            <PivotTable
              pivot={pivot}
              {...(measureFormatters ? { measureFormatters } : {})}
              {...(fieldsById ? { fieldsById } : {})}
            />
          ) : (
            <p className="text-muted-foreground text-sm">No data returned</p>
          )
        ) : widget.widgetType === "chart" ? (
          chartOptions ? (
            <ChartWrapper
              options={chartOptions}
              ariaLabel={chartAriaLabel}
              ariaDescription={chartAriaDescription}
              {...(!editable ? { onElementClick: handleChartClick } : {})}
            />
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
