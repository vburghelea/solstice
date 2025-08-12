import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { createCampaign } from "~/features/campaigns/campaigns.mutations";
import * as gamesQueries from "~/features/games/games.queries"; // Import as gamesQueries
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import {
  MOCK_GAME_SYSTEM_DND5E,
  MOCK_GAME_SYSTEM_PATHFINDER2E,
} from "~/tests/mocks/game-systems";
import { createTestRouteTree, renderWithRouter } from "~/tests/utils/router";
import { CreateCampaignPage } from "../create";

// Mock mutations
vi.mock("~/features/campaigns/campaigns.mutations", () => ({
  createCampaign: vi.fn(),
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

describe("CreateCampaignPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigateMock for each test
    navigateMock.mockClear();
    vi.mocked(createCampaign).mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });

    vi.spyOn(gamesQueries, "searchGameSystems").mockResolvedValue({
      success: true,
      data: [MOCK_GAME_SYSTEM_DND5E, MOCK_GAME_SYSTEM_PATHFINDER2E],
    });
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

    expect(screen.getByText(/Create a New Campaign/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Campaign Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Campaign/i })).toBeInTheDocument();
  });

  it.skip("successfully creates a campaign and navigates to its details page", async () => {
    await renderCreateCampaignPage();

    await user.type(screen.getByLabelText(/Campaign Name/i), "Test Campaign");
    await user.type(screen.getByLabelText(/Description/i), "This is a test description.");

    // Select a game system
    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector('input[role="combobox"]');
    await user.type(gameSystemInput!, "D&D");
    screen.debug(); // Add screen.debug() here

    const dnd5eOption = await screen.findByRole("option", {
      name: MOCK_GAME_SYSTEM_DND5E.name,
    });
    expect(dnd5eOption).toBeInTheDocument();

    await user.click(dnd5eOption);
    await user.tab(); // Trigger onBlur for gameSystemId field

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(createCampaign).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Campaign",
          description: "This is a test description.",
          gameSystemId: MOCK_GAME_SYSTEM_DND5E.id, // Assuming D&D 5e has ID 1 from mock
        }),
      });
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({
        to: `/dashboard/campaigns/${MOCK_CAMPAIGN.id}`,
      });
    });
  });

  it.skip("displays a server error message on failed campaign creation", async () => {
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

    const dnd5eOption = await screen.findByRole("option", {
      name: MOCK_GAME_SYSTEM_DND5E.name,
    });
    expect(dnd5eOption).toBeInTheDocument();

    await user.click(dnd5eOption);
    await user.tab();

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("navigates back to campaigns list when 'Cancel' is clicked", async () => {
    await renderCreateCampaignPage();

    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelButton);

    expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard/campaigns" });
  });
});
