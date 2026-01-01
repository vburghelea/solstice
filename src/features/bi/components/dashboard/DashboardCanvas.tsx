import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ReactGridLayout, {
  WidthProvider,
  type Layout,
  type LegacyReactGridLayoutProps,
} from "react-grid-layout/legacy";
import { DashboardWidget } from "./DashboardWidget";
import type { FilterConfig, WidgetType } from "../../bi.schemas";
import type { WidgetConfig } from "../../bi.types";

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
      {widgets.map((widget) => (
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
              {...(onEditWidget ? { onEdit: () => onEditWidget(widget.id) } : {})}
              onRemove={() => onRemoveWidget(widget.id)}
            />,
          ]}
        </div>
      ))}
    </GridLayout>
  );
}
