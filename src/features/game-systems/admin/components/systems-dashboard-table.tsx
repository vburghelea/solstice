import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, OnChangeFn, RowSelectionState } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useReducer } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { DataTable } from "~/components/ui/data-table";
import { LocalizedButtonLink, LocalizedLink } from "~/components/ui/LocalizedLink";
import {
  useCommonTranslation,
  useGameSystemsTranslation,
} from "~/hooks/useTypedTranslation";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { bulkUpdateAdminSystems } from "../game-systems-admin.mutations";
import type { BulkAdminAction } from "../game-systems-admin.schemas";
import type { AdminGameSystemListItem } from "../game-systems-admin.types";
import {
  formatSystemCrawlStatus,
  formatSystemRelativeTime,
  getSystemCrawlBadgeVariant,
} from "../lib/system-formatters";
import {
  DEFAULT_SYSTEM_DETAIL_ROUTE,
  type SystemDetailRoute,
} from "../lib/system-routes";
import { SystemStatusPill } from "./system-status-pill";
import {
  clearSelectionAction,
  createInitialSelectionState,
  resolveSelectionForSignature,
  selectionReducer,
} from "./systems-dashboard-selection";

const createSelectionColumn = (
  t: (key: string, params?: Record<string, unknown>) => string,
): ColumnDef<AdminGameSystemListItem> => ({
  id: "select",
  header: ({ table }) => (
    <Checkbox
      aria-label={t("accessibility.select_all_page")}
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
      aria-label={t("accessibility.select_item", { name: row.original.name })}
      checked={row.getIsSelected()}
      disabled={!row.getCanSelect()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
  enableSorting: false,
  enableHiding: false,
  size: 32,
});

function createColumns(
  detailRoute: SystemDetailRoute,
  t: (key: string, params?: Record<string, unknown>) => string,
  tGameSystems: (key: string, params?: Record<string, unknown>) => string,
) {
  const detailColumns: ColumnDef<AdminGameSystemListItem>[] = [
    {
      accessorKey: "name",
      header: tGameSystems("admin.table.headers.system"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <LocalizedLink
                to={detailRoute}
                params={{ systemId: String(item.id) }}
                translationKey="game_systems.view_system"
                translationNamespace="navigation"
                fallbackText={item.name}
                className="text-foreground hover:text-primary text-sm font-semibold underline-offset-2 transition-colors hover:underline"
              >
                {item.name}
              </LocalizedLink>
              <Badge variant={item.isPublished ? "default" : "outline"}>
                {item.isPublished
                  ? tGameSystems("admin.table.status.published")
                  : tGameSystems("admin.table.status.draft")}
              </Badge>
              <Badge variant={item.cmsApproved ? "secondary" : "outline"}>
                {item.cmsApproved
                  ? tGameSystems("admin.table.status.approved")
                  : tGameSystems("admin.table.status.needs_approval")}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {tGameSystems("admin.table.slug_prefix")} {item.slug}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "statusFlags",
      header: tGameSystems("admin.table.headers.completeness"),
      cell: ({ row }) => {
        const item = row.original;
        if (item.statusFlags.length === 0) {
          return (
            <Badge variant="secondary">{tGameSystems("admin.table.ready_status")}</Badge>
          );
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
      header: tGameSystems("admin.table.headers.crawl"),
      cell: ({ row }) => {
        const item = row.original;
        const crawlStatus = item.crawlStatus ?? "unknown";
        const crawlVariant = getSystemCrawlBadgeVariant(crawlStatus);
        const lastLabel = item.lastCrawledAt
          ? `${formatDateAndTime(item.lastCrawledAt)} (${formatSystemRelativeTime(item.lastCrawledAt, { t })})`
          : tGameSystems("admin.table.status.never_crawled");
        const errorMessage = item.errorMessage?.trim();

        return (
          <div className="space-y-1">
            <Badge variant={crawlVariant}>
              {formatSystemCrawlStatus(crawlStatus, tGameSystems)}
            </Badge>
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
      header: tGameSystems("admin.table.headers.media"),
      cell: ({ row }) => {
        const item = row.original;
        const heroBadge = item.heroSelected ? (
          <Badge variant={item.heroModerated ? "secondary" : "outline"}>
            {item.heroModerated
              ? tGameSystems("admin.table.status.hero_approved")
              : tGameSystems("admin.table.status.hero_needs_review")}
          </Badge>
        ) : (
          <Badge variant="destructive">{tGameSystems("admin.table.no_hero_badge")}</Badge>
        );

        return (
          <div className="flex flex-col gap-1">
            {heroBadge}
            <Badge variant={item.unmoderatedMediaCount > 0 ? "outline" : "secondary"}>
              {item.unmoderatedMediaCount > 0
                ? `${item.unmoderatedMediaCount} ${tGameSystems("admin.table.status.pending")}`
                : tGameSystems("admin.table.status.gallery_clean")}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: tGameSystems("admin.table.headers.updated"),
      cell: ({ row }) => {
        const item = row.original;
        const updatedLabel = `${formatDateAndTime(item.updatedAt)} (${formatSystemRelativeTime(item.updatedAt, { t })})`;
        return <p className="text-muted-foreground text-xs">{updatedLabel}</p>;
      },
    },
    {
      id: "actions",
      header: tGameSystems("admin.table.headers.actions"),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Button asChild size="sm" variant="secondary" className="gap-1">
            <LocalizedButtonLink
              to={detailRoute}
              params={{ systemId: String(item.id) }}
              translationKey="game_systems.edit_system"
              translationNamespace="navigation"
              fallbackText={tGameSystems("admin.table.edit_action")}
            >
              <span>{tGameSystems("admin.table.edit_action")}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </LocalizedButtonLink>
          </Button>
        );
      },
    },
  ];

  return [
    createSelectionColumn(t),
    ...detailColumns,
  ] satisfies ColumnDef<AdminGameSystemListItem>[];
}

interface SystemsDashboardTableProps {
  systems: AdminGameSystemListItem[];
  page: number;
  perPage: number;
  pageCount: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  systemDetailRoute?: SystemDetailRoute;
}

export function SystemsDashboardTable({
  systems,
  page,
  perPage,
  pageCount,
  total,
  isLoading = false,
  onPageChange,
  systemDetailRoute = DEFAULT_SYSTEM_DETAIL_ROUTE,
}: SystemsDashboardTableProps) {
  const { t } = useCommonTranslation();
  const { t: tGameSystems } = useGameSystemsTranslation();
  const columns = useMemo(
    () => createColumns(systemDetailRoute, t, tGameSystems),
    [systemDetailRoute, t, tGameSystems],
  );
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

  const bulkActionLabels = useMemo(
    () => getBulkActionLabels(tGameSystems),
    [tGameSystems],
  );

  const bulkMutation = useMutation({
    mutationFn: async (action: BulkAction) => {
      if (selectedIds.length === 0) return;

      await bulkUpdateAdminSystems({
        data: {
          systemIds: selectedIds,
          action: buildBulkUpdatePayload(action),
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

    if (action === "delete") {
      const confirmed = window.confirm(
        tGameSystems("admin.table.confirmations.delete_systems"),
      );
      if (!confirmed) return;
    }

    if (action === "deactivate") {
      const confirmed = window.confirm(
        tGameSystems("admin.table.confirmations.deactivate_systems"),
      );
      if (!confirmed) return;
    }

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
        t={tGameSystems}
      />
    ) : null;

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
        <span>
          {hasResults
            ? tGameSystems("admin.table.showing_results", {
                start: startLabel,
                end: endLabel,
                total,
                itemType:
                  total === 1
                    ? tGameSystems("admin.table.system_singular")
                    : tGameSystems("admin.table.system_plural"),
              })
            : tGameSystems("admin.table.showing_results", {
                start: 0,
                end: 0,
                total: 0,
                itemType: tGameSystems("admin.table.system_singular"),
              })}
        </span>
        {pageCount > 0 ? (
          <span>
            {tGameSystems("admin.table.page_info", {
              current: hasResults ? page : 1,
              total: Math.max(pageCount, 1),
            })}
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

type BulkAction =
  | "publish"
  | "unpublish"
  | "approve"
  | "revoke-approval"
  | "hero-approved"
  | "hero-needs-review"
  | "queue-recrawl"
  | "deactivate"
  | "delete";

const getBulkActionLabels = (
  t: (key: string, params?: Record<string, unknown>) => string,
): Record<BulkAction, { successMessage: string; errorPrefix: string }> => ({
  publish: {
    successMessage: t("admin.table.bulk_actions.messages.publish_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.publish_error"),
  },
  unpublish: {
    successMessage: t("admin.table.bulk_actions.messages.unpublish_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.unpublish_error"),
  },
  approve: {
    successMessage: t("admin.table.bulk_actions.messages.approve_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.approve_error"),
  },
  "revoke-approval": {
    successMessage: t("admin.table.bulk_actions.messages.revoke_approval_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.revoke_approval_error"),
  },
  "hero-approved": {
    successMessage: t("admin.table.bulk_actions.messages.hero_approved_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.hero_approved_error"),
  },
  "hero-needs-review": {
    successMessage: t("admin.table.bulk_actions.messages.hero_needs_review_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.hero_needs_review_error"),
  },
  "queue-recrawl": {
    successMessage: t("admin.table.bulk_actions.messages.queue_recrawl_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.queue_recrawl_error"),
  },
  deactivate: {
    successMessage: t("admin.table.bulk_actions.messages.deactivate_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.deactivate_error"),
  },
  delete: {
    successMessage: t("admin.table.bulk_actions.messages.delete_success"),
    errorPrefix: t("admin.table.bulk_actions.messages.delete_error"),
  },
});

function buildBulkUpdatePayload(action: BulkAction): BulkAdminAction {
  switch (action) {
    case "publish":
      return { type: "set-publish", isPublished: true };
    case "unpublish":
      return { type: "set-publish", isPublished: false };
    case "approve":
      return { type: "set-approval", cmsApproved: true };
    case "revoke-approval":
      return { type: "set-approval", cmsApproved: false };
    case "hero-approved":
      return { type: "set-hero-moderation", moderated: true };
    case "hero-needs-review":
      return { type: "set-hero-moderation", moderated: false };
    case "queue-recrawl":
      return { type: "queue-recrawl", source: "dashboard-bulk" };
    case "deactivate":
      return { type: "deactivate" };
    case "delete":
      return { type: "delete" };
    default: {
      const exhaustiveCheck: never = action;
      throw new Error(`Unhandled bulk action: ${exhaustiveCheck}`);
    }
  }
}

function BulkActionsToolbar({
  selectedCount,
  isBusy,
  onAction,
  t,
}: {
  selectedCount: number;
  isBusy: boolean;
  onAction: (action: BulkAction) => void;
  t: (key: string, params?: Record<string, unknown>) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs font-semibold">
        {t("admin.table.bulk_actions.selected_count", { count: selectedCount })}
      </Badge>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAction("publish")}
          disabled={isBusy}
          variant="secondary"
        >
          {t("admin.table.bulk_actions.buttons.publish")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("unpublish")}
          disabled={isBusy}
          variant="outline"
        >
          {t("admin.table.bulk_actions.buttons.revert_to_draft")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("approve")}
          disabled={isBusy}
          variant="default"
        >
          {t("admin.table.bulk_actions.buttons.approve")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("revoke-approval")}
          disabled={isBusy}
          variant="ghost"
        >
          {t("admin.table.bulk_actions.buttons.mark_for_review")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAction("hero-approved")}
          disabled={isBusy}
          variant="default"
        >
          {t("admin.table.bulk_actions.buttons.hero_reviewed")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("hero-needs-review")}
          disabled={isBusy}
          variant="outline"
        >
          {t("admin.table.bulk_actions.buttons.hero_needs_review")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={() => onAction("queue-recrawl")}
          disabled={isBusy}
          variant="secondary"
        >
          {t("admin.table.bulk_actions.buttons.queue_recrawl")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("deactivate")}
          disabled={isBusy}
          variant="outline"
        >
          {t("admin.table.bulk_actions.buttons.deactivate")}
        </Button>
        <Button
          size="sm"
          onClick={() => onAction("delete")}
          disabled={isBusy}
          variant="destructive"
        >
          {t("admin.table.bulk_actions.buttons.delete")}
        </Button>
      </div>
    </div>
  );
}
