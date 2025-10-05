import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/visit/events")({
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
