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
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { exportToCSV, formatCurrency, formatDate } from "~/lib/utils/csv-export";
import { getAllMemberships, type MembershipReportRow } from "../membership.admin-queries";

const columns: ColumnDef<MembershipReportRow>[] = [
  {
    accessorKey: "userName",
    header: "User",
    cell: ({ row }) => {
      const original = row.original as MembershipReportRow;
      const display = original.userName || original.userEmail || original.userId;
      return (
        <Link
          to="/dashboard/profile/$userId"
          params={{ userId: original.userId }}
          className="inline-flex items-center gap-2"
        >
          <Avatar
            name={original.userName}
            email={original.userEmail}
            srcUploaded={original.userUploadedAvatarPath}
            srcProvider={original.userImage}
            className="h-6 w-6"
          />
          <span className="truncate">{display}</span>
        </Link>
      );
    },
  },
  {
    accessorKey: "userEmail",
    header: "Email",
  },
  {
    accessorKey: "membershipType",
    header: "Membership Type",
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => formatDate(row.getValue("startDate")),
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => formatDate(row.getValue("endDate")),
  },
  {
    accessorKey: "status",
    header: "Status",
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
    header: "Price",
    cell: ({ row }) => formatCurrency(row.getValue("priceCents")),
  },
  {
    accessorKey: "paymentId",
    header: "Payment ID",
    cell: ({ row }) => row.getValue("paymentId") || "-",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => formatDate(row.getValue("createdAt")),
  },
];

export function AdminMembershipsReport() {
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
        "User Name": row.userName,
        Email: row.userEmail,
        "Membership Type": row.membershipType,
        "Start Date": formatDate(row.startDate),
        "End Date": formatDate(row.endDate),
        Status: row.status,
        Price: formatCurrency(row.priceCents),
        "Payment ID": row.paymentId || "-",
        "Created At": formatDate(row.createdAt),
      }));

      const filename = `memberships-report-${new Date().toISOString().split("T")[0]}.csv`;
      exportToCSV(exportData, filename);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">Loading memberships...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    const errorMessage = data?.errors?.[0]?.message || "Failed to load memberships";

    // Check if it's an admin access error
    if (errorMessage === "Admin access required") {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this report. Admin access is required.
            </CardDescription>
          </CardHeader>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Report</CardTitle>
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
        <CardTitle>Memberships Report</CardTitle>
        <CardDescription>
          View and export all membership data across the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <label htmlFor="statusFilter" className="text-sm font-medium text-gray-100">
              Status
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
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-admin-secondary rounded-md px-4 py-2 text-sm"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="w-full max-w-full overflow-x-auto">
          <DataTable
            columns={columns}
            data={data.data || []}
            pageSize={20}
            onExport={handleExport}
          />
        </div>
      </CardContent>
    </Card>
  );
}
