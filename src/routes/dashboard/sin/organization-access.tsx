import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { SafeLink } from "~/components/ui/SafeLink";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { InviteLinksPanel } from "~/features/organizations/invite-links/components/invite-links-panel";
import { JoinRequestsAdminPanel } from "~/features/organizations/join-requests/components/join-requests-admin-panel";
import { updateOrganizationAccessSettings } from "~/features/organizations/join-requests/join-requests.mutations";
import { useOrgContext } from "~/features/organizations/org-context";
import { getOrganization } from "~/features/organizations/organizations.queries";
import { isFeatureEnabled, requireFeatureInRoute } from "~/tenant/feature-gates";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/sin/organization-access")({
  beforeLoad: () => {
    requireFeatureInRoute("sin_portal");
    if (!isFeatureEnabled("org_join_requests") && !isFeatureEnabled("org_invite_links")) {
      requireFeatureInRoute("org_join_requests");
    }
  },
  head: () => createPageHead("Organization access"),
  component: OrganizationAccessPage,
});

function OrganizationAccessPage() {
  const { activeOrganizationId, organizationRole } = useOrgContext();
  const isOrgAdmin = organizationRole === "owner" || organizationRole === "admin";
  const showJoinRequests = isFeatureEnabled("org_join_requests");
  const showInviteLinks = isFeatureEnabled("org_invite_links");
  const queryClient = useQueryClient();

  const { data: organization } = useQuery({
    queryKey: ["organizations", "detail", activeOrganizationId],
    queryFn: () =>
      getOrganization({ data: { organizationId: activeOrganizationId ?? "" } }),
    enabled: Boolean(activeOrganizationId),
  });

  const accessMutation = useMutation({
    mutationFn: (payload: { isDiscoverable?: boolean; joinRequestsEnabled?: boolean }) =>
      updateOrganizationAccessSettings({
        data: {
          organizationId: activeOrganizationId ?? "",
          ...payload,
        },
      }),
    onSuccess: () => {
      toast.success("Access settings updated.");
      void queryClient.invalidateQueries({
        queryKey: ["organizations", "detail", activeOrganizationId],
      });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update settings.");
    },
  });

  if (!activeOrganizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select an organization</CardTitle>
          <CardDescription>
            Choose your organization to manage access requests and invite links.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <SafeLink to="/dashboard/select-org">Choose organization</SafeLink>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isOrgAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin access required</CardTitle>
          <CardDescription>
            You need an owner or admin role in this organization to manage access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showJoinRequests ? (
        <Card>
          <CardHeader>
            <CardTitle>Access settings</CardTitle>
            <CardDescription>
              Control how your organization appears in join requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="org-discoverable"
                checked={organization?.isDiscoverable ?? false}
                onCheckedChange={(checked) =>
                  accessMutation.mutate({ isDiscoverable: Boolean(checked) })
                }
                disabled={accessMutation.isPending || !organization}
              />
              <Label htmlFor="org-discoverable">Show in organization directory</Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="org-join-requests"
                checked={organization?.joinRequestsEnabled ?? false}
                onCheckedChange={(checked) =>
                  accessMutation.mutate({ joinRequestsEnabled: Boolean(checked) })
                }
                disabled={accessMutation.isPending || !organization}
              />
              <Label htmlFor="org-join-requests">Allow join requests</Label>
            </div>
          </CardContent>
        </Card>
      ) : null}
      {showJoinRequests ? (
        <JoinRequestsAdminPanel organizationId={activeOrganizationId} />
      ) : null}
      {showInviteLinks ? (
        <InviteLinksPanel organizationId={activeOrganizationId} />
      ) : null}
    </div>
  );
}
