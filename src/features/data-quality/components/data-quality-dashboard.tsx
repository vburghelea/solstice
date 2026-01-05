import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { runDataQualityAudit } from "../data-quality.mutations";
import { listDataQualityRuns } from "../data-quality.queries";
import type { DataQualitySummary } from "../data-quality.types";

export function DataQualityDashboard() {
  const queryClient = useQueryClient();

  const { data: runs = [], isLoading } = useQuery({
    queryKey: ["data-quality", "runs"],
    queryFn: () => listDataQualityRuns({ data: { limit: 5 } }),
  });

  const latestRun = runs[0];
  const summary = (latestRun?.summary ?? {}) as DataQualitySummary;

  const runMutation = useMutation({
    mutationFn: () => runDataQualityAudit({ data: {} }),
    onSuccess: () => {
      toast.success("Data quality check complete.");
      void queryClient.invalidateQueries({ queryKey: ["data-quality", "runs"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Check failed.");
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Data quality overview</CardTitle>
          <Button size="sm" variant="outline" onClick={() => runMutation.mutate()}>
            Run checks
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading data quality runs…</p>
          ) : latestRun ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total submissions</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {summary.totals?.totalSubmissions ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Missing fields</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {summary.totals?.missingFields ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Validation errors</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {summary.totals?.validationErrors ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Low completeness</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {summary.totals?.lowCompleteness ?? 0}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Draft submissions</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-semibold">
                  {summary.totals?.draftSubmissions ?? 0}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No runs recorded yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organization breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary.byOrganization || summary.byOrganization.length === 0 ? (
            <p className="text-muted-foreground text-sm">No data to display.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Missing fields</TableHead>
                    <TableHead>Validation errors</TableHead>
                    <TableHead>Low completeness</TableHead>
                    <TableHead>Drafts</TableHead>
                    <TableHead>Latest submission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.byOrganization.map((row) => (
                    <TableRow key={row.organizationId}>
                      <TableCell className="text-sm font-medium">
                        {row.organizationName ?? row.organizationId}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.totalSubmissions}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.missingFields}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.validationErrors}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.lowCompleteness}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.draftSubmissions}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {row.latestSubmittedAt
                          ? new Date(row.latestSubmittedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
