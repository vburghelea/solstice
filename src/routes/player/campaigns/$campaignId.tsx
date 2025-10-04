import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/player/campaigns/$campaignId")({
  component: () => <Outlet />,
});
