import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { listImportJobs } from "~/features/imports/imports.queries";
import { useOrgContext } from "~/features/organizations/org-context";
import { TutorialPanel } from "~/features/tutorials/components/tutorial-panel";
import { requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin/imports")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_imports");
  },
  head: () => createPageHead("Imports"),
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Imports</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Review recent import activity for your organization.
          </p>
        </div>
        <Button asChild variant="outline" data-tour="imports-templates">
          <Link to="/dashboard/sin/templates?context=imports">View templates</Link>
        </Button>
      </div>

      <TutorialPanel title="Data upload walkthrough" tutorialIds={["data_upload"]} />

      {isLoading ? (
        <div className="text-muted-foreground">Loading import jobs…</div>
      ) : jobs.length === 0 ? (
        <Card data-tour="imports-list">
          <CardHeader>
            <CardTitle>No imports yet.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3" data-tour="imports-list">
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
