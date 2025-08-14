import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as gamesQueries from "~/features/games/games.queries"; // Import as gamesQueries
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import {
  MOCK_GAME_SYSTEM_DND5E,
  MOCK_GAME_SYSTEM_PATHFINDER2E,
} from "~/tests/mocks/game-systems";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter, screen, waitFor } from "~/tests/utils/router";
import { CampaignForm } from "../CampaignForm";

// Mock mutations
vi.mock("~/features/campaigns/campaigns.mutations", () => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}));

import { setupReactQueryMocks } from "~/tests/mocks/react-query"; // Added import

describe("CampaignForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupReactQueryMocks(); // Added call

    vi.spyOn(gamesQueries, "searchGameSystems").mockResolvedValue({
      success: true,
      data: [MOCK_GAME_SYSTEM_DND5E, MOCK_GAME_SYSTEM_PATHFINDER2E],
    });
  });

  // Helper to render the component within an authenticated router context
  const renderCampaignForm = (props: React.ComponentProps<typeof CampaignForm>) => {
    return renderWithRouter(<CampaignForm {...props} />, {
      user: MOCK_OWNER_USER,
    });
  };

  it("renders correctly for creating a new campaign", async () => {
    await renderCampaignForm({ onSubmit: vi.fn(), isSubmitting: false });

    expect(screen.getByLabelText(/Campaign Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Campaign/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Update Campaign/i }),
    ).not.toBeInTheDocument();
  });

  it("renders correctly for updating an existing campaign", async () => {
    await renderCampaignForm({
      initialValues: {
        ...MOCK_CAMPAIGN,
        sessionZeroData: MOCK_CAMPAIGN.sessionZeroData ?? undefined,
        campaignExpectations: MOCK_CAMPAIGN.campaignExpectations ?? undefined,
        tableExpectations: MOCK_CAMPAIGN.tableExpectations ?? undefined,
        characterCreationOutcome: MOCK_CAMPAIGN.characterCreationOutcome ?? undefined,
      },
      onSubmit: vi.fn(),
      isSubmitting: false,
    });

    expect(screen.getByLabelText(/Campaign Name/i)).toHaveValue(MOCK_CAMPAIGN.name);
    expect(screen.getByLabelText(/Description/i)).toHaveValue(MOCK_CAMPAIGN.description);
    expect(screen.getByRole("button", { name: /Update Campaign/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Create Campaign/i }),
    ).not.toBeInTheDocument();
  });

  it("displays validation errors for required fields", async () => {
    const user = userEvent.setup();
    await renderCampaignForm({ onSubmit: vi.fn(), isSubmitting: false });

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(screen.getByText(/Campaign name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
    });
  });

  it.skip("handles game system selection", async () => {
    const user = userEvent.setup();
    await renderCampaignForm({ onSubmit: vi.fn(), isSubmitting: false });

    // Use data-testid to find the combobox input
    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector('input[role="combobox"]');

    expect(gameSystemInput).toBeInTheDocument();

    // Simulate typing to trigger search and open dropdown
    await user.type(gameSystemInput!, "D&D");

    // Wait for the CommandList to appear (assuming it becomes visible after search)
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument(); // CommandList has role="listbox"
    });

    // Now try to find the text within the listbox
    const dnd5eOption = screen.getByText(MOCK_GAME_SYSTEM_DND5E.name);
    const pathfinder2eOption = screen.getByText(MOCK_GAME_SYSTEM_PATHFINDER2E.name);

    expect(dnd5eOption).toBeInTheDocument();
    expect(pathfinder2eOption).toBeInTheDocument();

    await user.click(dnd5eOption);
    await user.tab(); // Trigger onBlur for gameSystemId field

    // Check if the input value is updated (assuming the combobox displays the selected name)
    expect(gameSystemInput).toHaveValue("D&D 5e");
  });
});
