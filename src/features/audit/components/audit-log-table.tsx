import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { AuditLog } from "~/db/schema";
import { exportAuditLogs, listAuditLogs, verifyAuditHashChain } from "../audit.queries";

export function AuditLogTable() {
  const [actorUserId, setActorUserId] = useState("");
  const [targetOrgId, setTargetOrgId] = useState("");
  const [actionCategory, setActionCategory] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    invalidIds: string[];
  } | null>(null);

  const queryData = useMemo(() => {
    return {
      limit: 50,
      actorUserId: actorUserId || undefined,
      targetOrgId: targetOrgId || undefined,
      actionCategory: actionCategory === "all" ? undefined : actionCategory,
      from: fromDate || undefined,
      to: toDate || undefined,
    };
  }, [actionCategory, actorUserId, fromDate, targetOrgId, toDate]);

  const { data = [] } = useQuery<AuditLog[]>({
    queryKey: ["audit", "logs", queryData],
    queryFn: () => listAuditLogs({ data: queryData }),
  });

  const exportMutation = useMutation({
    mutationFn: async () => exportAuditLogs({ data: queryData }),
    onSuccess: (csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "audit-log-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyAuditHashChain(),
    onSuccess: (result) => {
      setVerifyResult(result);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <Input
            placeholder="Actor user ID"
            value={actorUserId}
            aria-label="Filter by actor user ID"
            onChange={(event) => setActorUserId(event.target.value)}
          />
          <Input
            placeholder="Target organization ID"
            value={targetOrgId}
            aria-label="Filter by target organization ID"
            onChange={(event) => setTargetOrgId(event.target.value)}
          />
          <Select value={actionCategory} onValueChange={setActionCategory}>
            <SelectTrigger className="h-9" aria-label="Filter by action category">
              <SelectValue placeholder="Action category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="AUTH">AUTH</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
              <SelectItem value="DATA">DATA</SelectItem>
              <SelectItem value="EXPORT">EXPORT</SelectItem>
              <SelectItem value="SECURITY">SECURITY</SelectItem>
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
          <Button
            type="button"
            variant="outline"
            onClick={() => exportMutation.mutate()}
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? "Exporting..." : "Export CSV"}
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => verifyMutation.mutate()}
              disabled={verifyMutation.isPending}
            >
              {verifyMutation.isPending ? "Verifying..." : "Verify hash chain"}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground p-1"
                    aria-label="What is hash chain verification?"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Hash chain verification</strong> ensures audit log integrity
                    by checking that each entry's cryptographic hash links to the previous
                    entry. This detects any tampering or unauthorized modifications to the
                    audit trail.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {verifyResult ? (
          <div className="rounded-md border border-gray-200 p-3 text-xs">
            {verifyResult.valid ? (
              <p className="text-emerald-600">Hash chain verified successfully.</p>
            ) : (
              <p className="text-destructive">
                Hash chain invalid for {verifyResult.invalidIds.length} entries.
              </p>
            )}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground text-center">
                  No audit entries yet.
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const includesPii = row.metadata?.["includesPii"] === true;
                const stepUpUsed = row.metadata?.["stepUpAuthUsed"] === true;
                const format = row.metadata?.["format"] as string | undefined;
                return (
                  <TableRow key={row.id}>
                    <TableCell>{new Date(row.occurredAt).toLocaleString()}</TableCell>
                    <TableCell>{row.actionCategory}</TableCell>
                    <TableCell>{row.action}</TableCell>
                    <TableCell>{row.actorUserId ?? "-"}</TableCell>
                    <TableCell>{row.targetType ?? "-"}</TableCell>
                    <TableCell>
                      {row.action.toLowerCase() === "bi.export" ? (
                        <div className="flex flex-wrap gap-1">
                          {format ? <Badge variant="outline">{format}</Badge> : null}
                          <Badge variant={includesPii ? "destructive" : "secondary"}>
                            {includesPii ? "PII" : "No PII"}
                          </Badge>
                          {stepUpUsed ? <Badge variant="secondary">Step-up</Badge> : null}
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
