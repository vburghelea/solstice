import { createFileRoute } from "@tanstack/react-router";

import { CampaignCreateView, CampaignTipsCard } from "~/routes/gm/campaigns/create";

export const Route = createFileRoute("/player/campaigns/create")({
  component: PlayerCreateCampaignPage,
});

function PlayerCreateCampaignPage() {
  return <CampaignCreateView basePath="/player/campaigns" tips={<CampaignTipsCard />} />;
}
