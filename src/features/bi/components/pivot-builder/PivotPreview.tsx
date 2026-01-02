import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type {
  AggregationType,
  ChartType,
  PivotMeasure,
  PivotResult,
} from "../../bi.schemas";
import { buildPivotChartOptions } from "../charts/pivot-chart";
import { ChartWrapper } from "../charts/ChartWrapper";
import { KpiCard } from "../charts/KpiCard";
import { PivotTable } from "../pivot-table/PivotTable";
import { Button } from "~/components/ui/button";
import { buildMeasureFormatters } from "../../utils/formatting";
import type { ChartOptions, DatasetField } from "../../bi.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

const sumMeasure = (pivot: PivotResult, measureKey: string) => {
  const values = pivot.rows.flatMap((row) =>
    pivot.columnKeys.map((column) => row.cells[column.key]?.[measureKey] ?? null),
  );
  const hasValue = values.some((value) => typeof value === "number");
  if (!hasValue) return null;
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
};

export function PivotPreview({
  pivot,
  chartType,
  selectedMeasureKey,
  onMeasureChange,
  showRowTotals,
  showColumnTotals,
  showGrandTotal,
  fieldLabels,
  fieldsById,
  chartOptions,
  rows,
  columns,
  measures,
  isLoading,
  onApplySample,
}: {
  pivot: PivotResult | null;
  chartType: ChartType;
  selectedMeasureKey: string;
  onMeasureChange: (key: string) => void;
  showRowTotals: boolean;
  showColumnTotals: boolean;
  showGrandTotal: boolean;
  fieldLabels?: Map<string, string>;
  fieldsById?: Map<string, DatasetField>;
  chartOptions?: ChartOptions;
  rows: string[];
  columns: string[];
  measures: PivotMeasure[];
  isLoading?: boolean;
  onApplySample?: () => void;
}) {
  const chartOption = useMemo(() => {
    if (!pivot || !selectedMeasureKey) return null;
    return buildPivotChartOptions(
      pivot,
      chartType,
      selectedMeasureKey,
      chartOptions,
      fieldsById,
    );
  }, [pivot, chartType, selectedMeasureKey, chartOptions, fieldsById]);
  const selectedMeasureLabel =
    pivot?.measures.find((measure) => measure.key === selectedMeasureKey)?.label ??
    "Value";
  const chartAriaLabel = `${chartType} chart preview`;
  const chartAriaDescription = `Preview of ${selectedMeasureLabel}`;
  const measureFormatters = useMemo(() => {
    if (!pivot || !fieldsById) return undefined;
    return buildMeasureFormatters(pivot.measures, fieldsById);
  }, [fieldsById, pivot]);

  if (!pivot) {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center rounded-md border border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading preview...
          </div>
        </div>
      );
    }

    const hasMeasures = measures.length > 0;
    const hasDimensions = rows.length + columns.length > 0;
    return (
      <div className="space-y-3 rounded-md border border-dashed p-8 text-center text-muted-foreground">
        {!hasMeasures ? (
          <p>Add a measure (like Count) to see totals.</p>
        ) : !hasDimensions ? (
          <>
            <p>Drop a field into Rows or Columns to see a breakdown.</p>
            {onApplySample ? (
              <Button type="button" size="sm" variant="outline" onClick={onApplySample}>
                Try a sample query
              </Button>
            ) : null}
          </>
        ) : (
          <p>Run a query to preview results.</p>
        )}
      </div>
    );
  }

  const showMeasureSelector = pivot.measures.length > 1 && chartType !== "table";

  return (
    <div className="space-y-3">
      {showMeasureSelector ? (
        <Select value={selectedMeasureKey} onValueChange={onMeasureChange}>
          <SelectTrigger className="w-64" aria-label="Select measure">
            <SelectValue placeholder="Select measure" />
          </SelectTrigger>
          <SelectContent>
            {pivot.measures.map((measure) => (
              <SelectItem key={measure.key} value={measure.key}>
                {measure.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {chartType === "table" ? (
        <PivotTable
          pivot={pivot}
          showRowTotals={showRowTotals}
          showColumnTotals={showColumnTotals}
          showGrandTotal={showGrandTotal}
          {...(measureFormatters ? { measureFormatters } : {})}
          {...(fieldLabels ? { fieldLabels } : {})}
        />
      ) : chartType === "kpi" ? (
        <KpiCard
          title={
            pivot.measures.find((measure) => measure.key === selectedMeasureKey)?.label ??
            "KPI"
          }
          value={sumMeasure(pivot, selectedMeasureKey) ?? "-"}
        />
      ) : chartOption ? (
        <ChartWrapper
          options={chartOption}
          ariaLabel={chartAriaLabel}
          ariaDescription={chartAriaDescription}
        />
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Select a chart type to preview results.
        </div>
      )}
    </div>
  );
}
