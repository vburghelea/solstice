import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getStepUpErrorMessage, useStepUpPrompt } from "~/features/auth/step-up";
import { exportPivotResults } from "~/features/bi/bi.mutations";
import type { FilterConfig, PivotQuery } from "~/features/bi/bi.schemas";
import { mergeDashboardFilters } from "~/features/bi/components/dashboard/dashboard-utils";

type ExportFormat = "csv" | "xlsx" | "json";

export type ExportableWidget = {
  id: string;
  title: string;
  query?: PivotQuery | null;
};

export function DashboardExportDialog({
  open,
  onOpenChange,
  widgets,
  globalFilters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: ExportableWidget[];
  globalFilters: FilterConfig[];
}) {
  const { requestStepUp } = useStepUpPrompt();
  const exportableWidgets = useMemo(
    () => widgets.filter((widget) => widget.query),
    [widgets],
  );
  const [selectedWidgetId, setSelectedWidgetId] = useState("");
  const [format, setFormat] = useState<ExportFormat>("csv");

  useEffect(() => {
    if (!open) return;
    setSelectedWidgetId(exportableWidgets[0]?.id ?? "");
    setFormat("csv");
  }, [open, exportableWidgets]);

  const selectedWidget = useMemo(
    () => exportableWidgets.find((widget) => widget.id === selectedWidgetId) ?? null,
    [exportableWidgets, selectedWidgetId],
  );

  const mergedQuery = useMemo(
    () => mergeDashboardFilters(selectedWidget?.query ?? null, globalFilters),
    [selectedWidget, globalFilters],
  );

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!mergedQuery) {
        throw new Error("Select a widget to export.");
      }
      return exportPivotResults({
        data: {
          pivotQuery: mergedQuery,
          format,
        },
      });
    },
    onSuccess: (result) => {
      if (!result?.data) {
        toast.error("No export data returned.");
        return;
      }

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
      link.download = result.fileName ?? "dashboard-export.csv";
      link.click();
      URL.revokeObjectURL(url);
      onOpenChange(false);
    },
    onError: (error) => {
      const message = getStepUpErrorMessage(error);
      if (message) {
        requestStepUp(message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Dashboard export failed.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export dashboard data</DialogTitle>
          <DialogDescription>
            Download data for a specific widget on this dashboard.
          </DialogDescription>
        </DialogHeader>

        {exportableWidgets.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Add a chart, pivot, or KPI widget to export data.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Widget</Label>
              <Select value={selectedWidgetId} onValueChange={setSelectedWidgetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select widget" />
                </SelectTrigger>
                <SelectContent>
                  {exportableWidgets.map((widget) => (
                    <SelectItem key={widget.id} value={widget.id}>
                      {widget.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value as ExportFormat)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => exportMutation.mutate()}
            disabled={!mergedQuery || exportMutation.isPending}
          >
            Export data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
