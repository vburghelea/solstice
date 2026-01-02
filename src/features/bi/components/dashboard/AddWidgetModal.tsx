import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "~/components/ui/textarea";
import type { ChartType, PivotQuery, WidgetType } from "../../bi.schemas";
import type { DatasetField, WidgetConfig } from "../../bi.types";
import { getDatasetFields } from "../../bi.queries";
import { getDefaultChartOptions } from "../chart-config/panels";
import { createMeasureId } from "../../utils/measure-utils";

const widgetOptions: Array<{ value: WidgetType; label: string }> = [
  { value: "chart", label: "Chart" },
  { value: "pivot", label: "Pivot" },
  { value: "kpi", label: "KPI" },
  { value: "text", label: "Text" },
  { value: "filter", label: "Filter" },
];

const chartOptions: Array<{ value: ChartType; label: string }> = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
  { value: "heatmap", label: "Heatmap" },
  { value: "scatter", label: "Scatter" },
];

export function AddWidgetModal({
  open,
  onOpenChange,
  datasets,
  widgetsCount,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  datasets: Array<{ id: string; name: string }>;
  widgetsCount: number;
  onAdd: (params: {
    widgetType: WidgetType;
    title: string;
    position: { x: number; y: number; w: number; h: number };
    query?: PivotQuery;
    config?: WidgetConfig;
  }) => void;
}) {
  const [widgetType, setWidgetType] = useState<WidgetType>("chart");
  const [title, setTitle] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [textContent, setTextContent] = useState("");
  const [filterField, setFilterField] = useState("");
  const [filterType, setFilterType] =
    useState<NonNullable<WidgetConfig["filterType"]>>("select");

  useEffect(() => {
    if (!datasetId && datasets.length > 0) {
      setDatasetId(datasets[0]?.id ?? "");
    }
  }, [datasetId, datasets]);

  useEffect(() => {
    setFilterField("");
  }, [datasetId, widgetType]);

  const reset = () => {
    setWidgetType("chart");
    setTitle("");
    setTextContent("");
    setChartType("bar");
    setFilterField("");
    setFilterType("select");
  };

  const fieldsQuery = useQuery({
    queryKey: ["bi-fields", datasetId],
    queryFn: () => getDatasetFields({ data: { datasetId } }),
    enabled: Boolean(datasetId) && widgetType === "filter",
  });
  const fields = (fieldsQuery.data?.fields ?? []) as DatasetField[];

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("Widget title is required.");
      return;
    }

    const basePosition = {
      x: 0,
      y: widgetsCount * 4,
      w: widgetType === "kpi" || widgetType === "filter" ? 3 : 4,
      h: widgetType === "text" ? 3 : widgetType === "filter" ? 2 : 4,
    };

    let query: PivotQuery | undefined;
    const config: WidgetConfig = { title };

    if (widgetType !== "text" && widgetType !== "filter") {
      if (!datasetId) {
        toast.error("Select a dataset for this widget.");
        return;
      }
      const nextQuery: PivotQuery = {
        datasetId,
        rows: [],
        columns: [],
        measures: [{ id: createMeasureId(), field: null, aggregation: "count" }],
        filters: [],
        limit: 1000,
      };
      query = nextQuery;
      config.query = nextQuery;
    }

    if (widgetType === "chart") {
      config.chartType = chartType;
      config.chartOptions = getDefaultChartOptions(chartType);
    }

    if (widgetType === "text") {
      config.textContent = textContent;
    }

    if (widgetType === "filter") {
      if (!datasetId) {
        toast.error("Select a dataset for this widget.");
        return;
      }
      if (!filterField) {
        toast.error("Select a field to filter.");
        return;
      }
      config.filterDatasetId = datasetId;
      config.filterField = filterField;
      config.filterType = filterType;
    }

    const payload = {
      widgetType,
      title,
      position: basePosition,
      ...(query ? { query } : {}),
      config,
    };

    onAdd(payload);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add widget</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label>Widget type</Label>
            <Select
              value={widgetType}
              onValueChange={(value) => setWidgetType(value as WidgetType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select widget type" />
              </SelectTrigger>
              <SelectContent>
                {widgetOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          {widgetType !== "text" ? (
            <div className="space-y-1">
              <Label>Dataset</Label>
              <Select value={datasetId} onValueChange={setDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {widgetType === "filter" ? (
            <div className="space-y-1">
              <Label>Filter field</Label>
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.length === 0 ? (
                    <div className="text-muted-foreground p-2 text-center text-sm">
                      No filterable fields.
                    </div>
                  ) : (
                    fields
                      .filter((field) => field.allowFilter)
                      .map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {widgetType === "filter" ? (
            <div className="space-y-1">
              <Label>Filter type</Label>
              <Select
                value={filterType}
                onValueChange={(value) =>
                  setFilterType(value as NonNullable<WidgetConfig["filterType"]>)
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
          ) : null}

          {widgetType === "chart" ? (
            <div className="space-y-1">
              <Label>Chart type</Label>
              <Select
                value={chartType}
                onValueChange={(value) => setChartType(value as ChartType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chart" />
                </SelectTrigger>
                <SelectContent>
                  {chartOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {widgetType === "text" ? (
            <div className="space-y-1">
              <Label>Text</Label>
              <Textarea
                rows={4}
                value={textContent}
                onChange={(event) => setTextContent(event.target.value)}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleAdd}>
            Add widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
