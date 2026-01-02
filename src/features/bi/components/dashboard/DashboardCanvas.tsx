import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useQuery } from "@tanstack/react-query";
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type LegacyReactGridLayoutProps,
} from "react-grid-layout/legacy";
import { useMemo, type ComponentProps } from "react";
import { DashboardWidget } from "./DashboardWidget";
import type { FilterConfig, PivotResult, WidgetType } from "../../bi.schemas";
import type { WidgetConfig } from "../../bi.types";
import { executePivotBatch } from "../../bi.queries";
import { mergeDashboardFilters } from "./dashboard-utils";

const GridLayout = WidthProvider(ReactGridLayout);

type WidgetPosition = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export function DashboardCanvas({
  layout,
  widgets,
  globalFilters = [],
  editable,
  onPositionChange,
  onEditWidget,
  onRemoveWidget,
  onFilterChange,
  onFilterAdd,
}: {
  layout: {
    columns: number;
    rowHeight: number;
    compactType: "vertical" | "horizontal" | null;
  };
  widgets: Array<{
    id: string;
    widgetType: WidgetType;
    x: number;
    y: number;
    w: number;
    h: number;
    config?: WidgetConfig | null;
  }>;
  globalFilters?: FilterConfig[];
  editable: boolean;
  onPositionChange: (widgetId: string, position: WidgetPosition) => void;
  onEditWidget?: (widgetId: string) => void;
  onRemoveWidget: (widgetId: string) => void;
  onFilterChange?: (
    filter: FilterConfig | null,
    target?: { field: string; datasetId?: string },
  ) => void;
  onFilterAdd?: (filters: FilterConfig[]) => void;
}) {
  const gridLayout: Layout = widgets.map((widget) => ({
    i: widget.id,
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange: LegacyReactGridLayoutProps["onDragStop"] = (
    _layout,
    _oldItem,
    newItem,
  ) => {
    if (!editable) return;
    if (!newItem) return;
    onPositionChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
    });
  };

  const handleResizeStop: LegacyReactGridLayoutProps["onResizeStop"] = (
    _layout,
    _oldItem,
    newItem,
  ) => {
    if (!editable) return;
    if (!newItem) return;
    onPositionChange(newItem.i, {
      x: newItem.x,
      y: newItem.y,
      w: newItem.w,
      h: newItem.h,
    });
  };

  const batchQueries = useMemo(() => {
    return widgets
      .filter(
        (widget) =>
          widget.widgetType === "chart" ||
          widget.widgetType === "pivot" ||
          widget.widgetType === "kpi",
      )
      .map((widget) => {
        const config = (widget.config ?? {}) as WidgetConfig;
        const { query } = config;
        const { query: mergedQuery } = mergeDashboardFilters(
          query ?? null,
          globalFilters,
        );
        if (!mergedQuery) return null;
        return { widgetId: widget.id, query: mergedQuery };
      })
      .filter(
        (
          entry,
        ): entry is { widgetId: string; query: NonNullable<WidgetConfig["query"]> } =>
          Boolean(entry?.query),
      );
  }, [globalFilters, widgets]);

  const batchQuery = useQuery({
    queryKey: ["bi-dashboard-batch", batchQueries],
    queryFn: () => executePivotBatch({ data: { queries: batchQueries } }),
    enabled: batchQueries.length > 0,
    refetchOnMount: !editable,
    refetchOnWindowFocus: !editable,
    refetchOnReconnect: !editable,
    staleTime: editable ? Infinity : 0,
  });

  const batchResults = useMemo(() => {
    return new Map(
      (batchQuery.data?.results ?? []).map((result) => [result.widgetId, result]),
    );
  }, [batchQuery.data?.results]);

  const resolvePrefetchedResult = (widgetId: string) =>
    batchResults.get(widgetId) as
      | {
          widgetId: string;
          pivot?: PivotResult;
          rowCount?: number;
          error?: string;
        }
      | undefined;
  type DashboardWidgetProps = ComponentProps<typeof DashboardWidget>;

  return (
    <GridLayout
      key={editable ? "dashboard-edit" : "dashboard-view"}
      className="layout"
      cols={layout.columns}
      rowHeight={layout.rowHeight}
      compactType={layout.compactType}
      isDraggable={editable}
      isResizable={editable}
      draggableCancel=".dashboard-widget-toolbar button"
      layout={gridLayout}
      onDragStop={handleLayoutChange}
      onResizeStop={handleResizeStop}
      margin={[16, 16]}
      containerPadding={[0, 0]}
    >
      {widgets.map((widget) => {
        const prefetchedResult = resolvePrefetchedResult(
          widget.id,
        ) as DashboardWidgetProps["prefetchedResult"];
        return (
          <div
            key={widget.id}
            data-grid={{ x: widget.x, y: widget.y, w: widget.w, h: widget.h }}
          >
            {[
              <DashboardWidget
                key={`widget-${widget.id}`}
                widget={widget}
                globalFilters={globalFilters}
                editable={editable}
                prefetchedLoading={batchQuery.isLoading}
                {...(prefetchedResult ? { prefetchedResult } : {})}
                {...(batchQuery.error ? { prefetchedError: batchQuery.error } : {})}
                {...(onFilterChange ? { onFilterChange } : {})}
                {...(onFilterAdd ? { onFilterAdd } : {})}
                {...(onEditWidget ? { onEdit: () => onEditWidget(widget.id) } : {})}
                onRemove={() => onRemoveWidget(widget.id)}
              />,
            ]}
          </div>
        );
      })}
    </GridLayout>
  );
}
