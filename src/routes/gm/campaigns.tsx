import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/gm/campaigns")({
  component: CampaignsLayout,
});

function CampaignsLayout() {
  return <Outlet />;
}
