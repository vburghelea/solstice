import { QueryClientProvider } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { MOCK_CAMPAIGN, mockCreateCampaign } from "~/tests/mocks/campaigns";
import {
  MOCK_GAME_SYSTEM_DND5E,
  MOCK_GAME_SYSTEM_PATHFINDER2E,
} from "~/tests/mocks/game-systems";
import { mockSearchGameSystems } from "~/tests/mocks/games";
import {
  createTestQueryClient,
  createTestRouteTree,
  renderWithRouter,
} from "~/tests/utils/router";
import { Route as CreateCampaignRoute } from "../create";

const CreateCampaignPage = CreateCampaignRoute.options.component!;
// Make debounce immediate for tests to avoid timers
vi.mock("~/shared/hooks/useDebounce", () => ({
  /* eslint-disable @eslint-react/hooks-extra/no-unnecessary-use-prefix */
  useDebounce: <T,>(value: T) => value,
}));

// Use shared mocks from test harness (setup.ts wires module mocks)

// Initialize navigateMock at the top level
const navigateMock = vi.fn();

// Mock useNavigate from @tanstack/react-router at the top level
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    /* eslint-disable @eslint-react/hooks-extra/no-unnecessary-use-prefix */
    useNavigate: () => navigateMock,
  };
});

describe("CreateCampaignPage", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigateMock for each test
    navigateMock.mockClear();
    mockCreateCampaign.mockResolvedValue({ success: true, data: MOCK_CAMPAIGN });
    mockSearchGameSystems.mockResolvedValue({
      success: true,
      data: [MOCK_GAME_SYSTEM_DND5E, MOCK_GAME_SYSTEM_PATHFINDER2E],
    });
  });

  // Ensure useMutation calls the provided mutationFn so our mocks run
  beforeEach(async () => {
    const { spyUseMutationRun } = await import("~/tests/utils/react-query");
    spyUseMutationRun();
  });

  const renderCreateCampaignPage = async () => {
    const { createRouter, createMemoryHistory, RouterProvider } = await import(
      "@tanstack/react-router"
    );
    const routeTree = createTestRouteTree({
      routes: [
        {
          path: "/dashboard/campaigns/create",
          component: () => <CreateCampaignPage />,
        },
      ],
    });

    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/dashboard/campaigns/create"] }),
      defaultPendingMinMs: 0,
    });

    await router.load();

    const queryClient = createTestQueryClient();
    await renderWithRouter(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
  };

  it("renders the create campaign form", async () => {
    await renderCreateCampaignPage();

    expect(screen.getByText(/Create a New Campaign/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Campaign Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Campaign/i })).toBeInTheDocument();
  });

  const fillRequiredFields = async ({
    name,
    description,
  }: {
    name: string;
    description: string;
  }) => {
    await user.type(screen.getByLabelText(/Campaign Name/i), name);
    await user.type(screen.getByLabelText(/Description/i), description);
    await user.type(screen.getByLabelText(/Time of Day/i), "Evenings");
    await user.type(screen.getByLabelText(/Session Duration/i), "180");
    await user.type(screen.getByLabelText(/Address/i), "123 Test St");

    const selectFromRadix = async (labelRegex: RegExp, optionRegex: RegExp) => {
      const label = screen.getByText(labelRegex);
      const trigger = label.parentElement!.querySelector(
        '[data-slot="select-trigger"]',
      ) as HTMLElement;
      await user.click(trigger);
      const listbox = await screen.findByRole("listbox");
      await user.click(within(listbox).getByRole("option", { name: optionRegex }));
    };

    await selectFromRadix(/^Recurrence$/i, /^Weekly$/i);
    await selectFromRadix(/^Visibility$/i, /^Public$/i);

    const gameSystemCombobox = screen.getByTestId("game-system-combobox");
    const gameSystemInput = gameSystemCombobox.querySelector("input") as HTMLInputElement;
    await user.type(gameSystemInput, "D&D");
    const dndOption = await within(gameSystemCombobox).findByRole("option", {
      name: new RegExp(MOCK_GAME_SYSTEM_DND5E.name, "i"),
    });
    await user.click(dndOption);
    await user.keyboard("{Escape}");
    gameSystemInput.blur();
    await user.click(screen.getByLabelText(/Session Duration/i));

    await selectFromRadix(/^Language$/i, /^English$/i);
  };

  it("successfully creates a campaign and navigates to its details page", async () => {
    await renderCreateCampaignPage();

    await fillRequiredFields({
      name: "Test Campaign",
      description: "This is a test description.",
    });

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Test Campaign",
          description: "This is a test description.",
          timeOfDay: "Evenings",
          language: "en",
          gameSystemId: MOCK_GAME_SYSTEM_DND5E.id,
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
    mockCreateCampaign.mockResolvedValue({
      success: false,
      errors: [{ code: "SERVER_ERROR", message: errorMessage }],
    });

    await renderCreateCampaignPage();

    await fillRequiredFields({
      name: "Failing Campaign",
      description: "This campaign will fail.",
    });

    await user.click(screen.getByRole("button", { name: /Create Campaign/i }));

    await waitFor(() => {
      expect(mockCreateCampaign).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Error creating campaign/i)).toBeInTheDocument();
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
