import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { BiQueryLogEntry } from "~/features/bi/bi.types";
import { listBiQueryLogs } from "~/features/bi/bi.queries";

const formatDuration = (value: number | null) =>
  typeof value === "number" ? `${value} ms` : "-";

const formatRows = (value: number | null) =>
  typeof value === "number" ? value.toLocaleString() : "-";

const summarizeQuery = (row: BiQueryLogEntry) => {
  if (row.queryType === "sql") {
    return row.sqlQuery ?? "-";
  }
  if (row.queryType === "pivot") {
    return row.pivotConfig ? "Pivot query" : "Pivot query";
  }
  if (row.queryType === "export") {
    return row.sqlQuery ?? "Export query";
  }
  return "-";
};

export function BiQueryLogTable() {
  const [userId, setUserId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [queryType, setQueryType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const queryData = useMemo(
    () => ({
      limit: 50,
      userId: userId || undefined,
      organizationId: organizationId || undefined,
      queryType: queryType === "all" ? undefined : queryType,
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    [fromDate, organizationId, queryType, toDate, userId],
  );

  const { data = [], isLoading } = useQuery({
    queryKey: ["bi-query-log", queryData],
    queryFn: () => listBiQueryLogs({ data: queryData }) as Promise<BiQueryLogEntry[]>,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>BI Query Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <Input
            placeholder="User ID"
            value={userId}
            aria-label="Filter by user ID"
            onChange={(event) => setUserId(event.target.value)}
          />
          <Input
            placeholder="Organization ID"
            value={organizationId}
            aria-label="Filter by organization ID"
            onChange={(event) => setOrganizationId(event.target.value)}
          />
          <Select value={queryType} onValueChange={setQueryType}>
            <SelectTrigger className="h-9" aria-label="Filter by query type">
              <SelectValue placeholder="Query type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="pivot">Pivot</SelectItem>
              <SelectItem value="export">Export</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="date"
            value={fromDate}
            aria-label="Filter from date"
            onChange={(event) => setFromDate(event.target.value)}
          />
          <Input
            type="date"
            value={toDate}
            aria-label="Filter to date"
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Query</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  Loading query logs…
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground text-center">
                  No BI query logs yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{new Date(row.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{row.queryType}</TableCell>
                  <TableCell>{row.userId}</TableCell>
                  <TableCell>{row.organizationId ?? "-"}</TableCell>
                  <TableCell>{formatRows(row.rowsReturned)}</TableCell>
                  <TableCell>{formatDuration(row.executionTimeMs)}</TableCell>
                  <TableCell className="max-w-[240px] truncate font-mono text-xs">
                    {summarizeQuery(row)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
