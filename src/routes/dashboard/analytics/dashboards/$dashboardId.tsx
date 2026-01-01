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
import type { PivotQuery, WidgetType } from "~/features/bi/bi.schemas";
import type { DatasetField, WidgetConfig } from "~/features/bi/bi.types";
import { useDashboard } from "~/features/bi/hooks/use-dashboard";

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
      return responses.flatMap((response) => response.fields ?? []);
    },
    enabled: datasets.length > 0,
  });

  const filterFields = useMemo(() => {
    const fieldMap = new Map<string, DatasetField>();
    const fields = (datasetFieldsQuery.data ?? []) as DatasetField[];
    fields.forEach((field) => {
      if (!fieldMap.has(field.id)) {
        fieldMap.set(field.id, field);
      }
    });
    return Array.from(fieldMap.values());
  }, [datasetFieldsQuery.data]);

  const dashboard = dashboardHook.dashboard;
  const widgets = dashboardHook.widgets;
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
        <CardContent>
          <DashboardFilters
            fields={filterFields}
            filters={dashboard.globalFilters ?? []}
            editable={isEditing}
            onChange={(next) =>
              dashboardHook.updateDashboard.mutate({
                data: { dashboardId: dashboard.id, globalFilters: next },
              })
            }
          />
        </CardContent>
      </Card>

      <DashboardCanvas
        key={isEditing ? "dashboard-edit" : "dashboard-view"}
        layout={dashboard.layout}
        widgets={widgets}
        globalFilters={dashboard.globalFilters ?? []}
        editable={isEditing}
        onPositionChange={handlePositionChange}
        onEditWidget={handleEditWidget}
        onRemoveWidget={handleRemoveWidget}
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
        globalFilters={dashboard.globalFilters ?? []}
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
