import { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { useCampaignsTranslation } from "~/hooks/useTypedTranslation";
import { CampaignCard } from "./CampaignCard";

interface CampaignListProps {
  campaigns: CampaignListItem[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const { t } = useCampaignsTranslation();

  if (campaigns.length === 0) {
    return <p className="text-muted-foreground">{t("status.no_campaigns_found")}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
