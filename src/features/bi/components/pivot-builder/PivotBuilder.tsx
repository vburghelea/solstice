import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { useOrgContext } from "~/features/organizations/org-context";
import type { AggregationType, ChartType, FilterConfig, PivotResult } from "../..";
import type { DatasetField } from "../../bi.types";
import { exportPivotResults } from "../../bi.mutations";
import {
  executePivotQuery,
  getAvailableDatasets,
  getDatasetFields,
} from "../../bi.queries";
import { DropZone } from "./DropZone";
import { FieldPalette } from "./FieldPalette";
import { FilterPanel } from "./FilterPanel";
import { MeasureConfig } from "./MeasureConfig";
import { PivotPreview } from "./PivotPreview";
import { SaveToDashboardDialog } from "./SaveToDashboardDialog";

const chartOptions: Array<{ value: ChartType; label: string }> = [
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

const aggregationOptionsForField = (
  field: DatasetField | undefined,
): AggregationType[] => {
  if (!field) return baseAggregations;
  if (field.dataType === "number") return baseAggregations;
  return nonNumericAggregations;
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
      <span {...attributes} {...listeners} className="cursor-grab text-xs font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

export function PivotBuilder() {
  const { activeOrganizationId } = useOrgContext();
  const { requestStepUp } = useStepUpPrompt();
  const [datasetId, setDatasetId] = useState<string>("");
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [measures, setMeasures] = useState<
    Array<{ field: string; aggregation: AggregationType }>
  >([]);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [chartType, setChartType] = useState<ChartType>("table");
  const [pivotResult, setPivotResult] = useState<PivotResult | null>(null);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState<string>("");
  const [showRowTotals, setShowRowTotals] = useState(true);
  const [showColumnTotals, setShowColumnTotals] = useState(true);
  const [showGrandTotal, setShowGrandTotal] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

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
  const fieldsById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields],
  );

  const fieldLabels = useMemo(
    () => new Map(fields.map((field) => [field.id, field.name])),
    [fields],
  );

  const usedFields = new Set([
    ...rows,
    ...columns,
    ...measures.map((item) => item.field),
  ]);

  const availableFields = fields
    .filter((field) => !usedFields.has(field.id))
    .map((field) => field.id);

  useEffect(() => {
    if (!datasetId && datasets.length > 0) {
      setDatasetId(datasets[0]?.id ?? "");
    }
  }, [datasetId, datasets]);

  useEffect(() => {
    setRows([]);
    setColumns([]);
    setMeasures([]);
    setFilters([]);
    setPivotResult(null);
    setSelectedMeasureKey("");
  }, [datasetId]);

  const runMutation = useMutation({
    mutationFn: async () => {
      if (!datasetId) {
        throw new Error("Select a dataset to run a query.");
      }
      if (measures.length === 0) {
        throw new Error("Add at least one measure.");
      }

      return executePivotQuery({
        data: {
          datasetId,
          organizationId: activeOrganizationId ?? undefined,
          rows,
          columns,
          measures,
          filters,
        },
      });
    },
    onSuccess: (result) => {
      const pivot = result?.pivot ?? null;
      setPivotResult(pivot);
      if (pivot?.measures?.length) {
        setSelectedMeasureKey((prev) =>
          pivot.measures.some((measure) => measure.key === prev)
            ? prev
            : (pivot.measures[0]?.key ?? ""),
        );
      } else {
        setSelectedMeasureKey("");
      }
      toast.success("Pivot updated.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to run pivot.");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (format: "csv" | "xlsx" | "json") => {
      if (!datasetId) {
        throw new Error("Select a dataset to export.");
      }
      if (measures.length === 0) {
        throw new Error("Add at least one measure before exporting.");
      }

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
    if (measures.some((item) => item.field === id)) return "measures";
    if (availableFields.includes(id)) return "available";
    return null;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
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
        const items = measures.map((item) => item.field);
        const oldIndex = items.indexOf(activeId);
        const newIndex = items.indexOf(overId);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const ordered = arrayMove(items, oldIndex, newIndex);
          setMeasures(
            ordered.map((field) => measures.find((item) => item.field === field)!),
          );
        }
      }
      return;
    }

    const removeFrom = (container: string) => {
      if (container === "rows") setRows(rows.filter((item) => item !== activeId));
      if (container === "columns")
        setColumns(columns.filter((item) => item !== activeId));
      if (container === "measures") {
        setMeasures(measures.filter((item) => item.field !== activeId));
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
        if (!measures.some((item) => item.field === activeId)) {
          setMeasures([
            ...measures,
            {
              field: activeId,
              aggregation: field.defaultAggregation ?? "count",
            },
          ]);
        }
      }
    };

    if (overContainer === "available") {
      removeFrom(activeContainer);
      return;
    }

    removeFrom(activeContainer);
    addTo(overContainer);
  };

  const updateMeasure = (field: string, aggregation: AggregationType) => {
    setMeasures((prev) =>
      prev.map((item) => (item.field === field ? { ...item, aggregation } : item)),
    );
  };

  const removeMeasure = (field: string) => {
    setMeasures((prev) => prev.filter((item) => item.field !== field));
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
                  {chartOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FilterPanel fields={fields} filters={filters} onChange={setFilters} />

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
                items={measures.map((item) => item.field)}
                renderItem={(item) => {
                  const measure = measures.find((entry) => entry.field === item);
                  const field = fieldsById.get(item);
                  return (
                    <SortableField id={item} label={field?.name ?? item}>
                      <MeasureConfig
                        aggregation={measure?.aggregation ?? "count"}
                        options={aggregationOptionsForField(field)}
                        onChange={(next) => updateMeasure(item, next)}
                        onRemove={() => removeMeasure(item)}
                      />
                    </SortableField>
                  );
                }}
              />
            </div>
          </DndContext>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => runMutation.mutate()}>
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
            <Badge variant="secondary">{activeOrganizationId ?? "No org"}</Badge>
          </div>

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
      />
    </div>
  );
}
