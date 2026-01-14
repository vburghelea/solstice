import { useMemo } from "react";
import { BarChart2, Download } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { NlQueryVisualizationSuggestion } from "./nl-query.types";

export interface QueryResultsProps {
  results: Array<Record<string, unknown>>;
  suggestedVisualization?: NlQueryVisualizationSuggestion | null;
  onClear?: () => void;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  }
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function exportToCsv(results: unknown[], filename: string) {
  if (results.length === 0) return;

  const firstRow = results[0] as Record<string, unknown>;
  const headers = Object.keys(firstRow);

  const csvRows = [
    headers.join(","),
    ...results.map((row) => {
      const record = row as Record<string, unknown>;
      return headers
        .map((header) => {
          const value = record[header];
          const formatted = formatCellValue(value);
          return formatted.includes(",") ? `"${formatted}"` : formatted;
        })
        .join(",");
    }),
  ];

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function QueryResults({
  results,
  suggestedVisualization,
  onClear,
}: QueryResultsProps) {
  const columns = useMemo(() => {
    if (results.length === 0) return [];
    const firstRow = results[0] as Record<string, unknown>;
    return Object.keys(firstRow);
  }, [results]);

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No results</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Query Results ({results.length} rows)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportToCsv(results, "nl-query-results.csv")}
          >
            <Download className="mr-1.5 h-4 w-4" aria-hidden />
            Export CSV
          </Button>
          {onClear && (
            <Button type="button" size="sm" variant="ghost" onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {suggestedVisualization && (
          <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <BarChart2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              For {suggestedVisualization.chartType} visualization, use the Pivot Builder
              above - {suggestedVisualization.reason}
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col} className="whitespace-nowrap">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.slice(0, 100).map((row, i) => {
                const record = row as Record<string, unknown>;
                return (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col} className="whitespace-nowrap">
                        {formatCellValue(record[col])}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {results.length > 100 && (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Showing first 100 of {results.length} rows. Export to see all.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
