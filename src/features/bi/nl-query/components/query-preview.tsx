import { useMutation } from "@tanstack/react-query";
import { AlertTriangle, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { executeNlQuery } from "../nl-query.mutations";
import type { QueryIntent } from "../nl-query.schemas";
import type { NlQueryExecutionResult } from "./nl-query.types";

export interface QueryPreviewDialogProps {
  intent: QueryIntent;
  organizationId?: string | undefined;
  latencyMs?: number | null | undefined;
  onClose: () => void;
  onQueryExecuted?: ((result: NlQueryExecutionResult) => void) | undefined;
}

const TIME_RANGE_LABELS: Record<string, string> = {
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
  last_year: "Last year",
  ytd: "Year to date",
  all_time: "All time",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: "equals",
  neq: "not equals",
  gt: "greater than",
  gte: "at least",
  lt: "less than",
  lte: "at most",
  in: "in",
  contains: "contains",
};

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const variant =
    confidence >= 0.8 ? "default" : confidence >= 0.6 ? "secondary" : "destructive";
  const label =
    confidence >= 0.8
      ? "High confidence"
      : confidence >= 0.6
        ? "Medium confidence"
        : "Low confidence";

  return (
    <Badge variant={variant} className="gap-1">
      {percent}% - {label}
    </Badge>
  );
}

function formatFilterValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(", ");
  }
  return String(value);
}

export function QueryPreviewDialog({
  intent,
  organizationId,
  latencyMs,
  onClose,
  onQueryExecuted,
}: QueryPreviewDialogProps) {
  const executeMutation = useMutation({
    mutationFn: async () => {
      return executeNlQuery({
        data: {
          intent,
          organizationId,
        },
      });
    },
    onSuccess: (result) => {
      toast.success(`Query returned ${result.rowCount} rows`);
      onQueryExecuted?.(result);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Query execution failed");
    },
  });

  const handleConfirm = () => {
    executeMutation.mutate();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Query Preview</DialogTitle>
          <DialogDescription>
            Review the interpreted query before running
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              Interpretation
            </Label>
            <p className="text-sm">{intent.explanation}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">Dataset</Label>
            <p className="text-sm font-medium">{intent.datasetId}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Metrics</Label>
              <ul className="space-y-0.5">
                {intent.metrics.map((metric) => (
                  <li key={metric} className="text-sm">
                    {metric}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Group By
              </Label>
              {intent.dimensions.length > 0 ? (
                <ul className="space-y-0.5">
                  {intent.dimensions.map((dim) => (
                    <li key={dim} className="text-sm">
                      {dim}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">None</p>
              )}
            </div>
          </div>

          {intent.filters.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Filters</Label>
              <ul className="space-y-0.5">
                {intent.filters.map((filter, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{filter.dimensionId}</span>{" "}
                    {OPERATOR_LABELS[filter.operator] ?? filter.operator}{" "}
                    <span className="text-muted-foreground">
                      {formatFilterValue(filter.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {intent.timeRange && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">
                Time Range
              </Label>
              <p className="text-sm">
                {intent.timeRange.preset
                  ? (TIME_RANGE_LABELS[intent.timeRange.preset] ??
                    intent.timeRange.preset)
                  : `${intent.timeRange.start ?? "..."} to ${intent.timeRange.end ?? "..."}`}
              </p>
            </div>
          )}

          {intent.sort && (
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Sort</Label>
              <p className="text-sm">
                {intent.sort.field} (
                {intent.sort.direction === "asc" ? "ascending" : "descending"})
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <ConfidenceBadge confidence={intent.confidence} />
            {latencyMs !== null && latencyMs !== undefined && (
              <Badge variant="outline">{latencyMs}ms</Badge>
            )}
            <Badge variant="outline">Limit: {intent.limit}</Badge>
          </div>

          {intent.confidence < 0.7 && (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">Low confidence interpretation</p>
                <p>
                  The AI is not confident about this query. Consider rephrasing your
                  question or using the manual query builder.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={executeMutation.isPending}
          >
            {executeMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Play className="mr-2 h-4 w-4" aria-hidden />
            )}
            Run Query
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
