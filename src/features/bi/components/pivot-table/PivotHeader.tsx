import type { PivotResult } from "../../bi.schemas";
import type { DatasetField } from "../../bi.types";
import { formatDimensionValue } from "../../utils/formatting";
import { TableHead, TableRow } from "~/components/ui/table";

export function PivotHeader({
  rowFields,
  columnKeys,
  measures,
  showRowTotals,
  fieldLabels,
  fieldsById,
}: {
  rowFields: PivotResult["rowFields"];
  columnKeys: PivotResult["columnKeys"];
  measures: PivotResult["measures"];
  showRowTotals: boolean;
  fieldLabels?: Map<string, string>;
  fieldsById?: Map<string, DatasetField>;
}) {
  const hasMultipleMeasures = measures.length > 1;
  const resolveColumnLabel = (column: PivotResult["columnKeys"][number]) => {
    if (!fieldsById) return column.label;
    const entries = Object.entries(column.values);
    if (entries.length === 0) return "Total";
    return entries
      .map(([fieldId, value]) => {
        const field = fieldsById.get(fieldId);
        const label = field?.name ?? fieldId;
        const formatted = formatDimensionValue(value, field);
        return `${label}: ${formatted}`;
      })
      .join(" / ");
  };

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
            {resolveColumnLabel(column)}
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
