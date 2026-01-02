import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { addWidget, createDashboard } from "../../bi.mutations";
import { getDashboards } from "../../bi.queries";
import type { AggregationType, ChartType, FilterConfig } from "../../bi.schemas";
import type { ChartOptions, WidgetConfig } from "../../bi.types";

type WidgetType = "chart" | "pivot" | "kpi";

const widgetTypeOptions: Array<{
  value: WidgetType;
  label: string;
  description: string;
}> = [
  {
    value: "pivot",
    label: "Pivot Table",
    description: "Full table with rows and columns",
  },
  { value: "chart", label: "Chart", description: "Visual chart representation" },
  { value: "kpi", label: "KPI Card", description: "Single metric display" },
];

interface SaveToDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasetId: string;
  rows: string[];
  columns: string[];
  measures: Array<{
    id?: string;
    field: string;
    aggregation: AggregationType;
    metricId?: string;
    label?: string;
  }>;
  filters: FilterConfig[];
  chartType: ChartType;
  chartOptions?: ChartOptions;
}

export function SaveToDashboardDialog({
  open,
  onOpenChange,
  datasetId,
  rows,
  columns,
  measures,
  filters,
  chartType,
  chartOptions,
}: SaveToDashboardDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const [newDashboardName, setNewDashboardName] = useState("");
  const [widgetTitle, setWidgetTitle] = useState("");
  const [widgetType, setWidgetType] = useState<WidgetType>("pivot");

  const dashboardsQuery = useQuery({
    queryKey: ["bi-dashboards"],
    queryFn: () => getDashboards(),
    enabled: open,
  });

  const dashboards = dashboardsQuery.data?.dashboards ?? [];

  const createDashboardMutation = useMutation({
    mutationFn: (name: string) => createDashboard({ data: { name } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bi-dashboards"] });
    },
  });

  const addWidgetMutation = useMutation({
    mutationFn: (params: {
      dashboardId: string;
      widgetType: WidgetType;
      title: string;
      query: {
        datasetId: string;
        rows: string[];
        columns: string[];
        measures: Array<{
          id?: string;
          field: string | null;
          aggregation: AggregationType;
          metricId?: string;
          label?: string;
        }>;
        filters: FilterConfig[];
      };
      config: WidgetConfig;
    }) =>
      addWidget({
        data: {
          dashboardId: params.dashboardId,
          widgetType: params.widgetType,
          title: params.title,
          position: {
            x: 0,
            y: 0,
            w: params.widgetType === "kpi" ? 3 : 6,
            h: params.widgetType === "kpi" ? 2 : 4,
          },
          query: params.query,
          config: params.config,
        },
      }),
  });

  const handleSave = async () => {
    if (!widgetTitle.trim()) {
      toast.error("Widget title is required.");
      return;
    }

    let targetDashboardId = selectedDashboardId;

    // Create new dashboard if needed
    if (mode === "create") {
      if (!newDashboardName.trim()) {
        toast.error("Dashboard name is required.");
        return;
      }

      try {
        const result = await createDashboardMutation.mutateAsync(newDashboardName);
        if (!result.dashboardId) {
          toast.error("Failed to create dashboard.");
          return;
        }
        targetDashboardId = result.dashboardId;
      } catch {
        toast.error("Failed to create dashboard.");
        return;
      }
    }

    if (!targetDashboardId) {
      toast.error("Select or create a dashboard.");
      return;
    }

    // Build the query with proper measure format
    const query = {
      datasetId,
      rows,
      columns,
      measures: measures.map((m) => ({
        ...(m.id ? { id: m.id } : {}),
        field: m.field as string | null,
        aggregation: m.aggregation,
        ...(m.metricId ? { metricId: m.metricId } : {}),
        ...(m.label ? { label: m.label } : {}),
      })),
      filters,
      limit: 1000,
    };

    // Build widget config based on type
    const config: WidgetConfig = {
      title: widgetTitle,
      query,
    };

    if (widgetType === "chart") {
      config.chartType = chartType;
      if (chartOptions) {
        config.chartOptions = chartOptions;
      }
    }

    try {
      const result = await addWidgetMutation.mutateAsync({
        dashboardId: targetDashboardId,
        widgetType,
        title: widgetTitle,
        query,
        config,
      });

      if (result.widgetId) {
        toast.success("Widget added to dashboard!");
        onOpenChange(false);
        // Navigate to the dashboard
        navigate({
          to: "/dashboard/analytics/dashboards/$dashboardId",
          params: { dashboardId: targetDashboardId },
        });
      } else {
        toast.error("Failed to add widget.");
      }
    } catch {
      toast.error("Failed to add widget to dashboard.");
    }
  };

  const isLoading = createDashboardMutation.isPending || addWidgetMutation.isPending;

  const reset = () => {
    setMode("select");
    setSelectedDashboardId("");
    setNewDashboardName("");
    setWidgetTitle("");
    setWidgetType("pivot");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save to Dashboard</DialogTitle>
          <DialogDescription>
            Add this pivot as a widget to an existing or new dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Widget Title */}
          <div className="space-y-2">
            <Label htmlFor="widget-title">Widget title</Label>
            <Input
              id="widget-title"
              placeholder="e.g., Organization Summary"
              value={widgetTitle}
              onChange={(e) => setWidgetTitle(e.target.value)}
            />
          </div>

          {/* Widget Type */}
          <div className="space-y-2">
            <Label>Widget type</Label>
            <Select
              value={widgetType}
              onValueChange={(value) => setWidgetType(value as WidgetType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                {widgetTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-muted-foreground text-xs">
                        {option.description}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dashboard Selection */}
          <div className="space-y-2">
            <Label>Dashboard</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "select" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("select")}
              >
                Existing
              </Button>
              <Button
                type="button"
                variant={mode === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setMode("create")}
              >
                Create new
              </Button>
            </div>
          </div>

          {mode === "select" ? (
            <div className="space-y-2">
              <Select value={selectedDashboardId} onValueChange={setSelectedDashboardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {dashboards.length === 0 ? (
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      No dashboards found. Create one first.
                    </div>
                  ) : (
                    dashboards.map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        {dashboard.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {dashboards.length === 0 && (
                <p className="text-muted-foreground text-xs">
                  No dashboards yet.{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => setMode("create")}
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="New dashboard name"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save to Dashboard"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
