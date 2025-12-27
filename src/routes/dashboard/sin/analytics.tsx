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
      <ReportBuilderShell />
    </div>
  );
}
