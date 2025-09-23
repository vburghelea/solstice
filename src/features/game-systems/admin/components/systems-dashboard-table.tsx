import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { DataTable } from "~/components/ui/data-table";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { bulkUpdateAdminSystems } from "../game-systems-admin.mutations";
import type { AdminGameSystemListItem } from "../game-systems-admin.types";
import { SystemStatusPill } from "./system-status-pill";
import {
  clearSelectionAction,
  createInitialSelectionState,
  resolveSelectionForSignature,
  selectionReducer,
} from "./systems-dashboard-selection";

const selectionColumn: ColumnDef<AdminGameSystemListItem> = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      aria-label="Select all systems on this page"
      checked={
        table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : false
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      aria-label={`Select ${row.original.name}`}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
  enableSorting: false,
  enableHiding: false,
  size: 32,
};

const baseColumns: ColumnDef<AdminGameSystemListItem>[] = [
  {
    accessorKey: "name",
    header: "System",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dashboard/systems/$systemId"
              params={{ systemId: String(item.id) }}
              className="text-foreground hover:text-primary text-sm font-semibold underline-offset-2 transition-colors hover:underline"
            >
              {item.name}
            </Link>
            <Badge variant={item.isPublished ? "default" : "outline"}>
              {item.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge variant={item.cmsApproved ? "secondary" : "outline"}>
              {item.cmsApproved ? "Approved" : "Needs approval"}
            </Badge>
          </div>
          <p className="text-muted-foreground text-xs">Slug: {item.slug}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "statusFlags",
    header: "Completeness",
    cell: ({ row }) => {
      const item = row.original;
      if (item.statusFlags.length === 0) {
        return <Badge variant="secondary">Ready</Badge>;
      }
      return (
        <div className="flex flex-wrap gap-1">
          {item.statusFlags.map((flag) => (
            <SystemStatusPill key={flag} flag={flag} />
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "crawlStatus",
    header: "Crawl",
    cell: ({ row }) => {
      const item = row.original;
      const crawlStatus = item.crawlStatus ?? "unknown";
      const crawlVariant = getCrawlVariant(crawlStatus);
      const lastLabel = item.lastCrawledAt
        ? `${formatDateAndTime(item.lastCrawledAt)} (${formatRelativeTime(item.lastCrawledAt)})`
        : "Never crawled";
      const errorMessage = item.errorMessage?.trim();

      return (
        <div className="space-y-1">
          <Badge variant={crawlVariant}>{formatCrawlStatus(crawlStatus)}</Badge>
          <p className="text-muted-foreground text-xs">{lastLabel}</p>
          {errorMessage ? (
            <p className="text-destructive line-clamp-2 text-xs">{errorMessage}</p>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "media",
    header: "Media",
    cell: ({ row }) => {
      const item = row.original;
      const heroBadge = item.heroSelected ? (
        <Badge variant={item.heroModerated ? "secondary" : "outline"}>
          {item.heroModerated ? "Hero approved" : "Hero needs review"}
        </Badge>
      ) : (
        <Badge variant="destructive">No hero</Badge>
      );

      return (
        <div className="flex flex-col gap-1">
          {heroBadge}
          <Badge variant={item.unmoderatedMediaCount > 0 ? "outline" : "secondary"}>
            {item.unmoderatedMediaCount > 0
              ? `${item.unmoderatedMediaCount} pending`
              : "Gallery clean"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => {
      const item = row.original;
      const updatedLabel = `${formatDateAndTime(item.updatedAt)} (${formatRelativeTime(item.updatedAt)})`;
      return <p className="text-muted-foreground text-xs">{updatedLabel}</p>;
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Button asChild size="sm" variant="secondary" className="gap-1">
          <Link to="/dashboard/systems/$systemId" params={{ systemId: String(item.id) }}>
            <span>Edit</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      );
    },
  },
];

const columns: ColumnDef<AdminGameSystemListItem>[] = [selectionColumn, ...baseColumns];

function getCrawlVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "success":
      return "secondary";
    case "partial":
    case "queued":
    case "processing":
      return "outline";
    case "error":
      return "destructive";
    default:
      return "outline";
  }
}

function formatCrawlStatus(status: string) {
  switch (status) {
    case "success":
      return "Success";
    case "partial":
      return "Partial";
    case "error":
      return "Error";
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "unknown":
      return "Unknown";
    default:
      return status;
  }
}

function formatRelativeTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "invalid date";
  const deltaMs = Date.now() - date.getTime();
  const deltaSeconds = Math.round(deltaMs / 1000);
  if (Math.abs(deltaSeconds) < 60) return "just now";
  const divisions = [
    { amount: 60, unit: "minute" },
    { amount: 60, unit: "hour" },
    { amount: 24, unit: "day" },
    { amount: 7, unit: "week" },
    { amount: 4.348, unit: "month" },
    { amount: 12, unit: "year" },
  ] as const;

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let duration = deltaSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) break;
    duration /= division.amount;
    unit = division.unit as Intl.RelativeTimeFormatUnit;
  }

  return formatter.format(Math.round(duration * -1), unit);
}

interface SystemsDashboardTableProps {
  systems: AdminGameSystemListItem[];
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function SystemsDashboardTable({
  systems,
  page,
  perPage,
  pageCount,
  total,
  isLoading = false,
  onPageChange,
}: SystemsDashboardTableProps) {
  const queryClient = useQueryClient();

  const datasetSignature = useMemo(
    () => `${page}-${systems.map((system) => system.id).join(":")}`,
    [page, systems],
  );

  const [selectionState, dispatchSelection] = useReducer(
    selectionReducer,
    datasetSignature,
    createInitialSelectionState,
  );

  useEffect(() => {
    dispatchSelection({ type: "reset", signature: datasetSignature });
  }, [datasetSignature]);

  const rowSelection = useMemo<RowSelectionState>(
    () => resolveSelectionForSignature(selectionState, datasetSignature),
    [datasetSignature, selectionState],
  );

  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    dispatchSelection({ type: "update", signature: datasetSignature, updater });
  };

  const clearSelection = () => {
    dispatchSelection(clearSelectionAction(datasetSignature));
  };

  const selectedIds = useMemo(() => {
    return Object.entries(rowSelection)
      .filter(([, value]) => Boolean(value))
      .map(([rowId]) => Number.parseInt(rowId, 10))
      .filter((id) => Number.isFinite(id));
  }, [rowSelection]);

  const selectedCount = selectedIds.length;

  const bulkMutation = useMutation({
    mutationFn: async (action: BulkAction) => {
      if (selectedIds.length === 0) return;

      await bulkUpdateAdminSystems({
        data: {
          systemIds: selectedIds,
          updates: buildBulkUpdatePayload(action),
        },
      });
    },
    onSuccess: (_, action) => {
      toast.success(bulkActionLabels[action].successMessage);
      clearSelection();
      void queryClient.invalidateQueries({ queryKey: ["admin-game-systems"] });
    },
    onError: (error: unknown, action) => {
      const label = bulkActionLabels[action];
      const message =
        error instanceof Error ? error.message : "Failed to apply bulk action";
      toast.error(`${label.errorPrefix}: ${message}`);
    },
  });

  const handleBulkAction = (action: BulkAction) => {
    if (bulkMutation.isPending || selectedIds.length === 0) return;
    bulkMutation.mutate(action);
  };

  const pageIndex = Math.max(page - 1, 0);
  const hasResults = total > 0;
  const startLabel = hasResults ? pageIndex * perPage + 1 : 0;
  const endLabel = hasResults ? startLabel + systems.length - 1 : 0;

  const toolbarContent =
    selectedCount > 0 ? (
      <BulkActionsToolbar
        selectedCount={selectedCount}
        isBusy={bulkMutation.isPending}
        onAction={handleBulkAction}
      />
    ) : null;

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
        <span>
          Showing {hasResults ? `${startLabel}–${endLabel}` : 0} of {total}
          {total === 1 ? " system" : " systems"}
        </span>
        {pageCount > 0 ? (
          <span>
            Page {hasResults ? page : 1} of {Math.max(pageCount, 1)}
          </span>
        ) : null}
      </div>
      <DataTable
        key={datasetSignature}
        columns={columns}
        data={systems}
        pageSize={perPage}
        manualPagination
        pageIndex={pageIndex}
        pageCount={pageCount}
        onPageChange={(nextPageIndex) => onPageChange(nextPageIndex + 1)}
        isLoading={isLoading}
        getRowId={(original) => String(original.id)}
        enableRowSelection
        rowSelection={rowSelection}
        onRowSelectionChange={handleRowSelectionChange}
        toolbarContent={toolbarContent ?? undefined}
      />
    </div>
  );
}

type BulkAction = "publish" | "unpublish" | "approve" | "revoke-approval";

const bulkActionLabels: Record<
  BulkAction,
  { successMessage: string; errorPrefix: string }
> = {
  publish: {
    successMessage: "Selected systems published",
    errorPrefix: "Could not publish selected systems",
  },
  unpublish: {
    successMessage: "Selected systems reverted to draft",
    errorPrefix: "Could not revert publish status",
  },
  approve: {
    successMessage: "Selected systems approved",
    errorPrefix: "Could not approve selected systems",
  },
  "revoke-approval": {
    successMessage: "Selected systems marked for review",
    errorPrefix: "Could not update approval status",
  },
};

function buildBulkUpdatePayload(action: BulkAction) {
  switch (action) {
    case "publish":
      return { isPublished: true } as const;
    case "unpublish":
      return { isPublished: false } as const;
    case "approve":
      return { cmsApproved: true } as const;
    case "revoke-approval":
      return { cmsApproved: false } as const;
    default:
      return {} as const;
  }
}

function BulkActionsToolbar({
  selectedCount,
  isBusy,
  onAction,
}: {
  selectedCount: number;
  isBusy: boolean;
  onAction: (action: BulkAction) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
        {selectedCount} selected
      </Badge>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAction("publish")}
          disabled={isBusy}
          variant="secondary"
        >
          Publish
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("unpublish")}
          disabled={isBusy}
          variant="outline"
        >
          Revert to draft
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("approve")}
          disabled={isBusy}
          variant="default"
        >
          Approve
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("revoke-approval")}
          disabled={isBusy}
          variant="ghost"
        >
          Mark for review
        </Button>
      </div>
    </div>
  );
}
