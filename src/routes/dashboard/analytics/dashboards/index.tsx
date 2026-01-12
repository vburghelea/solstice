import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useDashboards } from "~/features/bi/hooks/use-dashboard";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/analytics/dashboards/")({
  head: () => createPageHead("Dashboards"),
  component: DashboardsIndexPage,
});

function DashboardsIndexPage() {
  const dashboardsQuery = useDashboards();
  const dashboards = dashboardsQuery.data?.dashboards ?? [];

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboards</h1>
          <p className="text-muted-foreground text-sm">
            Organize analytics widgets into shareable dashboards.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/analytics/dashboards/new">New dashboard</Link>
        </Button>
      </div>

      {dashboards.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No dashboards yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Create a dashboard to start sharing analytics with your team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dashboards.map((dashboard) => (
            <Card key={dashboard.id}>
              <CardHeader>
                <CardTitle>{dashboard.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  {dashboard.description ?? "No description"}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link
                    to="/dashboard/analytics/dashboards/$dashboardId"
                    params={{
                      dashboardId: dashboard.id,
                    }}
                  >
                    Open dashboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
