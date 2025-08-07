import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/campaigns")({
  component: CampaignsLayout,
});

function CampaignsLayout() {
  return <Outlet />;
}
