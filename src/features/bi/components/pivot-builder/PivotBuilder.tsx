import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useAuth } from "~/features/auth";
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { useOrgContext } from "~/features/organizations/org-context";
import type {
  AggregationType,
  ChartType,
  FilterConfig,
  PivotQuery,
  PivotResult,
} from "../..";
import type { ChartOptions, DatasetField } from "../../bi.types";
import { exportPivotResults } from "../../bi.mutations";
import {
  executePivotQuery,
  getAvailableDatasets,
  getDatasetFields,
} from "../../bi.queries";
import { logBiTelemetryEvent } from "../../bi.telemetry";
import { getMetricsForDataset } from "../../semantic/metrics.config";
import { estimateQueryCost } from "../../utils/query-cost";
import { suggestChartType } from "../../utils/chart-suggestion";
import { createMeasureId } from "../../utils/measure-utils";
import type { AuthUser } from "~/lib/auth/types";
import { DropZone } from "./DropZone";
import { FieldPalette } from "./FieldPalette";
import { FilterPanel } from "./FilterPanel";
import { MeasureConfig } from "./MeasureConfig";
import { PivotPreview } from "./PivotPreview";
import { SaveToDashboardDialog } from "./SaveToDashboardDialog";
import { ControlPanel } from "../chart-config/ControlPanel";
import { getChartControlPanel, getDefaultChartOptions } from "../chart-config/panels";

const chartTypeOptions: Array<{ value: ChartType; label: string }> = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "donut", label: "Donut" },
  { value: "heatmap", label: "Heatmap" },
  { value: "scatter", label: "Scatter" },
  // KPI removed from chart types - use KPI widget type in dashboard instead
];

const chartLabelByValue = new Map(
  chartTypeOptions.map((option) => [option.value, option.label]),
);

const baseAggregations: AggregationType[] = [
  "count",
  "sum",
  "avg",
  "min",
  "max",
  "count_distinct",
  "median",
  "stddev",
  "variance",
];

const nonNumericAggregations: AggregationType[] = ["count", "count_distinct"];

const MEASURE_ID_PREFIX = "measure:";

const toMeasureDragId = (id: string) => `${MEASURE_ID_PREFIX}${id}`;

const fromMeasureDragId = (id: string) =>
  id.startsWith(MEASURE_ID_PREFIX) ? id.slice(MEASURE_ID_PREFIX.length) : null;

type MeasureState = {
  id: string;
  field: string;
  aggregation: AggregationType;
  metricId?: string;
  label?: string;
};

const aggregationOptionsForField = (
  field: DatasetField | undefined,
): AggregationType[] => {
  if (!field) return baseAggregations;
  if (field.dataType === "number") return baseAggregations;
  return nonNumericAggregations;
};

const getPermissionSet = (user: AuthUser | null) => {
  const permissions = new Set<string>();
  for (const assignment of user?.roles ?? []) {
    const perms = assignment.role?.permissions ?? {};
    for (const [key, enabled] of Object.entries(perms)) {
      if (enabled) permissions.add(key);
    }
  }
  return permissions;
};

function SortableField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2 text-sm"
      data-testid={`field-${id}`}
    >
      <span
        {...attributes}
        {...listeners}
        aria-label={`Drag ${label}`}
        className="cursor-grab rounded-sm text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export function PivotBuilder() {
  const { activeOrganizationId } = useOrgContext();
  const { user } = useAuth();
  const { requestStepUp } = useStepUpPrompt();
  const [datasetId, setDatasetId] = useState<string>("");
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [measures, setMeasures] = useState<MeasureState[]>([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [chartType, setChartType] = useState<ChartType>("table");
  const [chartOptions, setChartOptions] = useState<ChartOptions>(() =>
    getDefaultChartOptions("table"),
  );
  const [pivotResult, setPivotResult] = useState<PivotResult | null>(null);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState<string>("");
  const [showRowTotals, setShowRowTotals] = useState(true);
  const [showColumnTotals, setShowColumnTotals] = useState(true);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [autoRunEnabled, setAutoRunEnabled] = useState(true);

  const runSourceRef = useRef<"manual" | "auto" | "sample">("manual");
  const autoRunKeyRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const datasetsQuery = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: () => getAvailableDatasets(),
  });

  const fieldsQuery = useQuery({
    queryKey: ["bi-fields", datasetId],
    queryFn: () =>
      datasetId ? getDatasetFields({ data: { datasetId } }) : Promise.resolve(null),
    enabled: Boolean(datasetId),
  });

  const datasets = datasetsQuery.data?.datasets ?? [];
  const fields = (fieldsQuery.data?.fields ?? []) as DatasetField[];
  const permissions = useMemo(() => getPermissionSet(user as AuthUser | null), [user]);
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
  const fieldsById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields],
  );

  const fieldLabels = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );
  const pivotQuery = useMemo<PivotQuery | null>(() => {
    if (!datasetId) return null;
    return {
      datasetId,
      organizationId: activeOrganizationId ?? undefined,
      rows,
      columns,
      measures,
      filters,
      limit: 1000,
    };
  }, [activeOrganizationId, columns, datasetId, filters, measures, rows]);
  const pivotQueryKey = useMemo(
    () => (pivotQuery ? JSON.stringify(pivotQuery) : ""),
    [pivotQuery],
  );
  const queryCost = useMemo(
    () => (pivotQuery ? estimateQueryCost(pivotQuery) : null),
    [pivotQuery],
  );
  const chartSuggestion = useMemo(
    () =>
      pivotQuery
        ? suggestChartType({
            rows,
            columns,
            measures: pivotQuery.measures,
            fieldsById,
          })
        : null,
    [columns, fieldsById, pivotQuery, rows],
  );
  const chartControlPanel = useMemo(() => getChartControlPanel(chartType), [chartType]);

  const usedFields = new Set([...rows, ...columns]);

  const availableFields = fields
    .filter((field) => !usedFields.has(field.id))
    .map((field) => field.id);

  useEffect(() => {
    if (!datasetId && datasets.length > 0) {
      setDatasetId(datasets[0]?.id ?? "");
    }
  }, [datasetId, datasets]);

  useEffect(() => {
    const defaults = getDefaultChartOptions(chartType);
    setChartOptions((prev) => ({ ...defaults, ...prev }));
  }, [chartType]);

  useEffect(() => {
    setRows([]);
    setColumns([]);
    setMeasures([]);
    setFilters([]);
    setPivotResult(null);
    setSelectedMeasureKey("");
    autoRunKeyRef.current = null;
  }, [datasetId]);

  const runMutation = useMutation({
    mutationFn: async (override?: PivotQuery | null) => {
      const query = override ?? pivotQuery;
      if (!query) {
        throw new Error("Select a dataset to run a query.");
      }
      if (query.measures.length === 0) {
        throw new Error("Add at least one measure.");
      }

      return executePivotQuery({
        data: query,
      });
    },
    onSuccess: (result) => {
      const pivot = result?.pivot ?? null;
      setPivotResult(pivot);
      void logBiTelemetryEvent({
        data: {
          event: "pivot.query.run",
          datasetId,
          rowCount: result?.rowCount ?? 0,
          chartType,
        },
      });
      if (pivot?.measures?.length) {
        setSelectedMeasureKey((prev) =>
          pivot.measures.some((measure) => measure.key === prev)
            ? prev
            : (pivot.measures[0]?.key ?? ""),
        );
      } else {
        setSelectedMeasureKey("");
      }
      if (runSourceRef.current !== "auto") {
        toast.success("Pivot updated.");
      }
    },
    onError: (error) => {
      void logBiTelemetryEvent({
        data: {
          event: "pivot.query.fail",
          datasetId,
          errorType: error instanceof Error ? error.name : "UnknownError",
        },
      });
      toast.error(error instanceof Error ? error.message : "Failed to run pivot.");
    },
  });

  const runPivot = (source: "manual" | "auto" | "sample", override?: PivotQuery) => {
    runSourceRef.current = source;
    const key = override ? JSON.stringify(override) : pivotQueryKey;
    if (key) autoRunKeyRef.current = key;
    runMutation.mutate(override ?? pivotQuery);
  };

  useEffect(() => {
    if (!autoRunEnabled || !pivotQuery || !queryCost?.isSafe) return;
    if (runMutation.isPending) return;
    if (autoRunKeyRef.current === pivotQueryKey) return;
    const handle = setTimeout(() => {
      if (runMutation.isPending) return;
      runPivot("auto", pivotQuery);
    }, 500);
    return () => clearTimeout(handle);
  }, [
    autoRunEnabled,
    pivotQuery,
    pivotQueryKey,
    queryCost?.isSafe,
    runMutation.isPending,
  ]);

  const exportMutation = useMutation({
    mutationFn: async (format: "csv" | "xlsx" | "json") => {
      if (!datasetId) {
        throw new Error("Select a dataset to export.");
      }
      if (measures.length === 0) {
        throw new Error("Add at least one measure before exporting.");
      }

      await logBiTelemetryEvent({
        data: {
          event: "pivot.export.attempt",
          datasetId,
          chartType,
        },
      });
      return exportPivotResults({
        data: {
          pivotQuery: {
            datasetId,
            organizationId: activeOrganizationId ?? undefined,
            rows,
            columns,
            measures,
            filters,
          },
          format,
        },
      });
    },
    onSuccess: (result) => {
      if (!result?.data) return;
      const encoding = result.encoding ?? "utf-8";
      const blobData =
        encoding === "base64"
          ? Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0))
          : result.data;
      const blob = new Blob([blobData], {
        type: result.mimeType ?? "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName ?? "pivot-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      const message = getStepUpErrorMessage(error);
      void logBiTelemetryEvent({
        data: {
          event: "pivot.export.fail",
          datasetId,
          errorType: error instanceof Error ? error.name : "UnknownError",
        },
      });
      if (message) {
        requestStepUp(message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Pivot export failed.");
    },
  });

  const findContainer = (id: string) => {
    if (rows.includes(id)) return "rows";
    if (columns.includes(id)) return "columns";
    const measureId = fromMeasureDragId(id);
    if (measureId && measures.some((item) => item.id === measureId)) return "measures";
    if (availableFields.includes(id)) return "available";
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeMeasureId = fromMeasureDragId(activeId);
    const overMeasureId = fromMeasureDragId(overId);
    const activeContainer = findContainer(activeId);
    const overContainer =
      overId === "rows" ||
      overId === "columns" ||
      overId === "measures" ||
      overId === "available"
        ? overId
        : findContainer(overId);

    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer) {
      if (activeContainer === "rows") {
        const oldIndex = rows.indexOf(activeId);
        const newIndex = rows.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setRows(arrayMove(rows, oldIndex, newIndex));
        }
      }
      if (activeContainer === "columns") {
        const oldIndex = columns.indexOf(activeId);
        const newIndex = columns.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          setColumns(arrayMove(columns, oldIndex, newIndex));
        }
      }
      if (activeContainer === "measures") {
        const items = measures.map((item) => item.id);
        const oldIndex = items.indexOf(activeMeasureId ?? "");
        const newIndex = items.indexOf(overMeasureId ?? "");
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const ordered = arrayMove(items, oldIndex, newIndex);
          setMeasures(ordered.map((id) => measures.find((item) => item.id === id)!));
        }
      }
      return;
    }

    const removeFrom = (container: string) => {
      if (container === "rows") setRows(rows.filter((item) => item !== activeId));
      if (container === "columns")
        setColumns(columns.filter((item) => item !== activeId));
      if (container === "measures") {
        if (!activeMeasureId) return;
        setMeasures(measures.filter((item) => item.id !== activeMeasureId));
      }
    };

    const addTo = (container: string) => {
      const field = fieldsById.get(activeId);

      if (container === "rows") {
        if (!field?.allowGroupBy) {
          toast.error("This field cannot be used as a row.");
          return;
        }
        if (!rows.includes(activeId)) {
          setRows([...rows, activeId]);
        }
      }
      if (container === "columns") {
        if (!field?.allowGroupBy) {
          toast.error("This field cannot be used as a column.");
          return;
        }
        if (!columns.includes(activeId)) {
          setColumns([...columns, activeId]);
        }
      }
      if (container === "measures") {
        if (!field?.allowAggregate) {
          toast.error("This field cannot be used as a measure.");
          return;
        }
        setMeasures([
          ...measures,
          {
            id: createMeasureId(),
            field: activeId,
            aggregation: field.defaultAggregation ?? "count",
          },
        ]);
      }
    };

    if (overContainer === "available") {
      removeFrom(activeContainer);
      return;
    }

    removeFrom(activeContainer);
    addTo(overContainer);
  };

  const updateMeasure = (measureId: string, aggregation: AggregationType) => {
    setMeasures((prev) =>
      prev.map((item) => (item.id === measureId ? { ...item, aggregation } : item)),
    );
  };

  const removeMeasure = (measureId: string) => {
    setMeasures((prev) => prev.filter((item) => item.id !== measureId));
  };

  const addMetric = (metricId: string) => {
    const metric = metricsById.get(metricId);
    if (!metric) return;
    if (measures.some((item) => item.metricId === metricId)) {
      toast.message("Metric already added.");
      return;
    }
    const metricFieldId = metric.fieldId ?? null;
    if (!metricFieldId) {
      toast.error("Metric is missing a mapped field.");
      return;
    }
    setMeasures((prev) => [
      ...prev,
      {
        id: createMeasureId(metricId),
        field: metricFieldId,
        aggregation: metric.aggregation ?? "count",
        metricId,
        label: metric.name,
      },
    ]);
  };

  const handleApplySample = () => {
    if (!datasetId) return;
    if (fields.length === 0) return;
    const dateField =
      fields.find((field) => field.allowGroupBy && field.timeGrain) ??
      fields.find(
        (field) =>
          field.allowGroupBy &&
          (field.dataType === "date" || field.dataType === "datetime"),
      );
    const dimensionField = dateField ?? fields.find((field) => field.allowGroupBy);
    const nextRows = dimensionField ? [dimensionField.id] : [];
    const metric = metrics[0];
    const fallbackFieldId = dimensionField?.id ?? fields[0]?.id ?? "";
    const nextMeasures: MeasureState[] = [
      metric
        ? {
            id: createMeasureId(metric.id),
            field: metric.fieldId ?? fallbackFieldId,
            aggregation: metric.aggregation ?? "count",
            metricId: metric.id,
            label: metric.name,
          }
        : {
            id: createMeasureId(),
            field: fallbackFieldId,
            aggregation: "count",
          },
    ];
    setRows(nextRows);
    setColumns([]);
    setMeasures(nextMeasures);
    setFilters([]);
    setPivotResult(null);
    const suggestion = suggestChartType({
      rows: nextRows,
      columns: [],
      measures: nextMeasures,
      fieldsById,
    });
    if (suggestion) {
      setChartType(suggestion.chartType);
    }

    if (!autoRunEnabled) {
      runPivot("sample", {
        datasetId,
        organizationId: activeOrganizationId ?? undefined,
        rows: nextRows,
        columns: [],
        measures: nextMeasures,
        filters: [],
        limit: 1000,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pivot builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
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
              <p className="text-muted-foreground text-xs">
                {datasets.find((dataset) => dataset.id === datasetId)?.description ??
                  "Select a dataset to begin."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Chart type</Label>
              <Select
                value={chartType}
                onValueChange={(value) => setChartType(value as ChartType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chart" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {chartSuggestion && chartSuggestion.chartType !== chartType ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    Suggested:{" "}
                    {chartLabelByValue.get(chartSuggestion.chartType) ??
                      chartSuggestion.chartType}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setChartType(chartSuggestion.chartType)}
                  >
                    Apply
                  </Button>
                </div>
              ) : null}
            </div>
          </div>

          <FilterPanel fields={fields} filters={filters} onChange={setFilters} />

          {chartControlPanel ? (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Chart options
              </p>
              <ControlPanel
                panel={chartControlPanel}
                value={chartOptions as Record<string, unknown>}
                onChange={(next) => setChartOptions(next as ChartOptions)}
              />
            </div>
          ) : null}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-4 lg:grid-cols-4">
              <FieldPalette
                availableFields={availableFields}
                fieldsById={fieldsById}
                renderItem={(item, label) => <SortableField id={item} label={label} />}
              />
              <DropZone
                id="rows"
                label="Rows"
                items={rows}
                renderItem={(item) => (
                  <SortableField id={item} label={fieldsById.get(item)?.name ?? item} />
                )}
              />
              <DropZone
                id="columns"
                label="Columns"
                items={columns}
                renderItem={(item) => (
                  <SortableField id={item} label={fieldsById.get(item)?.name ?? item} />
                )}
              />
              <DropZone
                id="measures"
                label="Measures"
                items={measures.map((item) => toMeasureDragId(item.id))}
                renderItem={(item) => {
                  const measureId = fromMeasureDragId(item) ?? "";
                  const measure = measures.find((entry) => entry.id === measureId);
                  const fieldId = measure?.field ?? "";
                  const field = fieldsById.get(fieldId);
                  return (
                    <SortableField
                      id={item}
                      label={measure?.label ?? field?.name ?? fieldId}
                    >
                      <MeasureConfig
                        aggregation={measure?.aggregation ?? "count"}
                        options={
                          measure?.metricId
                            ? [measure.aggregation]
                            : aggregationOptionsForField(field)
                        }
                        disabled={Boolean(measure?.metricId)}
                        onChange={(next) =>
                          measure ? updateMeasure(measure.id, next) : undefined
                        }
                        onRemove={() => (measure ? removeMeasure(measure.id) : undefined)}
                      />
                    </SortableField>
                  );
                }}
              />
            </div>
          </DndContext>

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

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => runPivot("manual")}>
              Run query
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportMutation.mutate("csv")}
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportMutation.mutate("xlsx")}
            >
              Export Excel
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => exportMutation.mutate("json")}
            >
              Export JSON
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => setShowSaveDialog(true)}
              disabled={measures.length === 0}
            >
              Save to Dashboard
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                id="autoRun"
                checked={autoRunEnabled}
                onCheckedChange={(value) => setAutoRunEnabled(Boolean(value))}
              />
              <Label htmlFor="autoRun" className="text-xs">
                Auto-run
              </Label>
            </div>
            <Badge variant="secondary">{activeOrganizationId ?? "No org"}</Badge>
          </div>
          {queryCost && !queryCost.isSafe ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
              <div>
                <p className="font-medium">Auto-run paused</p>
                <p>{queryCost.reason}</p>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="rowTotals"
                checked={showRowTotals}
                onCheckedChange={(value) => setShowRowTotals(Boolean(value))}
              />
              <Label htmlFor="rowTotals" className="text-xs">
                Row totals
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="columnTotals"
                checked={showColumnTotals}
                onCheckedChange={(value) => setShowColumnTotals(Boolean(value))}
              />
              <Label htmlFor="columnTotals" className="text-xs">
                Column totals
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="grandTotal"
                checked={showGrandTotal}
                onCheckedChange={(value) => setShowGrandTotal(Boolean(value))}
              />
              <Label htmlFor="grandTotal" className="text-xs">
                Grand total
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <PivotPreview
            pivot={pivotResult}
            chartType={chartType}
            selectedMeasureKey={selectedMeasureKey}
            onMeasureChange={setSelectedMeasureKey}
            showRowTotals={showRowTotals}
            showColumnTotals={showColumnTotals}
            showGrandTotal={showGrandTotal}
            fieldLabels={fieldLabels}
            fieldsById={fieldsById}
            chartOptions={chartOptions}
            rows={rows}
            columns={columns}
            measures={measures}
            isLoading={runMutation.isPending}
            onApplySample={handleApplySample}
          />
        </CardContent>
      </Card>

      <SaveToDashboardDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        datasetId={datasetId}
        rows={rows}
        columns={columns}
        measures={measures}
        filters={filters}
        chartType={chartType}
        chartOptions={chartOptions}
      />
    </div>
  );
}
