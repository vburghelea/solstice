import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
} from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { useOrgContext } from "~/features/organizations/org-context";
import type { JsonRecord } from "~/shared/lib/json";
import { DATA_SOURCE_CONFIG, type ReportDataSource } from "../reports.config";
import { exportPivotData, runPivotQuery } from "../reports.mutations";
import type { PivotQueryInput } from "../reports.schemas";

const dataSourceOptions: Array<{ value: ReportDataSource; label: string }> = [
  { value: "organizations", label: "Organizations" },
  { value: "reporting_submissions", label: "Reporting submissions" },
  { value: "form_submissions", label: "Form submissions" },
];

const aggregationOptions = [
  { value: "count", label: "Count" },
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Average" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
];

const chartTypeOptions = [
  { value: "table", label: "Table" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "pie", label: "Pie" },
  { value: "heatmap", label: "Heatmap" },
];

type PivotMeasure = {
  field: string;
  aggregation: "count" | "sum" | "avg" | "min" | "max";
};

type PivotResult = {
  rowFields: string[];
  columnFields: string[];
  measures: Array<{
    key: string;
    label: string;
    field: string | null;
    aggregation: string;
  }>;
  columnKeys: Array<{ key: string; label: string; values: Record<string, string> }>;
  rows: Array<{
    key: string;
    values: Record<string, string>;
    cells: Record<string, Record<string, number | null>>;
  }>;
};

const parseFilters = (input: string): JsonRecord | undefined | null => {
  if (!input.trim()) return undefined;
  try {
    return JSON.parse(input) as JsonRecord;
  } catch {
    return null;
  }
};

const joinLabel = (values: Record<string, string>, fallback: string) => {
  const entries = Object.entries(values);
  if (entries.length === 0) return fallback;
  return entries.map(([field, value]) => `${field}: ${value || "-"}`).join(" / ");
};

const buildChartOptions = (pivot: PivotResult, chartType: string, measureKey: string) => {
  const rowLabels = pivot.rows.map((row) =>
    joinLabel(row.values, pivot.rowFields.length === 0 ? "Total" : ""),
  );
  const columnLabels = pivot.columnKeys.map((column) => column.label);

  const matrix = pivot.rows.map((row) =>
    pivot.columnKeys.map((column) => row.cells[column.key]?.[measureKey] ?? 0),
  );

  if (chartType === "pie") {
    return {
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: "65%",
          data: rowLabels.map((label, index) => ({
            name: label || "Total",
            value: matrix[index]?.reduce((acc, value) => acc + (value ?? 0), 0) ?? 0,
          })),
        },
      ],
    };
  }

  if (chartType === "heatmap") {
    const data = [] as Array<[number, number, number]>;
    matrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        data.push([colIndex, rowIndex, value ?? 0]);
      });
    });

    return {
      tooltip: { position: "top" },
      grid: { height: "70%", top: "10%" },
      xAxis: { type: "category", data: columnLabels },
      yAxis: { type: "category", data: rowLabels },
      visualMap: {
        min: 0,
        max: Math.max(...data.map((item) => item[2]), 1),
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "2%",
      },
      series: [
        {
          type: "heatmap",
          data,
          emphasis: {
            itemStyle: { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.3)" },
          },
        },
      ],
    };
  }

  const series = columnLabels.map((label, index) => ({
    name: label,
    type: chartType === "area" ? "line" : chartType,
    areaStyle: chartType === "area" ? {} : undefined,
    data: matrix.map((row) => row[index] ?? 0),
  }));

  return {
    tooltip: { trigger: "axis" },
    legend: { data: columnLabels },
    xAxis: { type: "category", data: rowLabels },
    yAxis: { type: "value" },
    series,
  };
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-background flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-xs font-medium">
        {label}
      </span>
      {children}
    </div>
  );
}

function PivotDropZone({
  id,
  label,
  items,
  renderItem,
}: {
  id: string;
  label: string;
  items: string[];
  renderItem: (item: string) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        ref={setNodeRef}
        className={`rounded-md border p-2 ${isOver ? "bg-muted/40" : "bg-muted/20"}`}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {items.length === 0 ? (
              <p className="text-muted-foreground text-xs">Drop fields here</p>
            ) : (
              items.map((item) => <div key={item}>{renderItem(item)}</div>)
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function PivotTable({ pivot }: { pivot: PivotResult }) {
  const tableData = useMemo(() => {
    return pivot.rows.map((row) => {
      const record: Record<string, unknown> = { ...row.values };
      for (const column of pivot.columnKeys) {
        for (const measure of pivot.measures) {
          const key = `${column.key}::${measure.key}`;
          record[key] = row.cells[column.key]?.[measure.key] ?? null;
        }
      }
      return record;
    });
  }, [pivot]);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const base = pivot.rowFields.map((field) => ({
      accessorKey: field,
      header: field,
    }));

    const pivotColumns = pivot.columnKeys.flatMap((column) =>
      pivot.measures.map((measure) => ({
        accessorKey: `${column.key}::${measure.key}`,
        header: `${column.label} • ${measure.label}`,
      })),
    );

    return [...base, ...pivotColumns];
  }, [pivot]);

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? rowVirtualizer.getTotalSize() - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div ref={parentRef} className="max-h-[420px] overflow-auto rounded-md border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-3 py-2 text-xs font-semibold">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {paddingTop > 0 ? (
            <tr>
              <td style={{ height: paddingTop }} colSpan={columns.length} />
            </tr>
          ) : null}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2 text-xs">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
          {paddingBottom > 0 ? (
            <tr>
              <td style={{ height: paddingBottom }} colSpan={columns.length} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export function ReportPivotBuilder() {
  const { activeOrganizationId } = useOrgContext();
  const { requestStepUp } = useStepUpPrompt();
  const [dataSource, setDataSource] = useState<ReportDataSource>("reporting_submissions");
  const [rows, setRows] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [measures, setMeasures] = useState<PivotMeasure[]>([]);
  const [filtersInput, setFiltersInput] = useState("");
  const [chartType, setChartType] = useState("table");
  const [pivotResult, setPivotResult] = useState<PivotResult | null>(null);
  const [selectedMeasureKey, setSelectedMeasureKey] = useState<string>("");
  const [ChartComponent, setChartComponent] = useState<null | ComponentType<{
    option: unknown;
    style?: CSSProperties;
  }>>(null);

  const allowedFields = [...DATA_SOURCE_CONFIG[dataSource].allowedColumns] as string[];
  const usedFields = new Set([
    ...rows,
    ...columns,
    ...measures.map((item) => item.field),
  ]);
  const availableFields = allowedFields.filter((field) => !usedFields.has(field));

  const sensors = useSensors(useSensor(PointerSensor));

  useEffect(() => {
    let active = true;
    import("echarts-for-react")
      .then((mod) => {
        if (active) {
          const component = mod.default as ComponentType<{
            option: unknown;
            style?: CSSProperties;
          }>;
          setChartComponent(() => component);
        }
      })
      .catch(() => {
        if (active) setChartComponent(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDataSourceChange = (value: string) => {
    setDataSource(value as ReportDataSource);
    setRows([]);
    setColumns([]);
    setMeasures([]);
    setPivotResult(null);
    setSelectedMeasureKey("");
  };

  const runMutation = useMutation({
    mutationFn: async () => {
      if (measures.length === 0) {
        throw new Error("Add at least one measure.");
      }
      const parsed = parseFilters(filtersInput);
      if (parsed === null) {
        throw new Error("Filters JSON is invalid.");
      }

      const payload: PivotQueryInput = {
        dataSource,
        organizationId: activeOrganizationId ?? undefined,
        filters: parsed ?? undefined,
        rows,
        columns,
        measures,
      };

      return runPivotQuery({ data: payload });
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
    mutationFn: async (exportType: "csv" | "excel") => {
      if (measures.length === 0) {
        throw new Error("Add at least one measure before exporting.");
      }
      const parsed = parseFilters(filtersInput);
      if (parsed === null) {
        throw new Error("Filters JSON is invalid.");
      }

      return exportPivotData({
        data: {
          dataSource,
          organizationId: activeOrganizationId ?? undefined,
          filters: parsed ?? undefined,
          rows,
          columns,
          measures,
          exportType,
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
      if (container === "rows" && !rows.includes(activeId)) {
        setRows([...rows, activeId]);
      }
      if (container === "columns" && !columns.includes(activeId)) {
        setColumns([...columns, activeId]);
      }
      if (container === "measures" && !measures.some((item) => item.field === activeId)) {
        setMeasures([...measures, { field: activeId, aggregation: "count" }]);
      }
    };

    if (overContainer === "available") {
      removeFrom(activeContainer);
      return;
    }

    removeFrom(activeContainer);
    addTo(overContainer);
  };

  const updateMeasure = (field: string, aggregation: PivotMeasure["aggregation"]) => {
    setMeasures((prev) =>
      prev.map((item) => (item.field === field ? { ...item, aggregation } : item)),
    );
  };

  const chartOption = useMemo(() => {
    if (!pivotResult || !selectedMeasureKey) return null;
    return buildChartOptions(pivotResult, chartType, selectedMeasureKey);
  }, [pivotResult, chartType, selectedMeasureKey]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pivot builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data source</Label>
              <Select value={dataSource} onValueChange={handleDataSourceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select data source" />
                </SelectTrigger>
                <SelectContent>
                  {dataSourceOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Filters (JSON)</Label>
              <Textarea
                rows={2}
                placeholder='{"status": "submitted"}'
                value={filtersInput}
                onChange={(event) => setFiltersInput(event.target.value)}
              />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="grid gap-4 lg:grid-cols-4">
              <PivotDropZone
                id="available"
                label="Available fields"
                items={availableFields}
                renderItem={(item) => <SortableField id={item} label={item} />}
              />
              <PivotDropZone
                id="rows"
                label="Rows"
                items={rows}
                renderItem={(item) => <SortableField id={item} label={item} />}
              />
              <PivotDropZone
                id="columns"
                label="Columns"
                items={columns}
                renderItem={(item) => <SortableField id={item} label={item} />}
              />
              <PivotDropZone
                id="measures"
                label="Measures"
                items={measures.map((item) => item.field)}
                renderItem={(item) => {
                  const measure = measures.find((entry) => entry.field === item);
                  return (
                    <SortableField id={item} label={item}>
                      <Select
                        value={measure?.aggregation ?? "count"}
                        onValueChange={(value) =>
                          updateMeasure(item, value as PivotMeasure["aggregation"])
                        }
                      >
                        <SelectTrigger className="h-7 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {aggregationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </SortableField>
                  );
                }}
              />
            </div>
          </DndContext>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={() => runMutation.mutate()}>
              Run pivot
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
              onClick={() => exportMutation.mutate("excel")}
            >
              Export Excel
            </Button>
            <Badge variant="secondary">{activeOrganizationId ?? "No org"}</Badge>
          </div>
        </CardContent>
      </Card>

      {pivotResult ? (
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Pivot output</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="h-8 w-32">
                  <SelectValue placeholder="Chart" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {pivotResult.measures.length > 1 ? (
                <Select value={selectedMeasureKey} onValueChange={setSelectedMeasureKey}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Measure" />
                  </SelectTrigger>
                  <SelectContent>
                    {pivotResult.measures.map((measure) => (
                      <SelectItem key={measure.key} value={measure.key}>
                        {measure.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {chartType === "table" ? (
              <PivotTable pivot={pivotResult} />
            ) : chartOption && ChartComponent ? (
              <ChartComponent option={chartOption} style={{ height: 360 }} />
            ) : chartOption ? (
              <div className="text-muted-foreground text-sm">Loading chart…</div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
