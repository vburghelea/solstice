import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createCampaign } from "~/features/campaigns/campaigns.mutations";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { createTestRouteTree, renderWithRouter } from "~/tests/utils/router";
import { CreateCampaignPage } from "../create";

// Mock mutations
vi.mock("~/features/campaigns/campaigns.mutations", () => ({
  createCampaign: vi.fn(),
}));

// Mock game systems query for CampaignForm
vi.mock("~/features/games/games.queries", () => ({
  searchGameSystems: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: 1, name: "D&D 5e", averagePlayTime: 180, minPlayers: 2, maxPlayers: 6 },
      ],
    }),
  ),
}));

// Initialize navigateMock at the top level
const navigateMock = vi.fn();

// Mock useNavigate from @tanstack/react-router at the top level
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useNavigate: () => navigateMock,
  };
});

describe.skip("CreateCampaignPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigateMock for each test
    navigateMock.mockClear();
    vi.mocked(createCampaign).mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });
  });

  const renderCreateCampaignPage = async () => {
    const { createRouter, createMemoryHistory, RouterProvider } = await import(
      "@tanstack/react-router"
    );
    const routeTree = createTestRouteTree({
      routes: [
        {
          path: "/dashboard/campaigns/create",
          component: CreateCampaignPage,
        },
      ],
    });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/dashboard/campaigns/create"] }),
      defaultPendingMinMs: 0,
    });

    await router.load();

    await renderWithRouter(<RouterProvider router={router} />);
  };

  it("renders the create campaign form", async () => {
    await renderCreateCampaignPage();

    expect(
      screen.getByRole("heading", { name: /Create a New Campaign/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Campaign Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Campaign/i })).toBeInTheDocument();
  });

  it("successfully creates a campaign and navigates to its details page", async () => {
    await renderCreateCampaignPage();

    await user.type(screen.getByLabelText(/Campaign Name/i), "Test Campaign");
    await user.type(screen.getByLabelText(/Description/i), "This is a test description.");

    // Select a game system
    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector('input[role="combobox"]');
    await user.type(gameSystemInput!, "D&D");
    await waitFor(() => {
      expect(screen.getByText("D&D 5e")).toBeInTheDocument();
    });
    await user.click(screen.getByText("D&D 5e"));
    await user.tab(); // Trigger onBlur for gameSystemId field

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(createCampaign).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Campaign",
          description: "This is a test description.",
          gameSystemId: 1, // Assuming D&D 5e has ID 1 from mock
        }),
      });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: `/dashboard/campaigns/${MOCK_CAMPAIGN.id}`,
      });
    });
  });

  it("displays a server error message on failed campaign creation", async () => {
    const errorMessage = "Campaign creation failed due to server issues.";
    vi.mocked(createCampaign).mockResolvedValue({
      success: false,
      errors: [{ code: "SERVER_ERROR", message: errorMessage }],
    });

    await renderCreateCampaignPage();

    await user.type(screen.getByLabelText(/Campaign Name/i), "Failing Campaign");
    await user.type(screen.getByLabelText(/Description/i), "This campaign will fail.");

    // Select a game system
    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector('input[role="combobox"]');
    await user.type(gameSystemInput!, "D&D");
    await waitFor(() => {
      expect(screen.getByText("D&D 5e")).toBeInTheDocument();
    });
    await user.click(screen.getByText("D&D 5e"));
    await user.tab();

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("navigates back to campaigns list when 'Back to Campaigns' is clicked", async () => {
    await renderCreateCampaignPage();

    const backLink = screen.getByRole("link", { name: /Back to Campaigns/i });
    await user.click(backLink);

    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard/campaigns" });
  });
});
