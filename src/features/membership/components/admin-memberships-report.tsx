import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Avatar } from "~/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { DataTable } from "~/components/ui/data-table";
import { LocalizedLink } from "~/components/ui/LocalizedLink";
import { useMembershipTranslation } from "~/hooks/useTypedTranslation";
import { exportToCSV, formatCurrency, formatDate } from "~/lib/utils/csv-export";
import { getAllMemberships, type MembershipReportRow } from "../membership.admin-queries";

function createColumns(
  t: ReturnType<typeof useMembershipTranslation>["t"],
): ColumnDef<MembershipReportRow>[] {
  return [
    {
      accessorKey: "userName",
      header: t("admin.report.columns.user"),
      cell: ({ row }) => {
        const original = row.original as MembershipReportRow;
        const display = original.userName || original.userEmail || original.userId;
        return (
          <LocalizedLink
            to="/profile/$userId"
            params={{ userId: original.userId }}
            className="inline-flex items-center gap-2"
            ariaLabelTranslationKey="profile.view_user_profile"
            translationNamespace="navigation"
          >
            <Avatar
              name={original.userName}
              email={original.userEmail}
              srcUploaded={original.userUploadedAvatarPath}
              srcProvider={original.userImage}
              className="h-6 w-6"
            />
            <span className="truncate">{display}</span>
          </LocalizedLink>
        );
      },
    },
    {
      accessorKey: "userEmail",
      header: t("admin.report.columns.email"),
    },
    {
      accessorKey: "membershipType",
      header: t("admin.report.columns.membership_type"),
    },
    {
      accessorKey: "startDate",
      header: t("admin.report.columns.start_date"),
      cell: ({ row }) => formatDate(row.getValue("startDate")),
    },
    {
      accessorKey: "endDate",
      header: t("admin.report.columns.end_date"),
      cell: ({ row }) => formatDate(row.getValue("endDate")),
    },
    {
      accessorKey: "status",
      header: t("admin.report.columns.status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "expired"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "priceCents",
      header: t("admin.report.columns.price"),
      cell: ({ row }) => formatCurrency(row.getValue("priceCents")),
    },
    {
      accessorKey: "paymentId",
      header: t("admin.report.columns.payment_id"),
      cell: ({ row }) => row.getValue("paymentId") || "-",
    },
    {
      accessorKey: "createdAt",
      header: t("admin.report.columns.created_at"),
      cell: ({ row }) => formatDate(row.getValue("createdAt")),
    },
  ];
}

export function AdminMembershipsReport() {
  const { t } = useMembershipTranslation();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "canceled"
  >("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-memberships", statusFilter],
    queryFn: async () => {
      const result = await getAllMemberships({ data: { status: statusFilter } });
      return result;
    },
  });

  const handleExport = () => {
    if (data?.data) {
      const exportData = data.data.map((row) => ({
        [t("admin.report.columns.user")]: row.userName,
        [t("admin.report.columns.email")]: row.userEmail,
        [t("admin.report.columns.membership_type")]: row.membershipType,
        [t("admin.report.columns.start_date")]: formatDate(row.startDate),
        [t("admin.report.columns.end_date")]: formatDate(row.endDate),
        [t("admin.report.columns.status")]: row.status,
        [t("admin.report.columns.price")]: formatCurrency(row.priceCents),
        [t("admin.report.columns.payment_id")]: row.paymentId || "-",
        [t("admin.report.columns.created_at")]: formatDate(row.createdAt),
      }));

      const filename = `memberships-report-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(exportData, filename);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">{t("admin.report.loading")}</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    const errorMessage =
      data?.errors?.[0]?.message || t("admin.report.errors.failed_to_load");

    // Check if it's an admin access error
    if (errorMessage === "Admin access required") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              {t("admin.report.errors.access_denied")}
            </CardTitle>
            <CardDescription>
              {t("admin.report.errors.access_denied_description")}
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            {t("admin.report.errors.error_loading_report")}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {errorMessage}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{t("admin.report.title")}</CardTitle>
        <CardDescription>{t("admin.report.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-100">
              {t("admin.report.filter.label")}
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as "all" | "active" | "expired" | "canceled",
                )
              }
              className="border-input bg-background ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <option value="all">{t("admin.report.filter.options.all")}</option>
              <option value="active">{t("admin.report.filter.options.active")}</option>
              <option value="expired">{t("admin.report.filter.options.expired")}</option>
              <option value="canceled">
                {t("admin.report.filter.options.canceled")}
              </option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-admin-secondary rounded-md px-4 py-2 text-sm"
            >
              {t("admin.report.actions.export_csv")}
            </button>
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            columns={createColumns(t)}
            data={data.data || []}
            pageSize={20}
            onExport={handleExport}
          />
        </div>
      </CardContent>
    </Card>
  );
}
