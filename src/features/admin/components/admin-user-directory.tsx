import type { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangleIcon,
  DownloadIcon,
  FilterIcon,
  KeyRoundIcon,
  ShieldCheckIcon,
  ShieldOffIcon,
  UsersIcon,
} from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/shared/lib/utils";

import {
  useAdminUserDirectory,
  useExportComplianceReport,
  type AdminMembershipStatus,
  type AdminUserFiltersInput,
  type AdminUserRecord,
} from "../users/admin-user-directory.queries";

const membershipLabels: Record<AdminMembershipStatus, string> = {
  active: "Active",
  expired: "Expired",
  canceled: "Canceled",
  none: "No membership",
};

const membershipTone: Record<AdminMembershipStatus, string> = {
  active: "bg-emerald-500/10 text-emerald-600",
  expired: "bg-amber-500/10 text-amber-600",
  canceled: "bg-destructive/10 text-destructive",
  none: "bg-muted text-muted-foreground",
};

function DirectorySkeleton() {
  return (
    <div className="token-stack-lg">
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="token-stack-sm">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function RiskBadge({
  message,
  type,
}: {
  message: string;
  type: "security" | "compliance";
}) {
  const tone =
    type === "security"
      ? "bg-amber-500/10 text-amber-600"
      : "bg-destructive/10 text-destructive";
  return (
    <Badge variant="outline" className={cn("border-transparent", tone)}>
      {message}
    </Badge>
  );
}

function buildColumns(): ColumnDef<AdminUserRecord>[] {
  return [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="token-stack-xs">
            <div className="flex items-center gap-2">
              <UsersIcon aria-hidden className="text-muted-foreground size-4" />
              <span className="text-body-sm text-foreground font-semibold">
                {record.name}
              </span>
            </div>
            <span className="text-body-xs text-muted-foreground">{record.email}</span>
            <div className="flex flex-wrap gap-1">
              {record.personaCoverage.map((persona) => (
                <Badge
                  key={persona.personaId}
                  variant="outline"
                  className="bg-muted/60 text-muted-foreground border-transparent"
                >
                  {persona.label}
                </Badge>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "membershipStatus",
      header: "Membership",
      cell: ({ row }) => {
        const record = row.original;
        const tone = membershipTone[record.membershipStatus];
        return (
          <div className="token-stack-xs">
            <Badge variant="outline" className={cn("border-transparent", tone)}>
              {membershipLabels[record.membershipStatus]}
            </Badge>
            {record.membershipExpiresAt ? (
              <span className="text-body-xs text-muted-foreground">
                Expires{" "}
                {formatDistanceToNow(record.membershipExpiresAt, { addSuffix: true })}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      accessorKey: "roles",
      header: "Roles",
      cell: ({ row }) => {
        const record = row.original;
        if (record.roles.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">No assignments</span>
          );
        }
        return (
          <div className="flex flex-wrap gap-1">
            {record.roles.map((role) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "mfaEnrolled",
      header: "MFA",
      cell: ({ row }) => {
        const { mfaEnrolled } = row.original;
        return (
          <span className="text-body-sm flex items-center gap-1">
            {mfaEnrolled ? (
              <ShieldCheckIcon aria-hidden className="size-4 text-emerald-600" />
            ) : (
              <ShieldOffIcon aria-hidden className="text-destructive size-4" />
            )}
            {mfaEnrolled ? "Enforced" : "Missing"}
          </span>
        );
      },
    },
    {
      accessorKey: "lastActiveAt",
      header: "Last active",
      cell: ({ row }) => {
        const { lastActiveAt } = row.original;
        return (
          <span className="text-body-sm text-muted-foreground">
            {lastActiveAt
              ? formatDistanceToNow(lastActiveAt, { addSuffix: true })
              : "No activity"}
          </span>
        );
      },
    },
    {
      accessorKey: "riskFlags",
      header: "Risk",
      cell: ({ row }) => {
        const { riskFlags } = row.original;
        if (riskFlags.length === 0) {
          return <span className="text-body-xs text-muted-foreground">Clear</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {riskFlags.map((flag) => (
              <RiskBadge
                key={`${flag.type}-${flag.message}`}
                type={flag.type}
                message={flag.message}
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "auditTrail",
      header: "Latest activity",
      cell: ({ row }) => {
        const { auditTrail } = row.original;
        if (auditTrail.length === 0) {
          return (
            <span className="text-body-xs text-muted-foreground">No recent events</span>
          );
        }
        const [latest] = auditTrail;
        return (
          <div className="token-stack-xs">
            <span className="text-body-sm text-foreground">{latest.label}</span>
            <span className="text-body-xs text-muted-foreground">
              {formatDistanceToNow(latest.timestamp, { addSuffix: true })}
            </span>
          </div>
        );
      },
    },
  ];
}

export function AdminUserDirectory() {
  const [pageIndex, setPageIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState<"all" | AdminMembershipStatus>(
    "all",
  );
  const [requireMfa, setRequireMfa] = useState(false);
  const deferredSearch = useDeferredValue(search);
  const pageSize = 20;

  const filters = useMemo<AdminUserFiltersInput>(
    () => ({
      search: deferredSearch ? deferredSearch : undefined,
      membershipStatus: membershipFilter === "all" ? undefined : membershipFilter,
      requireMfa: requireMfa ? true : undefined,
      page: pageIndex + 1,
      pageSize,
    }),
    [deferredSearch, membershipFilter, requireMfa, pageIndex, pageSize],
  );

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useAdminUserDirectory(filters);
  const exportMutation = useExportComplianceReport();

  const handleExport = async () => {
    try {
      const { page: _omitPage, pageSize: _omitPageSize, ...exportFilters } = filters;
      void _omitPage;
      void _omitPageSize;
      const url = await exportMutation.mutateAsync(exportFilters);
      const link = document.createElement("a");
      link.href = url;
      link.download = `platform-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Compliance report exported");
    } catch (mutationError) {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Failed to export compliance report";
      toast.error(message);
    }
  };

  const columns = useMemo(() => buildColumns(), []);

  if (isLoading && !data) {
    return <DirectorySkeleton />;
  }

  if (isError) {
    return (
      <Card className="bg-destructive/5 border-destructive/30">
        <CardHeader className="token-stack-sm">
          <div className="token-gap-xs flex items-center gap-2">
            <AlertTriangleIcon className="text-destructive size-5" aria-hidden />
            <CardTitle className="text-heading-sm">
              Unable to load user governance
            </CardTitle>
          </div>
          <CardDescription className="text-body-sm text-destructive">
            {error?.message ?? "The user directory service is temporarily unavailable."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="secondary">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.ceil(totalCount / pageSize);

  return (
    <div className="token-stack-lg">
      <Card className="bg-surface-elevated border-subtle">
        <CardHeader className="token-stack-sm">
          <div className="token-stack-xs">
            <CardTitle className="text-heading-sm">User governance</CardTitle>
            <CardDescription className="text-body-sm text-muted-strong">
              Track membership coverage, role assignments, and MFA enforcement for
              Jordan's compliance lens.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full max-w-md min-w-[260px]">
              <Input
                value={search}
                onChange={(event) => {
                  setPageIndex(0);
                  setSearch(event.target.value);
                }}
                placeholder="Search by name or email"
                className="pl-9"
              />
              <FilterIcon
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
            </div>
            <Select
              value={membershipFilter}
              onValueChange={(value) => {
                setMembershipFilter(value as typeof membershipFilter);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Membership" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All memberships</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="none">No membership</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={requireMfa ? "default" : "outline"}
              onClick={() => {
                setRequireMfa((previous) => !previous);
                setPageIndex(0);
              }}
              className="flex items-center gap-2"
            >
              <KeyRoundIcon className="size-4" aria-hidden />
              {requireMfa ? "MFA enforced" : "Require MFA"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex items-center gap-2"
              onClick={() => void handleExport()}
              disabled={exportMutation.isPending}
            >
              <DownloadIcon className="size-4" aria-hidden />
              {exportMutation.isPending ? "Exporting…" : "Export CSV"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              {isRefetching ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data ? (
            <DataTable
              columns={columns}
              data={data.items}
              manualPagination
              pageIndex={pageIndex}
              pageCount={pageCount}
              onPageChange={(index) => setPageIndex(index)}
              pageSize={pageSize}
              isLoading={isLoading || isRefetching}
            />
          ) : (
            <Skeleton className="h-[480px] w-full" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
