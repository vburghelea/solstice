import type { PivotResult } from "../../bi.schemas";
import { TableHead, TableRow } from "~/components/ui/table";

export function PivotHeader({
  rowFields,
  columnKeys,
  measures,
  showRowTotals,
  fieldLabels,
}: {
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  showRowTotals: boolean;
  fieldLabels?: Map<string, string>;
}) {
  const hasMultipleMeasures = measures.length > 1;

  return (
    <>
      <TableRow>
        {rowFields.map((field) => (
          <TableHead key={field} rowSpan={hasMultipleMeasures ? 2 : 1}>
            {fieldLabels?.get(field) ?? field}
          </TableHead>
        ))}
        {columnKeys.map((column) => (
          <TableHead key={column.key} colSpan={measures.length}>
            {column.label}
          </TableHead>
        ))}
        {showRowTotals ? <TableHead colSpan={measures.length}>Total</TableHead> : null}
      </TableRow>
      {hasMultipleMeasures ? (
        <TableRow>
          {columnKeys.map((column) =>
            measures.map((measure) => (
              <TableHead key={`${column.key}:${measure.key}`}>{measure.label}</TableHead>
            )),
          )}
          {showRowTotals
            ? measures.map((measure) => (
                <TableHead key={`total:${measure.key}`}>{measure.label}</TableHead>
              ))
            : null}
        </TableRow>
      ) : null}
    </>
  );
}
