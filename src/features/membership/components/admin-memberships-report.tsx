import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { DataTable } from "~/components/ui/data-table";
import {
  MobileDataCard,
  MobileDataCardsList,
  ResponsiveDataView,
} from "~/components/ui/mobile-data-cards";
import { exportToCSV, formatCurrency, formatDate } from "~/lib/utils/csv-export";
import { getAllMemberships, type MembershipReportRow } from "../membership.admin-queries";

const columns: ColumnDef<MembershipReportRow>[] = [
  {
    accessorKey: "userName",
    header: "User Name",
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
    "all" | "active" | "expired" | "cancelled"
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
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading memberships...</div>
      </div>
    );
  }

  if (error || !data?.success) {
    const errorMessage = data?.errors?.[0]?.message || "Failed to load memberships";

    // Check if it's an admin access error
    if (errorMessage === "Admin access required") {
      return (
        <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6">
          <h3 className="text-destructive text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground mt-2">
            You do not have permission to view this report. Admin access is required.
          </p>
        </div>
      );
    }

    return (
      <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-6">
        <h3 className="text-destructive text-lg font-semibold">Error Loading Report</h3>
        <p className="text-muted-foreground mt-2">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Memberships Report
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and export all membership data across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | "active" | "expired" | "cancelled",
              )
            }
            className="border-input bg-background ring-offset-background focus-visible:ring-ring rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Button variant="outline" onClick={handleExport} className="lg:hidden">
            Export CSV
          </Button>
        </div>
      </div>

      <ResponsiveDataView
        table={
          <DataTable
            columns={columns}
            data={data.data || []}
            pageSize={20}
            onExport={handleExport}
          />
        }
        cards={<MembershipsMobileCards memberships={data.data || []} />}
      />
    </div>
  );
}

interface MembershipsMobileCardsProps {
  memberships: MembershipReportRow[];
}

function MembershipsMobileCards({ memberships }: MembershipsMobileCardsProps) {
  if (memberships.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">
        No memberships found.
      </div>
    );
  }

  return (
    <MobileDataCardsList>
      {memberships.map((membership) => {
        const statusClass =
          membership.status === "active"
            ? "bg-green-100 text-green-800"
            : membership.status === "expired"
              ? "bg-gray-100 text-gray-800"
              : "bg-red-100 text-red-800";

        return (
          <MobileDataCard
            key={membership.id}
            title={membership.userName}
            subtitle={membership.userEmail}
            badge={
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
              >
                {membership.status}
              </span>
            }
            fields={[
              {
                label: "Membership",
                value: membership.membershipType,
              },
              {
                label: "Price",
                value: formatCurrency(membership.priceCents),
              },
              {
                label: "Start Date",
                value: formatDate(membership.startDate),
              },
              {
                label: "End Date",
                value: formatDate(membership.endDate),
              },
            ]}
          />
        );
      })}
    </MobileDataCardsList>
  );
}
