import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/player/events")({
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
