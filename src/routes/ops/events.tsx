import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/ops/events")({
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
