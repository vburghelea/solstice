import { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { CampaignCard } from "./CampaignCard";

interface CampaignListProps {
  campaigns: CampaignListItem[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return <p className="text-muted-foreground">No campaigns found. Create one!</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
