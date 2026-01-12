import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { getSqlSchema } from "~/features/bi/bi.queries";

type SchemaColumn = {
  name: string;
  dataType: string;
  isNullable: boolean;
  label: string | null;
  description: string | null;
  piiClassification: string;
};

type SchemaTable = {
  datasetId: string;
  datasetName: string;
  viewName: string;
  description: string;
  columns: SchemaColumn[];
};

type SchemaBrowserProps = {
  datasetId: string;
  onInsert: (value: string) => void;
};

export function SchemaBrowser({ datasetId, onInsert }: SchemaBrowserProps) {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bi-sql-schema", datasetId],
    queryFn: () => getSqlSchema({ data: { datasetId } }),
    enabled: Boolean(datasetId),
  });

  const tables = (data?.tables ?? []) as SchemaTable[];
  const canViewCatalog = data?.isGlobalAdmin ?? false;

  const filteredTables = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tables;

    return tables.flatMap((table) => {
      const tableMatches =
        table.viewName.toLowerCase().includes(term) ||
        table.datasetName.toLowerCase().includes(term);
      if (tableMatches) return [table];

      const filteredColumns = table.columns.filter((column) => {
        const label = column.label?.toLowerCase() ?? "";
        return column.name.toLowerCase().includes(term) || label.includes(term);
      });

      if (filteredColumns.length === 0) return [];
      return [
        {
          ...table,
          columns: filteredColumns,
        },
      ];
    });
  }, [search, tables]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Schema browser</CardTitle>
          <p className="text-muted-foreground text-xs">Curated SQL views only.</p>
        </div>
        {canViewCatalog ? (
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard/admin/sin/data-catalog">Data catalog</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Search tables or columns"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search tables or columns"
        />
        {!datasetId ? (
          <p className="text-muted-foreground text-sm">Select a dataset first.</p>
        ) : isLoading ? (
          <p className="text-muted-foreground text-sm">Loading schema…</p>
        ) : isError ? (
          <p className="text-destructive text-sm">Schema lookup failed.</p>
        ) : filteredTables.length === 0 ? (
          <p className="text-muted-foreground text-sm">No tables match your search.</p>
        ) : (
          <div className="space-y-3" role="tree" aria-label="Tables and columns">
            {filteredTables.map((table, index) => (
              <div
                key={table.viewName}
                className="rounded-md border"
                role="treeitem"
                aria-level={1}
                aria-expanded
                aria-label={`${table.datasetName} ${table.viewName}`}
                aria-setsize={filteredTables.length}
                aria-posinset={index + 1}
              >
                <div className="flex items-start justify-between gap-3 border-b bg-muted/40 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{table.datasetName}</p>
                    <p className="text-muted-foreground text-xs">{table.viewName}</p>
                    {table.description ? (
                      <p className="text-muted-foreground text-xs">{table.description}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    aria-label={`Insert table ${table.viewName}`}
                    onClick={() => onInsert(table.viewName)}
                  >
                    Insert table
                  </Button>
                </div>
                <div
                  className="max-h-64 divide-y overflow-auto"
                  role="group"
                  aria-label={`Columns for ${table.viewName}`}
                >
                  {table.columns.map((column, columnIndex) => (
                    <button
                      key={`${table.viewName}.${column.name}`}
                      type="button"
                      onClick={() => onInsert(`${table.viewName}.${column.name}`)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs hover:bg-muted/50"
                      aria-label={`Insert column ${column.name}${column.label ? ` (${column.label})` : ""} from ${table.viewName}`}
                      role="treeitem"
                      aria-level={2}
                      aria-setsize={table.columns.length}
                      aria-posinset={columnIndex + 1}
                    >
                      <div className="space-y-1">
                        <p className="font-mono text-xs">{column.name}</p>
                        {column.label ? (
                          <p className="text-muted-foreground text-[11px]">
                            {column.label}
                          </p>
                        ) : null}
                        {column.description ? (
                          <p className="text-muted-foreground text-[11px]">
                            {column.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline">{column.dataType}</Badge>
                        <span className="text-muted-foreground text-[11px]">
                          {column.isNullable ? "nullable" : "required"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
