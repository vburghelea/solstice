import { QueryClient } from "@tanstack/react-query";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useLoaderData, useParams, useRouteContext } from "@tanstack/react-router";
import { getCurrentUser } from "~/features/auth/auth.queries";
import { getCampaignApplications } from "~/features/campaigns/campaigns.queries";
import { updateGameSessionStatus } from "~/features/games/games.mutations";
import { listGameSessionsByCampaignId } from "~/features/games/games.queries";

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  };
});

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router",
  );
  return {
    ...actual,
    useLoaderData: vi.fn(),
    useParams: vi.fn(),
    useRouteContext: vi.fn(),
  };
});

vi.mock("~/features/auth/auth.queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/features/auth/auth.queries")>();
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    getProviders: vi.fn(),
    changePassword: vi.fn(),
  };
});

import type { GameWithDetails } from "~/features/games/games.types";
import type { User } from "~/lib/auth/types";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import {
  MOCK_CAMPAIGN_GAME_1,
  MOCK_CAMPAIGN_GAME_2,
  MOCK_CAMPAIGN_GAME_3,
} from "~/tests/mocks/games";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter } from "~/tests/utils/router";
import { CampaignDetailsPage } from "../$campaignId";

// Mock CampaignGameSessionCard
vi.mock("~/features/games/components/CampaignGameSessionCard", () => ({
  CampaignGameSessionCard: vi.fn(({ game, isOwner, onUpdateStatus }) => (
    <div data-testid={`mock-game-session-card-${game.id}`}>
      <h3>{game.name}</h3>
      <p>{game.status}</p>
      {isOwner && (
        <button
          type="button"
          onClick={() => onUpdateStatus({ data: { id: game.id, status: "completed" } })}
        >
          Mark Completed
        </button>
      )}
    </div>
  )),
}));

// Mock application data
const MOCK_APPLICATIONS = [
  {
    id: "app-1",
    campaignId: MOCK_CAMPAIGN.id,
    userId: "user-2",
    user: { ...MOCK_OWNER_USER, id: "user-2", name: "Alice", email: "alice@example.com" },
    status: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "app-2",
    campaignId: MOCK_CAMPAIGN.id,
    userId: "user-3",
    user: { ...MOCK_OWNER_USER, id: "user-3", name: "Bob", email: "bob@example.com" },
    status: "pending" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe.skip("Campaign Details Page", () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const mockCurrentUser = (user: User | null) => {
    vi.mocked(getCurrentUser).mockResolvedValue(user);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockCurrentUser(MOCK_OWNER_USER); // Default to authenticated owner

    vi.mocked(useLoaderData).mockReturnValue({ campaign: MOCK_CAMPAIGN });
    vi.mocked(useParams).mockReturnValue({ campaignId: MOCK_CAMPAIGN.id });
    vi.mocked(useRouteContext).mockReturnValue({ user: MOCK_OWNER_USER });
    vi.mocked(listGameSessionsByCampaignId).mockResolvedValue({
      success: true,
      data: [MOCK_CAMPAIGN_GAME_1, MOCK_CAMPAIGN_GAME_2, MOCK_CAMPAIGN_GAME_3],
    });
    vi.mocked(updateGameSessionStatus).mockResolvedValue({
      success: true,
      data: {
        ...(MOCK_CAMPAIGN_GAME_1 as unknown as GameWithDetails),
        status: "completed",
      }, // Mock a successful update
    });
    vi.mocked(getCampaignApplications).mockResolvedValue({
      success: true,
      data: MOCK_APPLICATIONS,
    });
  });

  it("renders the campaign details page", async () => {
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(screen.getByText(MOCK_CAMPAIGN.name)).toBeInTheDocument();
      expect(screen.getByText(/Game Sessions/i)).toBeInTheDocument();
      // Explicitly wait for game session data to be processed and rendered
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_1.id}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_2.id}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_3.id}`),
      ).toBeInTheDocument();
    });
  });

  it("filters game sessions by status", async () => {
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_1.id}`),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_2.id}`),
      ).toBeInTheDocument();
    });

    // Select "Scheduled" status
    fireEvent.mouseDown(screen.getByRole("button", { name: /Filter by status/i }));
    fireEvent.click(screen.getByText(/Scheduled/i));

    await waitFor(() => {
      expect(listGameSessionsByCampaignId).toHaveBeenCalledWith({
        data: { campaignId: MOCK_CAMPAIGN.id, status: "scheduled" },
      });
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_1.id}`),
      ).toBeInTheDocument();
      expect(
        screen.queryByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_2.id}`),
      ).not.toBeInTheDocument();
    });

    // Select "Completed" status
    fireEvent.mouseDown(screen.getByRole("button", { name: /Scheduled/i })); // Click the current filter button
    fireEvent.click(screen.getByText(/Completed/i));

    await waitFor(() => {
      expect(listGameSessionsByCampaignId).toHaveBeenCalledWith({
        data: { campaignId: MOCK_CAMPAIGN.id, status: "completed" },
      });
      expect(
        screen.queryByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_1.id}`),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_2.id}`),
      ).toBeInTheDocument();
    });
  });

  it("navigates to game creation page with campaignId when 'Create Game Session' is clicked", async () => {
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Create Game Session/i }),
      ).toBeInTheDocument();
    });

    const createGameButton = screen.getByRole("link", { name: /Create Game Session/i });
    expect(createGameButton).toHaveAttribute(
      "href",
      `/dashboard/games/create?campaignId=${MOCK_CAMPAIGN.id}`,
    );
  });

  describe("CampaignGameSessionCard actions", () => {
    it("shows 'Mark Completed' and 'Cancel Session' for scheduled games", async () => {
      vi.mocked(listGameSessionsByCampaignId).mockResolvedValueOnce({
        success: true,
        data: [MOCK_CAMPAIGN_GAME_1],
      });

      await renderWithRouter(<CampaignDetailsPage />, {
        path: "/dashboard/campaigns/$campaignId",
        initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
      });
      await waitFor(() => {
        expect(
          screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_1.id}`),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Mark Completed/i }),
        ).toBeInTheDocument();
      });
    });

    it("does not show 'Mark Completed' or 'Cancel Session' for completed games", async () => {
      vi.mocked(listGameSessionsByCampaignId).mockResolvedValueOnce({
        success: true,
        data: [MOCK_CAMPAIGN_GAME_2],
      });

      await renderWithRouter(<CampaignDetailsPage />, {
        path: "/dashboard/campaigns/$campaignId",
        initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
      });
      await waitFor(() => {
        expect(
          screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_2.id}`),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /Mark Completed/i }),
        ).not.toBeInTheDocument();
      });
    });

    it("does not show 'Mark Completed' or 'Cancel Session' for canceled games", async () => {
      vi.mocked(listGameSessionsByCampaignId).mockResolvedValueOnce({
        success: true,
        data: [MOCK_CAMPAIGN_GAME_3],
      });

      await renderWithRouter(<CampaignDetailsPage />, {
        path: "/dashboard/campaigns/$campaignId",
        initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
      });
      await waitFor(() => {
        expect(
          screen.getByTestId(`mock-game-session-card-${MOCK_CAMPAIGN_GAME_3.id}`),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: /Mark Completed/i }),
        ).not.toBeInTheDocument();
      });
    });

    it("calls updateGameSessionStatus with 'completed' when 'Mark Completed' is clicked", async () => {
      vi.mocked(listGameSessionsByCampaignId).mockResolvedValueOnce({
        success: true,
        data: [MOCK_CAMPAIGN_GAME_1],
      });

      await renderWithRouter(<CampaignDetailsPage />, {
        path: "/dashboard/campaigns/$campaignId",
        initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
      });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Mark Completed/i }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Mark Completed/i }));

      await waitFor(() => {
        expect(updateGameSessionStatus).toHaveBeenCalledWith({
          data: { id: MOCK_CAMPAIGN_GAME_1.id, status: "completed" },
        });
      });
    });

    it("calls updateGameSessionStatus with 'canceled' when 'Cancel Session' is clicked", async () => {
      vi.mocked(listGameSessionsByCampaignId).mockResolvedValueOnce({
        success: true,
        data: [MOCK_CAMPAIGN_GAME_1],
      });

      await renderWithRouter(<CampaignDetailsPage />, {
        path: "/dashboard/campaigns/$campaignId",
        initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
      });
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Cancel Session/i }),
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /Cancel Session/i }));

      await waitFor(() => {
        expect(updateGameSessionStatus).toHaveBeenCalledWith({
          data: { id: MOCK_CAMPAIGN_GAME_1.id, status: "canceled" },
        });
      });
    });
  });

  it("renders Invite Participants and Manage Applications sections for campaign owner", async () => {
    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Invite Participants/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Manage Applications/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(MOCK_APPLICATIONS[0].user.name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_APPLICATIONS[1].user.name)).toBeInTheDocument();
    });
  });

  it("does not render Invite Participants and Manage Applications sections for non-owner", async () => {
    mockCurrentUser({ ...MOCK_OWNER_USER, id: "non-owner-id" }); // Mock a non-owner user

    await renderWithRouter(<CampaignDetailsPage />, {
      path: "/dashboard/campaigns/$campaignId",
      initialEntries: [`/dashboard/campaigns/${MOCK_CAMPAIGN.id}`],
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /Invite Participants/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: /Manage Applications/i }),
      ).not.toBeInTheDocument();
    });
  });
});
