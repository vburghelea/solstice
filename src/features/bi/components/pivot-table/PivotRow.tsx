import type { PivotResult } from "../../bi.schemas";
import { TableCell, TableRow } from "~/components/ui/table";

export function PivotRow({
  row,
  rowFields,
  columnKeys,
  measures,
  rowTotals,
  showRowTotals,
}: {
  row: PivotResult["rows"][number];
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  rowTotals: Record<string, number | null>;
  showRowTotals: boolean;
}) {
  return (
    <TableRow>
      {rowFields.map((field) => (
        <TableCell key={`${row.key}:${field}`}>{row.values[field] ?? ""}</TableCell>
      ))}
      {columnKeys.map((column) =>
        measures.map((measure) => (
          <TableCell key={`${row.key}:${column.key}:${measure.key}`}>
            {row.cells[column.key]?.[measure.key] ?? ""}
          </TableCell>
        )),
      )}
      {showRowTotals
        ? measures.map((measure) => (
            <TableCell key={`${row.key}:total:${measure.key}`}>
              {rowTotals[measure.key] ?? ""}
            </TableCell>
          ))
        : null}
    </TableRow>
  );
}
