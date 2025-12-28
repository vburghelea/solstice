import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useOrgContext } from "~/features/organizations/org-context";
import { ReportBuilderShell } from "~/features/reports/components/report-builder-shell";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/analytics")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_analytics");
  },
  component: SinAnalyticsPage,
});

const allowedRoles = new Set(["owner", "admin", "reporter"]);

function SinAnalyticsPage() {
  const { activeOrganizationId, organizationRole } = useOrgContext();

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to access analytics.</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard/select-org">Choose organization</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!organizationRole || !allowedRoles.has(organizationRole)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics access required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Your organization role does not include analytics access.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Build reports, pivots, and charts for your organization.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/sin/templates?context=analytics">View templates</Link>
        </Button>
      </div>
      <ReportBuilderShell />
    </div>
  );
}
