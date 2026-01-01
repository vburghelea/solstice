import { useMemo } from "react";
import type { ChartType, PivotResult } from "../../bi.schemas";
import { buildPivotChartOptions } from "../charts/pivot-chart";
import { ChartContainer } from "../charts/ChartContainer";
import { KpiCard } from "../charts/KpiCard";
import { PivotTable } from "../pivot-table/PivotTable";
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
}: {
  pivot: PivotResult | null;
  chartType: ChartType;
  selectedMeasureKey: string;
  onMeasureChange: (key: string) => void;
  showRowTotals: boolean;
  showColumnTotals: boolean;
  showGrandTotal: boolean;
  fieldLabels?: Map<string, string>;
}) {
  const chartOption = useMemo(() => {
    if (!pivot || !selectedMeasureKey) return null;
    return buildPivotChartOptions(pivot, chartType, selectedMeasureKey);
  }, [pivot, chartType, selectedMeasureKey]);

  if (!pivot) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
        Run a query to preview results.
      </div>
    );
  }

  const showMeasureSelector = pivot.measures.length > 1 && chartType !== "table";

  return (
    <div className="space-y-3">
      {showMeasureSelector ? (
        <Select value={selectedMeasureKey} onValueChange={onMeasureChange}>
          <SelectTrigger className="w-64">
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
        <ChartContainer option={chartOption} />
      ) : (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          Select a chart type to preview results.
        </div>
      )}
    </div>
  );
}
