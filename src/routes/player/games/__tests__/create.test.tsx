import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { MOCK_GAME, mockCreateGame } from "~/tests/mocks/games";
import { mockUseQueryCampaign, setupReactQueryMocks } from "~/tests/mocks/react-query";
import { spyUseMutationRun } from "~/tests/utils/react-query";
import { renderWithRouter } from "~/tests/utils/router";
import { Route as CreateGameRoute } from "../create";

const PlayerCreateGamePage = CreateGameRoute.options.component!;

describe("PlayerCreateGamePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupReactQueryMocks();
    spyUseMutationRun();
  });

  it("renders the create game form", async () => {
    await renderWithRouter(<PlayerCreateGamePage />, {
      path: "/player/games/create",
      initialEntries: ["/player/games/create"],
    });

    expect(screen.getByText("Create a New Game")).toBeInTheDocument();
    expect(screen.getByLabelText(/Game Session Name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Game/i })).toBeInTheDocument();
  });

  it("populates initial values from campaign when campaignId is present", async () => {
    mockUseQueryCampaign.mockReturnValue({
      data: { success: true, data: MOCK_CAMPAIGN },
      isLoading: false,
      isPending: false,
      isSuccess: true,
      error: null,
    });

    await renderWithRouter(<PlayerCreateGamePage />, {
      path: "/player/games/create",
      initialEntries: [`/player/games/create?campaignId=${MOCK_CAMPAIGN.id}`],
    });

    // Expected duration should reflect campaign.sessionDuration
    const expectedDuration = await screen.findByLabelText(
      /Expected Duration \(minutes\)/i,
    );
    expect(expectedDuration).toHaveValue(MOCK_CAMPAIGN.sessionDuration);
    // Campaign select shows campaign name
    expect(screen.getByText(MOCK_CAMPAIGN.name)).toBeInTheDocument();
  });

  it("handles successful game creation and navigates (no campaign context)", async () => {
    const user = userEvent.setup();
    mockCreateGame.mockResolvedValue({ success: true, data: MOCK_GAME });

    await renderWithRouter(<PlayerCreateGamePage />, {
      path: "/player/games/create",
      initialEntries: ["/player/games/create"],
    });

    await user.type(screen.getByLabelText(/Game Session Name/i), "New Game");
    await user.type(screen.getByLabelText(/Description/i), "New Description");
    await user.click(screen.getByRole("button", { name: /Create Game/i }));

    await waitFor(() => {
      expect(mockCreateGame).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Game",
          description: "New Description",
        }),
      });
    });
  });
});
