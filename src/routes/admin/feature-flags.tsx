import { createFileRoute } from "@tanstack/react-router";

import { AdminFeatureFlagConsole } from "~/features/admin/components/admin-feature-flag-console";

export const Route = createFileRoute("/admin/feature-flags")({
  component: AdminFeatureFlagsRoute,
});

function AdminFeatureFlagsRoute() {
  return <AdminFeatureFlagConsole />;
}
