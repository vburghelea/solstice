import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCampaign } from "~/features/campaigns/campaigns.queries";
import { createGame } from "~/features/games/games.mutations";
import { getGameSystem } from "~/features/games/games.queries";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { MOCK_GAME, MOCK_GAME_SYSTEM } from "~/tests/mocks/games";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter } from "~/tests/utils/router";
import { CreateGamePage } from "../create";

// Mock queries and mutations
vi.mock("~/features/campaigns/campaigns.queries", () => ({
  getCampaign: vi.fn(),
}));

vi.mock("~/features/games/games.mutations", () => ({
  createGame: vi.fn(),
}));

vi.mock("~/features/games/games.queries", () => ({
  getGameSystem: vi.fn(),
}));

const queryClient = new QueryClient();

describe("CreateGamePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    vi.mocked(getGameSystem).mockResolvedValue({
      success: true,
      data: MOCK_GAME_SYSTEM,
    });
  });

  it("renders the create game form", async () => {
    await renderWithRouter(<CreateGamePage />);

    expect(screen.getByText("Create a New Game")).toBeInTheDocument();
    expect(screen.getByLabelText(/Game Session Name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Game/i })).toBeInTheDocument();
  });

  it.skip("populates initial values from campaign when campaignId is present", async () => {
    vi.mocked(getCampaign).mockResolvedValue({
      success: true,
      data: MOCK_CAMPAIGN,
    });

    vi.mock("@tanstack/react-router", async (importOriginal) => {
      const original = await importOriginal<typeof import("@tanstack/react-router")>();
      return {
        ...original,
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useSearch: () => ({ campaignId: MOCK_CAMPAIGN.id }),
      };
    });

    await renderWithRouter(<CreateGamePage />, {
      initialEntries: [`/dashboard/games/create?campaignId=${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCK_CAMPAIGN.name)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(MOCK_CAMPAIGN.sessionDuration.toString()),
      ).toBeInTheDocument();
    });
  });

  it.skip("handles successful game creation and navigates", async () => {
    const user = userEvent.setup();
    vi.mocked(createGame).mockResolvedValue({
      success: true,
      data: MOCK_GAME,
    });

    const navigateMock = vi.fn();
    vi.mock("@tanstack/react-router", async (importOriginal) => {
      const original = await importOriginal<typeof import("@tanstack/react-router")>();
      return {
        ...original,
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useNavigate: () => navigateMock,
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useSearch: () => ({ campaignId: undefined }), // Mock useSearch for this test
      };
    });

    await renderWithRouter(<CreateGamePage />);

    await user.type(screen.getByLabelText(/Game Session Name/i), "New Game");
    await user.type(screen.getByLabelText(/Description/i), "New Description");
    await user.click(screen.getByRole("button", { name: /Create Game/i }));

    await waitFor(() => {
      expect(createGame).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Game",
          description: "New Description",
          ownerId: MOCK_OWNER_USER.id,
        }),
      });
    });
    expect(navigateMock).toHaveBeenCalledWith({ to: `/dashboard/games/${MOCK_GAME.id}` });
  });

  it("displays server-side errors", async () => {
    const user = userEvent.setup();
    vi.mocked(createGame).mockResolvedValue({
      success: false,
      errors: [{ code: "SERVER_ERROR", message: "Failed to create game" }],
    });

    vi.mock("@tanstack/react-router", async (importOriginal) => {
      const original = await importOriginal<typeof import("@tanstack/react-router")>();
      return {
        ...original,
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useNavigate: () => vi.fn(),
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useSearch: () => ({ campaignId: undefined }),
      };
    });

    await renderWithRouter(<CreateGamePage />);

    await user.type(screen.getByLabelText(/Game Session Name/i), "New Game");
    await user.click(screen.getByRole("button", { name: /Create Game/i }));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create game/i)).toBeInTheDocument();
    });
  });

  it("has a back link to games list", async () => {
    await renderWithRouter(<CreateGamePage />);

    const backLink = screen.getByRole("link", { name: /Back to Games/i });
    expect(backLink).toHaveAttribute("href", "/dashboard/games");
  });
});
