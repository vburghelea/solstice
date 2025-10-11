import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/events/$slug")({
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
