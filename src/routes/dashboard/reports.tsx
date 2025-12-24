import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { AdminMembershipsReport } from "~/features/membership/components/admin-memberships-report";
import { requireGlobalAdmin } from "~/lib/auth/middleware/role-guard";

export const Route = createFileRoute("/dashboard/reports")({
  beforeLoad: async ({ context }) => {
    await requireGlobalAdmin(context.user);
  },
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <div className="container mx-auto space-y-8 p-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reports</h1>

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
