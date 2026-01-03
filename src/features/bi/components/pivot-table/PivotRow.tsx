import type { PivotResult } from "../../bi.schemas";
import type { DatasetField } from "../../bi.types";
import { formatDimensionValue } from "../../utils/formatting";
import { TableCell, TableRow } from "~/components/ui/table";

export function PivotRow({
  row,
  rowFields,
  columnKeys,
  measures,
  rowTotals,
  showRowTotals,
  measureFormatters,
  fieldsById,
}: {
  row: PivotResult["rows"][number];
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  rowTotals: Record<string, number | null>;
  showRowTotals: boolean;
  measureFormatters?: Map<string, (value: number | null) => string>;
  fieldsById?: Map<string, DatasetField>;
}) {
  return (
    <TableRow>
      {rowFields.map((fieldId) => {
        const rawValue = row.values[fieldId];
        const field = fieldsById?.get(fieldId);
        const displayValue = formatDimensionValue(rawValue, field);
        const title = rawValue === "***" ? "Masked due to access controls" : undefined;
        return (
          <TableCell key={`${row.key}:${fieldId}`} {...(title ? { title } : {})}>
            {displayValue}
          </TableCell>
        );
      })}
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
