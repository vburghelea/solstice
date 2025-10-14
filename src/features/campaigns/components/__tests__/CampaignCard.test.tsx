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

  it("displays RoleBadge when user has a role in the campaign", async () => {
    const campaignWithRole = {
      ...MOCK_CAMPAIGN,
      userRole: {
        role: "owner" as const,
        status: "approved" as const,
      },
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    // Should show the RoleBadge with owner role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("👑")).toBeInTheDocument();
    expect(screen.getByText("Organizer")).toBeInTheDocument();
  });

  it("displays participant role badge when user is an approved participant", async () => {
    const campaignWithRole = {
      ...MOCK_CAMPAIGN,
      userRole: {
        role: "player" as const,
        status: "approved" as const,
      },
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    // Should show the RoleBadge with player role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Participant")).toBeInTheDocument();
  });

  it("displays pending role badge when user has pending status", async () => {
    const campaignWithRole = {
      ...MOCK_CAMPAIGN,
      userRole: {
        role: "player" as const,
        status: "pending" as const,
      },
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    // Should show the RoleBadge with pending status
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("🎭")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("displays invited role badge when user is invited", async () => {
    const campaignWithRole = {
      ...MOCK_CAMPAIGN,
      userRole: {
        role: "invited" as const,
      },
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    // Should show the RoleBadge with invited role
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("📧")).toBeInTheDocument();
    expect(screen.getByText("Invitee")).toBeInTheDocument();
  });

  it("does not display RoleBadge when user has no role", async () => {
    const campaignWithoutRole = {
      ...MOCK_CAMPAIGN,
      userRole: null,
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithoutRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    // Should not show any RoleBadge
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText("👑")).not.toBeInTheDocument();
    expect(screen.queryByText("🎭")).not.toBeInTheDocument();
    expect(screen.queryByText("📧")).not.toBeInTheDocument();
  });

  it("displays role badge with shrink-0 class to prevent layout issues", async () => {
    const campaignWithRole = {
      ...MOCK_CAMPAIGN,
      userRole: {
        role: "owner" as const,
        status: "approved" as const,
      },
    } as unknown as CampaignListItem;

    await renderWithRouter(<CampaignCard campaign={campaignWithRole} />, {
      path: "/player/campaigns",
      initialEntries: ["/player/campaigns"],
    });

    const roleBadge = screen.getByRole("status");
    expect(roleBadge).toHaveClass("shrink-0");
  });
});
