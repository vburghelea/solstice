import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/visit/resources")({
  component: ResourcesLayout,
});

function ResourcesLayout() {
  return <Outlet />;
}
