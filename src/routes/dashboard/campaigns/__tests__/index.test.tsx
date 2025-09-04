import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { screen } from "@testing-library/react";
import { vi } from "vitest";
import { listCampaigns } from "~/features/campaigns/campaigns.queries";
import { CampaignListItem } from "~/features/campaigns/campaigns.types";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { createTestRouteTree, renderWithRouter } from "~/tests/utils/router";
import { CampaignsPage } from "../index"; // Import the component directly

// Mock the listCampaigns query
vi.mock("~/features/campaigns/campaigns.queries", () => ({
  listCampaigns: vi.fn(),
}));

describe("CampaignsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to render the component within a router context
  const renderCampaignsPage = async (campaignsData: CampaignListItem[] = []) => {
    // Mock listCampaigns to return the provided data (for useSuspenseQuery)
    vi.mocked(listCampaigns).mockResolvedValue({
      success: true,
      data: campaignsData,
    });

    // Create a test route tree with a mocked loader for the campaigns route
    const routeTree = createTestRouteTree({
      routes: [
        {
          path: "/dashboard/campaigns",
          component: CampaignsPage,
          loader: async () => ({ campaigns: campaignsData }),
        },
      ],
    });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/dashboard/campaigns"] }),
      defaultPendingMinMs: 0,
    });

    // Wait for router to be ready
    await router.load();

    // Render the RouterProvider with the custom router
    await renderWithRouter(<RouterProvider router={router} />);
  };

  it("renders a list of campaigns", async () => {
    await renderCampaignsPage([
      MOCK_CAMPAIGN as unknown as CampaignListItem,
      {
        ...MOCK_CAMPAIGN,
        id: "campaign-2",
        name: "Another Campaign",
        participantCount: 0,
      } as unknown as CampaignListItem,
    ]);

    expect(screen.getByText("My Campaigns")).toBeInTheDocument();
    // Both mobile list and desktop grid render in tests (no CSS),
    // so names can appear multiple times. Assert at least once.
    expect(screen.getAllByText(MOCK_CAMPAIGN.name).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Another Campaign").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/View Campaign/i)).toHaveLength(2);

    // When campaigns are present, only the header link should exist
    const createLinks = screen.getAllByRole("link", { name: /Create New Campaign/i });
    expect(createLinks).toHaveLength(1);
    expect(createLinks[0]).toHaveAttribute("href", "/dashboard/campaigns/create");
  });

  it("renders 'No campaigns yet' message when no campaigns are found", async () => {
    await renderCampaignsPage([]);

    expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first campaign to get started"),
    ).toBeInTheDocument();
    expect(screen.queryByText(MOCK_CAMPAIGN.name)).not.toBeInTheDocument();

    // When no campaigns are present, both header and empty state card links should exist
    const createLinks = screen.getAllByRole("link", { name: /Create New Campaign/i });
    expect(createLinks).toHaveLength(2);
    createLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/dashboard/campaigns/create");
    });
  });

  // Removed the separate 'renders Create New Campaign links' test
  // as its logic is now integrated into the other two tests.
});
