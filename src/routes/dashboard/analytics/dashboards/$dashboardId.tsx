import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { AddWidgetModal } from "~/features/bi/components/dashboard/AddWidgetModal";
import { DashboardCanvas } from "~/features/bi/components/dashboard/DashboardCanvas";
import { DashboardExportDialog } from "~/features/bi/components/dashboard/DashboardExportDialog";
import { DashboardFilters } from "~/features/bi/components/dashboard/DashboardFilters";
import { DashboardShareDialog } from "~/features/bi/components/dashboard/DashboardShareDialog";
import { EditWidgetDialog } from "~/features/bi/components/dashboard/EditWidgetDialog";
import { getAvailableDatasets, getDatasetFields } from "~/features/bi/bi.queries";
import { logBiTelemetryEvent } from "~/features/bi/bi.telemetry";
import type { PivotQuery, WidgetType } from "~/features/bi/bi.schemas";
import type { DatasetField, WidgetConfig } from "~/features/bi/bi.types";
import { useDashboard } from "~/features/bi/hooks/use-dashboard";
import type { FilterConfig } from "~/features/bi/bi.schemas";

export const Route = createFileRoute("/dashboard/analytics/dashboards/$dashboardId")({
  component: DashboardDetailPage,
});

function DashboardDetailPage() {
  const { dashboardId } = Route.useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [sharedWithInput, setSharedWithInput] = useState("");
  const [shareOrgWide, setShareOrgWide] = useState(false);
  const [interactiveFilters, setInteractiveFilters] = useState<FilterConfig[]>([]);
  const dashboardHook = useDashboard(dashboardId);
  const datasetsQuery = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: () => getAvailableDatasets(),
  });

  const datasets = datasetsQuery.data?.datasets ?? [];
  const datasetIds = useMemo(() => datasets.map((dataset) => dataset.id), [datasets]);

  const datasetFieldsQuery = useQuery({
    queryKey: ["bi-fields", datasetIds],
    queryFn: async () => {
      const responses = await Promise.all(
        datasets.map((dataset) => getDatasetFields({ data: { datasetId: dataset.id } })),
      );
      return responses.map((response, index) => ({
        datasetId: datasets[index]?.id ?? "",
        datasetName: datasets[index]?.name ?? "",
        fields: (response.fields ?? []) as DatasetField[],
      }));
    },
    enabled: datasets.length > 0,
  });

  const filterFieldOptions = useMemo(() => {
    const options: Array<{
      key: string;
      field: DatasetField;
      datasetId?: string;
      datasetName?: string;
    }> = [];
    for (const entry of datasetFieldsQuery.data ?? []) {
      for (const field of entry.fields ?? []) {
        options.push({
          key: `${entry.datasetId}::${field.id}`,
          field,
          datasetId: entry.datasetId,
          datasetName: entry.datasetName,
        });
      }
    }
    return options;
  }, [datasetFieldsQuery.data]);

  const dashboard = dashboardHook.dashboard;
  const widgets = dashboardHook.widgets;
  const activeFilters = useMemo(
    () => [...(dashboard?.globalFilters ?? []), ...interactiveFilters],
    [dashboard?.globalFilters, interactiveFilters],
  );
  const sharedWithLabel = useMemo(
    () => (dashboard?.sharedWith ?? []).join(", "),
    [dashboard?.sharedWith],
  );
  const exportableWidgets = useMemo(
    () =>
      widgets
        .map((widget) => ({
          id: widget.id,
          title: widget.config?.title ?? "Widget",
          query: widget.config?.query ?? null,
        }))
        .filter((widget) => widget.query),
    [widgets],
  );

  const editingWidget = useMemo(
    () => widgets.find((w) => w.id === editingWidgetId) ?? null,
    [widgets, editingWidgetId],
  );

  useEffect(() => {
    if (!dashboard) return;
    setSharedWithInput(sharedWithLabel);
    setShareOrgWide(Boolean(dashboard.isOrgWide));
  }, [dashboard, sharedWithLabel]);

  useEffect(() => {
    setInteractiveFilters([]);
  }, [dashboardId]);

  useEffect(() => {
    if (!dashboard) return;
    void logBiTelemetryEvent({
      data: {
        event: "dashboard.view",
        dashboardId: dashboard.id,
      },
    });
  }, [dashboard]);

  if (dashboardHook.isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground text-sm">Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              This dashboard may have been deleted or you do not have access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePositionChange = (
    widgetId: string,
    position: { x: number; y: number; w: number; h: number },
  ) => {
    dashboardHook.updateWidget.mutate({
      data: {
        dashboardId: dashboard.id,
        widgetId,
        position,
      },
    });
  };

  const handleRemoveWidget = (widgetId: string) => {
    dashboardHook.removeWidget.mutate({
      data: { dashboardId: dashboard.id, widgetId },
    });
  };
  const handleEditWidget = (widgetId: string) => {
    setEditingWidgetId(widgetId);
  };

  const handleAddWidget = (params: {
    widgetType: WidgetType;
    title: string;
    position: { x: number; y: number; w: number; h: number };
    query?: PivotQuery;
    config?: WidgetConfig;
  }) => {
    dashboardHook.addWidget.mutate({
      data: {
        dashboardId: dashboard.id,
        widgetType: params.widgetType,
        title: params.title,
        position: params.position,
        query: params.query,
        config: params.config,
      },
    });
  };

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
    toast.message(isEditing ? "Edit mode off" : "Edit mode on");
  };

  const handleInteractiveFilterChange = (
    filter: FilterConfig | null,
    target?: { field: string; datasetId?: string },
  ) => {
    if (!target?.field) return;
    if (!filter) {
      setInteractiveFilters((prev) =>
        prev.filter(
          (entry) =>
            entry.field !== target.field ||
            (entry.datasetId ?? null) !== (target.datasetId ?? null),
        ),
      );
      return;
    }
    setInteractiveFilters((prev) => {
      const index = prev.findIndex(
        (entry) =>
          entry.field === filter.field &&
          (entry.datasetId ?? null) === (filter.datasetId ?? null),
      );
      if (index === -1) return [...prev, filter];
      const next = [...prev];
      next[index] = filter;
      return next;
    });
  };

  const handleFilterAdd = (filters: FilterConfig[]) => {
    setInteractiveFilters((prev) => {
      const next = [...prev];
      for (const filter of filters) {
        const index = next.findIndex(
          (entry) =>
            entry.field === filter.field &&
            (entry.datasetId ?? null) === (filter.datasetId ?? null),
        );
        if (index === -1) {
          next.push(filter);
        } else {
          next[index] = filter;
        }
      }
      return next;
    });
  };

  const clearInteractiveFilters = () => {
    setInteractiveFilters([]);
  };

  const parseSharedWith = (value: string) => {
    const entries = value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return Array.from(new Set(entries));
  };

  const handleShareSave = async () => {
    if (!dashboard) return;
    try {
      const sharedWith = parseSharedWith(sharedWithInput);
      const result = await dashboardHook.updateDashboard.mutateAsync({
        data: {
          dashboardId: dashboard.id,
          isOrgWide: shareOrgWide,
          sharedWith,
        },
      });
      if (result?.success) {
        toast.success("Sharing settings updated.");
        setShowShareDialog(false);
      } else {
        toast.error("Failed to update sharing settings.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update sharing settings.",
      );
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {dashboard.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            {dashboard.description ?? "No description"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleToggleEdit}>
            {isEditing ? "Stop editing" : "Edit layout"}
          </Button>
          <Button variant="outline" onClick={() => setShowShareDialog(true)}>
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowExportDialog(true)}
            disabled={exportableWidgets.length === 0}
          >
            Export
          </Button>
          <Button onClick={() => setShowAddWidget(true)}>Add widget</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <DashboardFilters
              fieldOptions={filterFieldOptions}
              filters={dashboard.globalFilters ?? []}
              editable={isEditing}
              onChange={(next) =>
                dashboardHook.updateDashboard.mutate({
                  data: { dashboardId: dashboard.id, globalFilters: next },
                })
              }
            />
          ) : (
            <>
              <DashboardFilters
                fieldOptions={filterFieldOptions}
                filters={activeFilters}
              />
              {interactiveFilters.length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-muted-foreground text-xs">
                    Interactive filters applied.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={clearInteractiveFilters}
                  >
                    Clear active filters
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <DashboardCanvas
        key={isEditing ? "dashboard-edit" : "dashboard-view"}
        layout={dashboard.layout}
        widgets={widgets}
        globalFilters={activeFilters}
        editable={isEditing}
        onPositionChange={handlePositionChange}
        onEditWidget={handleEditWidget}
        onRemoveWidget={handleRemoveWidget}
        onFilterChange={handleInteractiveFilterChange}
        onFilterAdd={handleFilterAdd}
      />

      <AddWidgetModal
        open={showAddWidget}
        onOpenChange={setShowAddWidget}
        datasets={datasets}
        widgetsCount={widgets.length}
        onAdd={handleAddWidget}
      />

      <DashboardShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        sharedWith={sharedWithInput}
        isOrgWide={shareOrgWide}
        onSharedWithChange={setSharedWithInput}
        onOrgWideChange={setShareOrgWide}
        onSave={handleShareSave}
        isSaving={dashboardHook.updateDashboard.isPending}
      />

      <DashboardExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        widgets={exportableWidgets}
        globalFilters={activeFilters}
      />

      {editingWidget && (
        <EditWidgetDialog
          open={Boolean(editingWidgetId)}
          onOpenChange={(open) => {
            if (!open) setEditingWidgetId(null);
          }}
          dashboardId={dashboard.id}
          widget={editingWidget}
        />
      )}
    </div>
  );
}
