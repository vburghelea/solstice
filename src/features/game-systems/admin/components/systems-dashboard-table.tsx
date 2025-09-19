import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight } from "lucide-react";
import { DataTable } from "~/components/ui/data-table";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { Badge } from "~/shared/ui/badge";
import { Button } from "~/shared/ui/button";
import type { AdminGameSystemListItem } from "../game-systems-admin.types";
import { SystemStatusPill } from "./system-status-pill";

const columns: ColumnDef<AdminGameSystemListItem>[] = [
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
}

export function SystemsDashboardTable({ systems }: SystemsDashboardTableProps) {
  return <DataTable columns={columns} data={systems} pageSize={20} />;
}
