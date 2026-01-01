import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
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
import type { DatasetField, WidgetConfig } from "../../bi.types";
import { Plus, X } from "lucide-react";

const widgetTypeOptions: Array<{ value: WidgetType; label: string }> = [
  { value: "pivot", label: "Pivot Table" },
  { value: "chart", label: "Chart" },
  { value: "kpi", label: "KPI Card" },
  { value: "text", label: "Text" },
];

const chartTypeOptions: Array<{ value: ChartType; label: string }> = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "area", label: "Area Chart" },
];

const aggregationOptions: Array<{ value: AggregationType; label: string }> = [
  { value: "count", label: "Count" },
  { value: "count_distinct", label: "Count Distinct" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Minimum" },
  { value: "max", label: "Maximum" },
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
  const queryClient = useQueryClient();
  const config = widget.config ?? {};
  const query = config.query;

  // Form state
  const [title, setTitle] = useState(config.title ?? "");
  const [widgetType, setWidgetType] = useState<WidgetType>(widget.widgetType);
  const [chartType, setChartType] = useState<ChartType>(config.chartType ?? "bar");
  const [textContent, setTextContent] = useState(config.textContent ?? "");
  const [datasetId, setDatasetId] = useState(query?.datasetId ?? "");
  const [rows, setRows] = useState<string[]>(query?.rows ?? []);
  const [columns, setColumns] = useState<string[]>(query?.columns ?? []);
  const [measures, setMeasures] = useState<
    Array<{ field: string | null; aggregation: AggregationType }>
  >(() => {
    const m = query?.measures ?? [];
    const normalized = m.map((item) => ({
      field: item.field ?? null,
      aggregation: item.aggregation,
    }));
    return normalized.length > 0 ? normalized : [{ field: null, aggregation: "count" }];
  });
  const [filters, setFilters] = useState<FilterConfig[]>(query?.filters ?? []);

  // Reset form when widget changes
  useEffect(() => {
    const cfg = widget.config ?? {};
    const q = cfg.query;
    setTitle(cfg.title ?? "");
    setWidgetType(widget.widgetType);
    setChartType(cfg.chartType ?? "bar");
    setTextContent(cfg.textContent ?? "");
    setDatasetId(q?.datasetId ?? "");
    setRows(q?.rows ?? []);
    setColumns(q?.columns ?? []);
    // Normalize measures to ensure field is string | null (not undefined)
    const normalizedMeasures = (q?.measures ?? []).map((m) => ({
      field: m.field ?? null,
      aggregation: m.aggregation,
    }));
    setMeasures(
      normalizedMeasures.length > 0
        ? normalizedMeasures
        : [{ field: null, aggregation: "count" }],
    );
    setFilters(q?.filters ?? []);
  }, [widget]);

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
  // Dimensions can be grouped by; measures can be aggregated
  const dimensionFields = fields.filter((f) => f.allowGroupBy !== false);
  const measureFields = fields.filter(
    (f) => f.allowAggregate !== false && f.dataType === "number",
  );

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
      }
    }

    updateMutation.mutate({
      widgetType,
      config: newConfig,
    });
  };

  const addMeasure = () => {
    setMeasures([...measures, { field: null, aggregation: "count" }]);
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
    if (field === "field") {
      newMeasures[index] = { ...newMeasures[index], field: value || null };
    } else {
      newMeasures[index] = {
        ...newMeasures[index],
        aggregation: value as AggregationType,
      };
    }
    setMeasures(newMeasures);
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="data" disabled={widgetType === "text"}>
              Data
            </TabsTrigger>
            <TabsTrigger value="measures" disabled={widgetType === "text"}>
              Measures
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
                  onValueChange={(v) => setChartType(v as ChartType)}
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
          </TabsContent>

          <TabsContent value="measures" className="space-y-4 pt-4">
            <div className="space-y-2">
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

                    {measure.aggregation !== "count" && (
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
                    )}

                    {measures.length > 1 && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeMeasure(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
