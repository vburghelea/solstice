import { createFileRoute } from "@tanstack/react-router";
import { AuditLogTable } from "~/features/audit/components/audit-log-table";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/audit")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_audit");
  },
  component: SinAuditPage,
});

function SinAuditPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <AuditLogTable />
    </div>
  );
}
