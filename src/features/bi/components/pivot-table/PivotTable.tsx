import type { PivotResult } from "../../bi.schemas";
import { Table, TableBody, TableHeader } from "~/components/ui/table";
import { PivotHeader } from "./PivotHeader";
import { PivotRow } from "./PivotRow";
import { TotalsRow } from "./TotalsRow";

const sumValues = (values: Array<number | null>) => {
  const hasValue = values.some((value) => typeof value === "number");
  if (!hasValue) return null;
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
};

export function PivotTable({
  pivot,
  showRowTotals = true,
  showColumnTotals = true,
  showGrandTotal = true,
  fieldLabels,
  measureFormatters,
}: {
  pivot: PivotResult;
  showRowTotals?: boolean;
  showColumnTotals?: boolean;
  showGrandTotal?: boolean;
  fieldLabels?: Map<string, string>;
  measureFormatters?: Map<string, (value: number | null) => string>;
}) {
  const rowTotals = pivot.rows.map((row) => {
    const totals: Record<string, number | null> = {};
    for (const measure of pivot.measures) {
      const values = pivot.columnKeys.map(
        (column) => row.cells[column.key]?.[measure.key] ?? null,
      );
      totals[measure.key] = sumValues(values);
    }
    return totals;
  });

  const columnTotals = pivot.columnKeys.map((column) => {
    const totals: Record<string, number | null> = {};
    for (const measure of pivot.measures) {
      const values = pivot.rows.map(
        (row) => row.cells[column.key]?.[measure.key] ?? null,
      );
      totals[measure.key] = sumValues(values);
    }
    return totals;
  });

  const grandTotals: Record<string, number | null> = {};
  for (const measure of pivot.measures) {
    const values = pivot.rows.flatMap((row) =>
      pivot.columnKeys.map((column) => row.cells[column.key]?.[measure.key] ?? null),
    );
    grandTotals[measure.key] = sumValues(values);
  }

  return (
    <div className="overflow-x-auto" data-testid="pivot-table">
      <Table>
        <TableHeader>
          <PivotHeader
            rowFields={pivot.rowFields}
            columnKeys={pivot.columnKeys}
            measures={pivot.measures}
            showRowTotals={showRowTotals}
            {...(fieldLabels ? { fieldLabels } : {})}
          />
        </TableHeader>
        <TableBody>
          {pivot.rows.map((row, index) => (
            <PivotRow
              key={row.key}
              row={row}
              rowFields={pivot.rowFields}
              columnKeys={pivot.columnKeys}
              measures={pivot.measures}
              rowTotals={rowTotals[index] ?? {}}
              showRowTotals={showRowTotals}
              {...(measureFormatters ? { measureFormatters } : {})}
            />
          ))}
          {showColumnTotals ? (
            <TotalsRow
              label="Total"
              rowFields={pivot.rowFields}
              columnKeys={pivot.columnKeys}
              measures={pivot.measures}
              columnTotals={columnTotals}
              grandTotals={grandTotals}
              showRowTotals={showRowTotals}
              showGrandTotal={showGrandTotal}
              {...(measureFormatters ? { measureFormatters } : {})}
            />
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
