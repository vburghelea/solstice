import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { OrgSwitcher } from "~/features/organizations/components/org-switcher";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/select-org")({
  validateSearch: searchSchema,
  beforeLoad: () => {
    requireFeatureInRoute("sin_portal");
  },
  component: SelectOrgPage,
});

function SelectOrgPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/dashboard/select-org" });

  const handleOrgSelected = (organizationId: string | null) => {
    // Only redirect if an organization was selected (not cleared)
    if (organizationId) {
      const destination = redirect || "/dashboard/sin";
      navigate({ to: destination });
    }
  };

  return (
    <div className="container mx-auto max-w-2xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Select an organization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Choose the organization you are working with to access SIN features.
          </p>
          <div className="mt-4">
            <OrgSwitcher onSuccess={handleOrgSelected} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
