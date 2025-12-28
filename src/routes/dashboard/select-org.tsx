import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { SafeLink } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { OrgSwitcher } from "~/features/organizations/components/org-switcher";
import { useOrgContext } from "~/features/organizations/org-context";
import { getBrand } from "~/tenant";
import { isFeatureEnabled, requireFeatureInRoute } from "~/tenant/feature-gates";

const isSafeRedirect = (value: string) => {
  if (!value.startsWith("/dashboard")) return false;
  if (value.startsWith("//")) return false;
  if (value.includes("://")) return false;
  return true;
};

const searchSchema = z.object({
  redirect: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && isSafeRedirect(value) ? value : undefined)),
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
  const { accessibleOrganizations, isLoading } = useOrgContext();
  const brand = getBrand();
  const supportEmail = brand.supportEmail ?? "support@solstice.app";
  const supportLabel = brand.supportName ?? "the support team";
  const joinRequestsEnabled = isFeatureEnabled("org_join_requests");
  const supportCenterEnabled = isFeatureEnabled("sin_support");
  const showEmptyState = !isLoading && accessibleOrganizations.length === 0;

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
          <CardTitle>
            {showEmptyState ? "No organizations available" : "Select an organization"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading organizations...</p>
          ) : showEmptyState ? (
            <div className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Your account does not have access to any organizations yet. SIN access is
                invitation-only, so you will need an organization admin to add you.
              </p>
              <div className="bg-muted/30 rounded-md border border-dashed p-4 text-sm">
                <p className="font-medium">How to get access</p>
                <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Ask your organization admin to invite you using your sign-up email.
                  </li>
                  {joinRequestsEnabled ? (
                    <li>Browse discoverable organizations and request access.</li>
                  ) : null}
                  <li>
                    Contact {supportLabel} at{" "}
                    <a
                      className="underline underline-offset-2"
                      href={`mailto:${supportEmail}`}
                    >
                      {supportEmail}
                    </a>
                    .
                  </li>
                </ul>
              </div>
              <div className="flex flex-wrap gap-3">
                {joinRequestsEnabled ? (
                  <Button asChild>
                    <a href="/dashboard/organizations">Browse organizations</a>
                  </Button>
                ) : null}
                {supportCenterEnabled ? (
                  <Button asChild variant="outline">
                    <SafeLink to="/dashboard/sin/support">Open support center</SafeLink>
                  </Button>
                ) : (
                  <Button asChild variant="outline">
                    <a href={`mailto:${supportEmail}`}>Contact support</a>
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm">
                Choose the organization you are working with to access SIN features.
              </p>
              <div className="mt-4">
                <OrgSwitcher onSuccess={handleOrgSelected} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
