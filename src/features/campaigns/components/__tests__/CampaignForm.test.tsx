import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter, screen, waitFor } from "~/tests/utils/router";
import { CampaignForm } from "../CampaignForm";

// Mock mutations
vi.mock("~/features/campaigns/campaigns.mutations", () => ({
  createCampaign: vi.fn(),
  updateCampaign: vi.fn(),
}));

// Mock game systems query
vi.mock("~/features/games/games.queries", () => ({
  searchGameSystems: vi.fn(() =>
    Promise.resolve({
      success: true,
      data: [
        { id: 1, name: "D&D 5e", averagePlayTime: 180, minPlayers: 2, maxPlayers: 6 },
        {
          id: 2,
          name: "Pathfinder 2e",
          averagePlayTime: 240,
          minPlayers: 3,
          maxPlayers: 5,
        },
      ],
    }),
  ),
}));

describe("CampaignForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      initialValues: MOCK_CAMPAIGN,
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

  it("handles game system selection", async () => {
    const user = userEvent.setup();
    await renderCampaignForm({ onSubmit: vi.fn(), isSubmitting: false });

    // Use data-testid to find the combobox input
    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector('input[role="combobox"]');

    expect(gameSystemInput).toBeInTheDocument();

    // Simulate typing to trigger search and open dropdown
    await user.type(gameSystemInput!, "D&D");

    await waitFor(() => {
      expect(screen.getByText("D&D 5e")).toBeInTheDocument();
      expect(screen.getByText("Pathfinder 2e")).toBeInTheDocument();
    });

    await user.click(screen.getByText("D&D 5e"));
    await user.tab(); // Trigger onBlur for gameSystemId field // Select D&D 5e

    // Check if the input value is updated (assuming the combobox displays the selected name)
    expect(gameSystemInput).toHaveValue("D&D 5e");
  });
});
