import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { listImportJobs } from "~/features/imports/imports.queries";
import { useOrgContext } from "~/features/organizations/org-context";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/imports")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_imports");
  },
  component: SinImportsPage,
});

function SinImportsPage() {
  const { activeOrganizationId } = useOrgContext();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["imports", "portal", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listImportJobs({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to view imports.</CardTitle>
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Imports</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Review recent import activity for your organization.
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading import jobs…</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No imports yet.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold capitalize">
                    {job.type} import • {job.lane}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Started {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {job.status.replace(/_/g, " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
