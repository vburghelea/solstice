import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { SqlWorkbench } from "~/features/bi/components/sql-workbench/SqlWorkbench";
import { useOrgContext } from "~/features/organizations/org-context";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/analytics/sql")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_analytics_sql_workbench");
  },
  component: SqlWorkbenchPage,
});

const allowedRoles = new Set(["owner", "admin", "reporter"]);

function SqlWorkbenchPage() {
  const { organizationRole } = useOrgContext();

  if (!organizationRole || !allowedRoles.has(organizationRole)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SQL access required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your organization role does not include SQL access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">SQL Workbench</h1>
        <p className="text-muted-foreground text-sm">
          Run governed SQL queries against curated datasets.
        </p>
      </div>
      <SqlWorkbench />
    </div>
  );
}
