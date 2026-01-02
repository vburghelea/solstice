import type { PivotResult } from "../../bi.schemas";
import { TableCell, TableRow } from "~/components/ui/table";

export function PivotRow({
  row,
  rowFields,
  columnKeys,
  measures,
  rowTotals,
  showRowTotals,
  measureFormatters,
}: {
  row: PivotResult["rows"][number];
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  rowTotals: Record<string, number | null>;
  showRowTotals: boolean;
  measureFormatters?: Map<string, (value: number | null) => string>;
}) {
  return (
    <TableRow>
      {rowFields.map((field) => (
        <TableCell key={`${row.key}:${field}`}>{row.values[field] ?? ""}</TableCell>
      ))}
      {columnKeys.map((column) =>
        measures.map((measure) => (
          <TableCell key={`${row.key}:${column.key}:${measure.key}`}>
            {measureFormatters?.get(measure.key)
              ? measureFormatters.get(measure.key)!(
                  row.cells[column.key]?.[measure.key] ?? null,
                )
              : (row.cells[column.key]?.[measure.key] ?? "")}
          </TableCell>
        )),
      )}
      {showRowTotals
        ? measures.map((measure) => (
            <TableCell key={`${row.key}:total:${measure.key}`}>
              {measureFormatters?.get(measure.key)
                ? measureFormatters.get(measure.key)!(rowTotals[measure.key] ?? null)
                : (rowTotals[measure.key] ?? "")}
            </TableCell>
          ))
        : null}
    </TableRow>
  );
}
