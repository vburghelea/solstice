import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { PivotBuilder } from "~/features/bi/components/pivot-builder/PivotBuilder";
import { useOrgContext } from "~/features/organizations/org-context";

export const Route = createFileRoute("/dashboard/analytics/explore")({
  component: AnalyticsExplorePage,
});

const allowedRoles = new Set(["owner", "admin", "reporter"]);

function AnalyticsExplorePage() {
  const { organizationRole } = useOrgContext();

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
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Build pivots and charts with governed datasets.
        </p>
      </div>
      <PivotBuilder />
    </div>
  );
}
