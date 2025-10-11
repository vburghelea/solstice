import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/player/campaigns")({
  component: CampaignsLayout,
});

function CampaignsLayout() {
  return <Outlet />;
}
