import {
  CampaignListItem,
  CampaignWithDetails,
} from "~/features/campaigns/campaigns.types";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { renderWithRouter, screen } from "~/tests/utils";
import { CampaignCard } from "../CampaignCard";

describe("CampaignCard", () => {
  it("renders campaign information correctly", async () => {
    await renderWithRouter(
      <CampaignCard
        campaign={MOCK_CAMPAIGN as CampaignWithDetails as CampaignListItem}
      />,
      {
        path: "/player/campaigns",
        initialEntries: ["/player/campaigns"],
      },
    );

    expect(screen.getByText(MOCK_CAMPAIGN.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CAMPAIGN.description)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CAMPAIGN.recurrence)).toBeInTheDocument();
    expect(screen.getByText(MOCK_CAMPAIGN.timeOfDay)).toBeInTheDocument();
    expect(
      screen.getByText(MOCK_CAMPAIGN.sessionDuration.toString()),
    ).toBeInTheDocument();
    expect(
      screen.getByText(MOCK_CAMPAIGN.visibility, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        (MOCK_CAMPAIGN as unknown as CampaignListItem).participantCount.toString(),
      ),
    ).toBeInTheDocument();
  });

  it("renders a link to the campaign details page", async () => {
    await renderWithRouter(
      <CampaignCard campaign={MOCK_CAMPAIGN as unknown as CampaignListItem} />,
      {
        path: "/player/campaigns",
        initialEntries: ["/player/campaigns"],
      },
    );

    const link = screen.getByRole("link", { name: /View Campaign/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", `/player/campaigns/${MOCK_CAMPAIGN.id}`);
  });
});
