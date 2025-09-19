import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/systems")({
  component: SystemsLayout,
});

function SystemsLayout() {
  return <Outlet />;
}
