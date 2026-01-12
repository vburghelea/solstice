import { createFileRoute } from "@tanstack/react-router";
import { JoinRequestBrowser } from "~/features/organizations/join-requests/components/join-request-browser";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/organizations")({
  beforeLoad: () => {
    requireFeatureInRoute("org_join_requests");
  },
  head: () => createPageHead("Organizations"),
  component: OrganizationsBrowsePage,
});

function OrganizationsBrowsePage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <JoinRequestBrowser />
    </div>
  );
}
