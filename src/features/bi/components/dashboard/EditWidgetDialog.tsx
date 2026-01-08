import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { updateWidget } from "../../bi.mutations";
import { getAvailableDatasets, getDatasetFields } from "../../bi.queries";
import type {
  AggregationType,
  ChartType,
  FilterConfig,
  WidgetType,
} from "../../bi.schemas";
import type { ChartOptions, DatasetField, WidgetConfig } from "../../bi.types";
import { ControlPanel } from "../chart-config/ControlPanel";
import { getChartControlPanel, getDefaultChartOptions } from "../chart-config/panels";
import { getMetricsForDataset } from "../../semantic/metrics.config";
import { createMeasureId, ensureMeasureId } from "../../utils/measure-utils";
import { useAuth } from "~/features/auth";
import { Plus, X } from "lucide-react";
import type { AuthUser } from "~/lib/auth/types";

const widgetTypeOptions: Array<{ value: WidgetType; label: string }> = [
  { value: "pivot", label: "Pivot Table" },
  { value: "chart", label: "Chart" },
  { value: "kpi", label: "KPI Card" },
  { value: "text", label: "Text" },
  { value: "filter", label: "Filter" },
];

const chartTypeOptions: Array<{ value: ChartType; label: string }> = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "area", label: "Area Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "donut", label: "Donut Chart" },
  { value: "heatmap", label: "Heatmap" },
  { value: "scatter", label: "Scatter Plot" },
];

const aggregationOptions: Array<{ value: AggregationType; label: string }> = [
  { value: "count", label: "Count" },
  { value: "count_distinct", label: "Count Distinct" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
  { value: "median", label: "Median" },
  { value: "stddev", label: "Std Dev" },
  { value: "variance", label: "Variance" },
];

interface EditWidgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dashboardId: string;
  widget: {
    id: string;
    widgetType: WidgetType;
    config?: WidgetConfig | null;
  };
}

export function EditWidgetDialog({
  open,
  onOpenChange,
  dashboardId,
  widget,
}: EditWidgetDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const config = widget.config ?? {};
  const query = config.query;

  // Form state
  const [title, setTitle] = useState(config.title ?? "");
  const [widgetType, setWidgetType] = useState<WidgetType>(widget.widgetType);
  const [chartType, setChartType] = useState<ChartType>(config.chartType ?? "bar");
  const [chartOptions, setChartOptions] = useState<ChartOptions>(
    () => config.chartOptions ?? getDefaultChartOptions(config.chartType ?? "bar"),
  );
  const [textContent, setTextContent] = useState(config.textContent ?? "");
  const [filterDatasetId, setFilterDatasetId] = useState(config.filterDatasetId ?? "");
  const [filterField, setFilterField] = useState(config.filterField ?? "");
  const [filterType, setFilterType] = useState<WidgetConfig["filterType"]>(
    config.filterType ?? "select",
  );
  const [datasetId, setDatasetId] = useState(query?.datasetId ?? "");
  const [rows, setRows] = useState<string[]>(query?.rows ?? []);
  const [columns, setColumns] = useState<string[]>(query?.columns ?? []);
  const [measures, setMeasures] = useState<
    Array<{
      id: string;
      field: string | null;
      aggregation: AggregationType;
      metricId?: string;
      label?: string;
    }>
  >(() => {
    const m = query?.measures ?? [];
    const normalized = m.map((item) => {
      const normalizedItem = ensureMeasureId({
        id: item.id,
        field: item.field ?? null,
        aggregation: item.aggregation,
        ...(item.metricId ? { metricId: item.metricId } : {}),
        ...(item.label ? { label: item.label } : {}),
      });
      return {
        id: normalizedItem.id,
        field: normalizedItem.field ?? null,
        aggregation: normalizedItem.aggregation,
        ...(normalizedItem.metricId ? { metricId: normalizedItem.metricId } : {}),
        ...(normalizedItem.label ? { label: normalizedItem.label } : {}),
      };
    });
    return normalized.length > 0
      ? normalized
      : [{ id: createMeasureId(), field: null, aggregation: "count" }];
  });
  const [filters, setFilters] = useState<FilterConfig[]>(query?.filters ?? []);

  // Fetch datasets
  const datasetsQuery = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: () => getAvailableDatasets(),
    enabled: open,
  });
  const datasets = datasetsQuery.data?.datasets ?? [];

  // Fetch fields for selected dataset
  const fieldsQuery = useQuery({
    queryKey: ["bi-fields", datasetId],
    queryFn: () => getDatasetFields({ data: { datasetId } }),
    enabled: open && Boolean(datasetId),
  });
  const fields = (fieldsQuery.data?.fields ?? []) as DatasetField[];
  const filterFieldsQuery = useQuery({
    queryKey: ["bi-fields", filterDatasetId],
    queryFn: () => getDatasetFields({ data: { datasetId: filterDatasetId } }),
    enabled: open && widgetType === "filter" && Boolean(filterDatasetId),
  });
  const filterFields = (filterFieldsQuery.data?.fields ?? []) as DatasetField[];
  // Dimensions can be grouped by; measures can be aggregated
  const dimensionFields = fields.filter((f) => f.allowGroupBy !== false);
  const measureFields = fields.filter(
    (f) => f.allowAggregate !== false && f.dataType === "number",
  );
  const permissions = useMemo(() => {
    const permissionSet = new Set<string>();
    for (const assignment of (user as AuthUser | null)?.roles ?? []) {
      const perms = assignment.role?.permissions ?? {};
      for (const [key, enabled] of Object.entries(perms)) {
        if (enabled) permissionSet.add(key);
      }
    }
    return permissionSet;
  }, [user]);
  const metrics = useMemo(() => {
    return getMetricsForDataset(datasetId).filter((metric) => {
      if (!metric.requiredPermission) return true;
      return (
        permissions.has(metric.requiredPermission) ||
        permissions.has("analytics.admin") ||
        permissions.has("*")
      );
    });
  }, [datasetId, permissions]);
  const metricsById = useMemo(
    () => new Map(metrics.map((metric) => [metric.id, metric])),
    [metrics],
  );
  const chartControlPanel = useMemo(() => getChartControlPanel(chartType), [chartType]);

  const handleChartTypeChange = (value: ChartType) => {
    setChartType(value);
    const defaults = getDefaultChartOptions(value);
    setChartOptions((prev) => ({ ...defaults, ...prev }));
  };

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (params: { widgetType: WidgetType; config: WidgetConfig }) =>
      updateWidget({
        data: {
          dashboardId,
          widgetId: widget.id,
          widgetType: params.widgetType,
          config: params.config,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bi-dashboard", dashboardId] });
      toast.success("Widget updated");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update widget");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Widget title is required");
      return;
    }

    const newConfig: WidgetConfig = {
      title,
    };

    if (widgetType === "text") {
      newConfig.textContent = textContent;
    } else if (widgetType === "filter") {
      if (!filterDatasetId) {
        toast.error("Please select a dataset");
        return;
      }
      if (!filterField) {
        toast.error("Please select a filter field");
        return;
      }
      newConfig.filterDatasetId = filterDatasetId;
      newConfig.filterField = filterField;
      newConfig.filterType = filterType ?? "select";
    } else if (widgetType === "chart" || widgetType === "pivot" || widgetType === "kpi") {
      if (!datasetId) {
        toast.error("Please select a dataset");
        return;
      }

      newConfig.query = {
        datasetId,
        rows,
        columns,
        measures,
        filters,
        limit: 1000,
      };

      if (widgetType === "chart") {
        newConfig.chartType = chartType;
        newConfig.chartOptions = chartOptions;
      }
    }

    updateMutation.mutate({
      widgetType,
      config: newConfig,
    });
  };

  const addMeasure = () => {
    setMeasures([
      ...measures,
      { id: createMeasureId(), field: null, aggregation: "count" },
    ]);
  };

  const removeMeasure = (index: number) => {
    setMeasures(measures.filter((_, i) => i !== index));
  };

  const updateMeasure = (
    index: number,
    field: "field" | "aggregation",
    value: string,
  ) => {
    const newMeasures = [...measures];
    const {
      metricId: _metricId,
      label: _label,
      ...rest
    } = newMeasures[index] ?? {
      id: createMeasureId(),
      field: null,
      aggregation: "count" as AggregationType,
    };
    if (field === "field") {
      newMeasures[index] = {
        ...rest,
        field: value || null,
      };
    } else {
      newMeasures[index] = {
        ...rest,
        aggregation: value as AggregationType,
      };
    }
    setMeasures(newMeasures);
  };

  const addMetric = (metricId: string) => {
    const metric = metricsById.get(metricId);
    if (!metric) return;
    if (measures.some((item) => item.metricId === metricId)) {
      toast.message("Metric already added.");
      return;
    }
    setMeasures((prev) => [
      ...prev,
      {
        id: createMeasureId(metricId),
        field: metric.fieldId ?? null,
        aggregation: metric.aggregation ?? "count",
        metricId,
        label: metric.name,
      },
    ]);
  };

  const toggleDimension = (fieldId: string, dimension: "rows" | "columns") => {
    if (dimension === "rows") {
      if (rows.includes(fieldId)) {
        setRows(rows.filter((r) => r !== fieldId));
      } else {
        setRows([...rows, fieldId]);
        setColumns(columns.filter((c) => c !== fieldId));
      }
    } else {
      if (columns.includes(fieldId)) {
        setColumns(columns.filter((c) => c !== fieldId));
      } else {
        setColumns([...columns, fieldId]);
        setRows(rows.filter((r) => r !== fieldId));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Widget</DialogTitle>
          <DialogDescription>
            Modify the widget configuration and data query.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="data" disabled={widgetType === "text"}>
              Data
            </TabsTrigger>
            <TabsTrigger
              value="measures"
              disabled={widgetType === "text" || widgetType === "filter"}
            >
              Measures
            </TabsTrigger>
            <TabsTrigger value="chart" disabled={widgetType !== "chart"}>
              Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Widget title"
              />
            </div>

            <div className="space-y-2">
              <Label>Widget Type</Label>
              <Select
                value={widgetType}
                onValueChange={(v) => setWidgetType(v as WidgetType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {widgetTypeOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {widgetType === "chart" && (
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <Select
                  value={chartType}
                  onValueChange={(v) => handleChartTypeChange(v as ChartType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {chartTypeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {widgetType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="edit-text">Text Content</Label>
                <textarea
                  id="edit-text"
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Enter text content..."
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4 pt-4">
            {widgetType === "filter" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select
                    value={filterDatasetId}
                    onValueChange={(value) => {
                      setFilterDatasetId(value);
                      setFilterField("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filter field</Label>
                  <Select value={filterField} onValueChange={setFilterField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterFields
                        .filter((field) => field.allowFilter)
                        .map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Filter type</Label>
                  <Select
                    value={filterType ?? "select"}
                    onValueChange={(value) =>
                      setFilterType(value as WidgetConfig["filterType"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select filter type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="date_range">Date range</SelectItem>
                      <SelectItem value="search">Search</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select value={datasetId} onValueChange={setDatasetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasets.map((ds) => (
                        <SelectItem key={ds.id} value={ds.id}>
                          {ds.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {datasetId && dimensionFields.length > 0 && (
                  <div className="space-y-2">
                    <Label>Dimensions</Label>
                    <div className="grid gap-2">
                      {dimensionFields.map((field) => {
                        const inRows = rows.includes(field.id);
                        const inColumns = columns.includes(field.id);
                        return (
                          <div
                            key={field.id}
                            className="flex items-center justify-between rounded border p-2"
                          >
                            <span className="text-sm">{field.name}</span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant={inRows ? "default" : "outline"}
                                onClick={() => toggleDimension(field.id, "rows")}
                              >
                                Row
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={inColumns ? "default" : "outline"}
                                onClick={() => toggleDimension(field.id, "columns")}
                              >
                                Column
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="measures" className="space-y-4 pt-4">
            <div className="space-y-2">
              {metrics.length > 0 ? (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Metrics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((metric) => (
                      <Button
                        key={metric.id}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => addMetric(metric.id)}
                      >
                        {metric.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center justify-between">
                <Label>Measures</Label>
                <Button type="button" size="sm" variant="outline" onClick={addMeasure}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
              <div className="space-y-2">
                {measures.map((measure, index) => (
                  <div key={index} className="flex items-center gap-2 rounded border p-2">
                    <Select
                      value={measure.aggregation}
                      onValueChange={(v) => updateMeasure(index, "aggregation", v)}
                      disabled={Boolean(measure.metricId)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aggregationOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {measure.metricId ? (
                      <div className="flex-1 text-sm text-muted-foreground">
                        Metric: {measure.label ?? metricsById.get(measure.metricId)?.name}
                      </div>
                    ) : measure.aggregation !== "count" ? (
                      <Select
                        value={measure.field ?? ""}
                        onValueChange={(v) => updateMeasure(index, "field", v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {measureFields.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex-1 text-sm text-muted-foreground">
                        Count all rows
                      </div>
                    )}

                    {measures.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMeasure(index)}
                        aria-label="Remove measure"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chart" className="space-y-4 pt-4">
            {widgetType === "chart" ? (
              chartControlPanel ? (
                <ControlPanel
                  panel={chartControlPanel}
                  value={chartOptions as Record<string, unknown>}
                  onChange={(next) => setChartOptions(next as ChartOptions)}
                />
              ) : (
                <p className="text-muted-foreground text-sm">
                  Chart controls are not available for this type.
                </p>
              )
            ) : (
              <p className="text-muted-foreground text-sm">
                Select a chart widget to configure chart options.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
