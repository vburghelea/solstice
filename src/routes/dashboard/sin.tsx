import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/sin")({
  beforeLoad: ({ context, location }) => {
    requireFeatureInRoute("sin_portal");
    if (!context.activeOrganizationId) {
      throw redirect({
        to: "/dashboard/select-org",
        search: { redirect: location.href },
      });
    }
  },
  component: SinLayout,
});

function SinLayout() {
  return <Outlet />;
}
