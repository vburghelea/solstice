import type { PivotResult } from "../../bi.schemas";
import { TableCell, TableRow } from "~/components/ui/table";

export function TotalsRow({
  label,
  rowFields,
  columnKeys,
  measures,
  columnTotals,
  grandTotals,
  showRowTotals,
  showGrandTotal,
  measureFormatters,
}: {
  label: string;
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  columnTotals: Array<Record<string, number | null>>;
  grandTotals: Record<string, number | null>;
  showRowTotals: boolean;
  showGrandTotal: boolean;
  measureFormatters?: Map<string, (value: number | null) => string>;
}) {
  return (
    <TableRow>
      {rowFields.map((field, index) => (
        <TableCell key={`${label}:${field}`} className={index === 0 ? "font-medium" : ""}>
          {index === 0 ? label : ""}
        </TableCell>
      ))}
      {columnKeys.map((column, columnIndex) =>
        measures.map((measure) => (
          <TableCell
            key={`${label}:${column.key}:${measure.key}`}
            className="font-medium"
          >
            {measureFormatters?.get(measure.key)
              ? measureFormatters.get(measure.key)!(
                  columnTotals[columnIndex]?.[measure.key] ?? null,
                )
              : (columnTotals[columnIndex]?.[measure.key] ?? "")}
          </TableCell>
        )),
      )}
      {showRowTotals && showGrandTotal
        ? measures.map((measure) => (
            <TableCell key={`${label}:grand:${measure.key}`} className="font-semibold">
              {measureFormatters?.get(measure.key)
                ? measureFormatters.get(measure.key)!(grandTotals[measure.key] ?? null)
                : (grandTotals[measure.key] ?? "")}
            </TableCell>
          ))
        : showRowTotals
          ? measures.map((measure) => <TableCell key={`${label}:grand:${measure.key}`} />)
          : null}
    </TableRow>
  );
}
