import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/events")({
  beforeLoad: () => {
    requireFeatureInRoute("events");
  },
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
