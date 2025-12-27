import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { listForms } from "~/features/forms/forms.queries";
import { useOrgContext } from "~/features/organizations/org-context";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin/forms")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_forms");
  },
  component: SinFormsPage,
});

function SinFormsPage() {
  const { activeOrganizationId } = useOrgContext();

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["sin", "forms", activeOrganizationId],
    queryFn: () =>
      activeOrganizationId
        ? listForms({ data: { organizationId: activeOrganizationId } })
        : [],
    enabled: Boolean(activeOrganizationId),
  });

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization to view assigned forms.</CardTitle>
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
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Forms</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Complete required forms for your organization.
        </p>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground">Loading forms…</div>
      ) : forms.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No forms assigned yet.</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-base">{form.name}</CardTitle>
                <p className="text-muted-foreground text-xs">
                  {form.description || "No description provided."}
                </p>
                <Button asChild size="sm" className="w-fit">
                  <Link to={`/dashboard/sin/forms/${form.id}`}>Open form</Link>
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
