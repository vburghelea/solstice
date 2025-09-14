import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { AdminMembershipsReport } from "~/features/membership/components/admin-memberships-report";
import { isAnyAdmin } from "~/features/roles/permission.service";

export const Route = createFileRoute("/dashboard/reports")({
  beforeLoad: ({ context }) => {
    const user = context.user;
    if (!user) throw redirect({ to: "/auth/login" });
    if (!isAnyAdmin(user)) throw redirect({ to: "/dashboard" });
  },
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Reports</h1>

      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center">
            <div className="text-muted-foreground">Loading reports...</div>
          </div>
        }
      >
        <AdminMembershipsReport />
      </Suspense>
    </div>
  );
}
