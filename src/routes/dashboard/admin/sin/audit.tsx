import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { AuditLogTable } from "~/features/audit/components/audit-log-table";
import { BiQueryLogTable } from "~/features/audit/components/bi-query-log-table";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/admin/sin/audit")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_admin_audit");
  },
  head: () => createPageHead("Audit Logs"),
  component: SinAuditPage,
});

function SinAuditPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
          <TabsTrigger value="bi">BI query log</TabsTrigger>
        </TabsList>
        <TabsContent value="audit">
          <AuditLogTable />
        </TabsContent>
        <TabsContent value="bi">
          <BiQueryLogTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
