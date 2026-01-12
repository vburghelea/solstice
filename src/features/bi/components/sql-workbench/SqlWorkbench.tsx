import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { exportSqlResults } from "~/features/bi/bi.mutations";
import {
  executeSqlQuery,
  getAvailableDatasets,
  getDatasetFields,
} from "~/features/bi/bi.queries";
import type { DatasetField } from "~/features/bi/bi.types";
import {
  QueryHistory,
  type QueryHistoryEntry,
} from "~/features/bi/components/sql-workbench/QueryHistory";
import { ResultsTable } from "~/features/bi/components/sql-workbench/ResultsTable";
import { SchemaBrowser } from "~/features/bi/components/sql-workbench/SchemaBrowser";
import { SqlEditor } from "~/features/bi/components/sql-workbench/SqlEditor";
import { useOrgContext } from "~/features/organizations/org-context";
import { useLocalStorage } from "~/shared/hooks/useLocalStorage";
import type { JsonRecord } from "~/shared/lib/json";

const PARAM_REGEX = /\{\{([a-zA-Z_][\w]*)\}\}/g;
const HISTORY_LIMIT = 10;

const extractParams = (sqlText: string) => {
  const params = new Set<string>();
  let match: RegExpExecArray | null = null;
  while ((match = PARAM_REGEX.exec(sqlText)) !== null) {
    params.add(match[1]);
  }
  return Array.from(params);
};

export function SqlWorkbench() {
  const { activeOrganizationId } = useOrgContext();
  const [sqlText, setSqlText] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "json">("csv");
  const [history, setHistory] = useLocalStorage<QueryHistoryEntry[]>(
    "bi.sql.history",
    [],
  );
  const [rows, setRows] = useState<JsonRecord[]>([]);
  const editorViewRef = useRef<EditorView | null>(null);
  const { requestStepUp } = useStepUpPrompt();

  const datasetsQuery = useQuery({
    queryKey: ["bi-datasets"],
    queryFn: () => getAvailableDatasets(),
  });

  const datasets = datasetsQuery.data?.datasets ?? [];
  const datasetLabels = useMemo(
    () => new Map(datasets.map((dataset) => [dataset.id, dataset.name])),
    [datasets],
  );

  useEffect(() => {
    if (!datasetId && datasets.length > 0) {
      setDatasetId(datasets[0]?.id ?? "");
    }
  }, [datasetId, datasets]);

  const fieldsQuery = useQuery({
    queryKey: ["bi-fields", datasetId],
    queryFn: () =>
      datasetId ? getDatasetFields({ data: { datasetId } }) : Promise.resolve(null),
    enabled: Boolean(datasetId),
  });

  const fields = (fieldsQuery.data?.fields ?? []) as DatasetField[];
  const columnNames = useMemo(() => {
    const set = new Set<string>();
    fields.forEach((field) => {
      if (field.sourceColumn) {
        set.add(field.sourceColumn.toLowerCase());
      }
    });
    return Array.from(set);
  }, [fields]);

  const sqlSchema = useMemo(() => {
    if (!datasetId || columnNames.length === 0) return undefined;
    const viewName = `bi_v_${datasetId}`;
    return {
      [datasetId]: columnNames,
      [viewName]: columnNames,
    };
  }, [datasetId, columnNames]);

  const paramNames = useMemo(() => extractParams(sqlText), [sqlText]);

  useEffect(() => {
    setParamValues((prev) => {
      const next: Record<string, string> = { ...prev };
      for (const name of paramNames) {
        if (!(name in next)) next[name] = "";
      }
      Object.keys(next).forEach((key) => {
        if (!paramNames.includes(key)) delete next[key];
      });
      return next;
    });
  }, [paramNames]);

  const visibleHistory = useMemo(
    () =>
      history.filter((entry) => entry.organizationId === (activeOrganizationId ?? null)),
    [history, activeOrganizationId],
  );

  const handleInsertSnippet = useCallback(
    (snippet: string) => {
      if (!snippet.trim()) return;

      const view = editorViewRef.current;
      if (view) {
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: snippet },
        });
        view.focus();
        return;
      }

      setSqlText((prev) => {
        if (!prev.trim()) return snippet;
        const needsSpace = !prev.endsWith(" ") && !snippet.startsWith(" ");
        return `${prev}${needsSpace ? " " : ""}${snippet}`;
      });
    },
    [setSqlText],
  );

  const queryMutation = useMutation({
    mutationFn: async () => {
      if (!sqlText.trim()) {
        throw new Error("SQL query is required.");
      }
      if (!datasetId) {
        throw new Error("Select a dataset to run SQL queries.");
      }

      const data = {
        sql: sqlText,
        parameters: paramValues,
        datasetId,
      };

      return executeSqlQuery({ data });
    },
    onSuccess: (result) => {
      setRows(result?.rows ?? []);
      const entry: QueryHistoryEntry = {
        id: crypto.randomUUID(),
        sql: sqlText,
        datasetId,
        organizationId: activeOrganizationId ?? null,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => {
        const currentOrg = activeOrganizationId ?? null;
        const otherEntries = prev.filter((item) => item.organizationId !== currentOrg);
        const currentEntries = prev.filter(
          (item) =>
            item.organizationId === currentOrg &&
            !(item.sql === entry.sql && item.datasetId === entry.datasetId),
        );
        return [...[entry, ...currentEntries].slice(0, HISTORY_LIMIT), ...otherEntries];
      });
      toast.success("Query executed.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "SQL execution failed.");
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!sqlText.trim()) {
        throw new Error("SQL query is required.");
      }
      if (!datasetId) {
        throw new Error("Select a dataset to export.");
      }
      return exportSqlResults({
        data: {
          sql: sqlText,
          parameters: paramValues,
          datasetId,
          format: exportFormat,
        },
      });
    },
    onSuccess: (result) => {
      if (!result?.data) return;
      const encoding = result.encoding ?? "utf-8";
      const blobData =
        encoding === "base64"
          ? Uint8Array.from(atob(result.data), (char) => char.charCodeAt(0))
          : result.data;
      const blob = new Blob([blobData], {
        type: result.mimeType ?? "text/csv",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.fileName ?? "sql-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      const message = getStepUpErrorMessage(error);
      if (message) {
        requestStepUp(message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "SQL export failed.");
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SQL editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Dataset</Label>
              <Select value={datasetId} onValueChange={setDatasetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select dataset" />
                </SelectTrigger>
                <SelectContent>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SqlEditor
              value={sqlText}
              onChange={setSqlText}
              onCreateEditor={(view) => {
                editorViewRef.current = view;
              }}
              {...(sqlSchema ? { schema: sqlSchema } : {})}
              {...(datasetId ? { defaultTable: datasetId } : {})}
            />

            {paramNames.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {paramNames.map((name) => (
                  <div key={name} className="space-y-1">
                    <Label>{name}</Label>
                    <Input
                      value={paramValues[name] ?? ""}
                      onChange={(event) =>
                        setParamValues((prev) => ({
                          ...prev,
                          [name]: event.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => queryMutation.mutate()}
                disabled={queryMutation.isPending}
                aria-describedby="sql-shortcuts"
              >
                Run query
              </Button>
              <Select
                value={exportFormat}
                onValueChange={(value) =>
                  setExportFormat(value as "csv" | "xlsx" | "json")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? "Exporting..." : "Export"}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs" id="sql-shortcuts">
              Keyboard shortcut: Press Ctrl or Cmd + Enter to run the query from the
              editor.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ResultsTable rows={rows} />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <SchemaBrowser datasetId={datasetId} onInsert={handleInsertSnippet} />
        <Card>
          <CardHeader>
            <CardTitle>Query history</CardTitle>
          </CardHeader>
          <CardContent>
            <QueryHistory
              history={visibleHistory}
              datasetLabels={datasetLabels}
              onSelect={(entry) => {
                setSqlText(entry.sql);
                setDatasetId(entry.datasetId);
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
