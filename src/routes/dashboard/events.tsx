import { createFileRoute, Outlet } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";
import { requireFeatureInRoute } from "~/tenant/feature-gates";

export const Route = createFileRoute("/dashboard/events")({
  beforeLoad: () => {
    requireFeatureInRoute("events");
  },
  head: () => createPageHead("Events"),
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
