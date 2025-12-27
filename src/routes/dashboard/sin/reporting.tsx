import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { useOrgContext } from "~/features/organizations/org-context";
import { listReportingOverview } from "~/features/reporting/reporting.queries";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/reporting")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_reporting");
  },
  component: SinReportingPage,
});

const statusTone = (status: string) => {
  if (status === "submitted" || status === "approved") {
    return "bg-green-100 text-green-800";
  }
  if (status === "overdue" || status === "changes_requested") {
    return "bg-amber-100 text-amber-800";
  }
  if (status === "rejected") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-200 text-gray-700";
};

function SinReportingPage() {
  const { activeOrganizationId } = useOrgContext();

  const { data: overview = [], isLoading } = useQuery({
    queryKey: ["reporting", "portal", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listReportingOverview({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to view reporting tasks.</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/dashboard/select-org">Choose organization</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Reporting Tasks</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Track upcoming reporting submissions and review your history.
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading reporting tasks…</div>
      ) : overview.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reporting tasks yet.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4">
          {overview.map((item) => (
            <Card key={item.submissionId}>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">{item.taskTitle}</CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Due {new Date(item.dueDate).toLocaleDateString()} • Cycle{" "}
                    {item.cycleName}
                  </p>
                </div>
                <Badge variant="secondary" className={statusTone(item.status)}>
                  {item.status.replace(/_/g, " ")}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild size="sm">
                  <Link to={`/dashboard/sin/forms/${item.formId}`}>Open form</Link>
                </Button>
                {item.formSubmissionId ? (
                  <Button asChild size="sm" variant="outline">
                    <Link to={`/dashboard/sin/submissions/${item.formSubmissionId}`}>
                      View submission
                    </Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
