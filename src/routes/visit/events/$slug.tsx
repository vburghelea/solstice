import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/visit/events/$slug")({
  component: EventLayout,
});

function EventLayout() {
  return <Outlet />;
}
