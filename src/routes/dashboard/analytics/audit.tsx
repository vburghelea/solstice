import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { AuditLogTable } from "~/features/audit/components/audit-log-table";
import { BiQueryLogTable } from "~/features/audit/components/bi-query-log-table";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/analytics/audit")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_audit");
  },
  head: () => createPageHead("Audit Logs"),
  component: AnalyticsAuditPage,
});

function AnalyticsAuditPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Tabs defaultValue="bi" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bi">BI query log</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="bi">
          <BiQueryLogTable />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
