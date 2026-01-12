import { Outlet, createFileRoute } from "@tanstack/react-router";
import { createPageHead } from "~/shared/lib/page-head";

export const Route = createFileRoute("/dashboard/events/$slug")({
  head: () => createPageHead("Event Details"),
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
