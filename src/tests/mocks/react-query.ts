import { vi } from "vitest";
import { MOCK_APPLICATIONS, MOCK_CAMPAIGN } from "./campaigns";
import { MOCK_GAME_SYSTEM } from "./game-systems";
import {
  MOCK_CAMPAIGN_GAME_1,
  MOCK_CAMPAIGN_GAME_2,
  MOCK_CAMPAIGN_GAME_3,
  MOCK_GAME,
} from "./games";

// Create individual mocks for each query
export const mockUseQueryCampaign = vi.fn();
export const mockUseQueryGame = vi.fn();
export const mockUseQueryCampaignApplications = vi.fn();
export const mockUseQueryGameApplications = vi.fn();
export const mockUseQueryUserCampaignApplication = vi.fn();
export const mockUseQueryUserGameApplication = vi.fn();
export const mockUseQueryCampaignGameSessions = vi.fn();
export const mockUseQueryGameSystem = vi.fn();

export const mockReactQuery = () => {
  vi.mock("@tanstack/react-query", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@tanstack/react-query")>();
    return {
      ...actual,
      useQuery: vi.fn((options) => {
        const defaultReturnValue = {
          data: undefined,
          isLoading: false,
          isFetching: false,
          error: null,
        };

        if (options.queryKey[0] === "campaign") {
          return mockUseQueryCampaign();
        }
        if (options.queryKey[0] === "game") {
          return mockUseQueryGame();
        }
        if (options.queryKey[0] === "gameSystem") {
          return mockUseQueryGameSystem();
        }
        if (options.queryKey[0] === "campaignApplications") {
          return mockUseQueryCampaignApplications();
        }
        if (options.queryKey[0] === "gameApplications") {
          return mockUseQueryGameApplications();
        }
        if (options.queryKey[0] === "userCampaignApplication") {
          return mockUseQueryUserCampaignApplication();
        }
        if (options.queryKey[0] === "userGameApplication") {
          return mockUseQueryUserGameApplication();
        }
        if (options.queryKey[0] === "campaignGameSessions") {
          return mockUseQueryCampaignGameSessions();
        }
        // Fallback for other queries
        return defaultReturnValue;
      }),
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isPending: false,
        isSuccess: false,
        error: null,
      })),
    };
  });
};

// Add a setup function to reset and set default mock values
export const setupReactQueryMocks = () => {
  mockUseQueryCampaign
    .mockReset()
    .mockReturnValue({ data: MOCK_CAMPAIGN, isLoading: false, error: null });
  mockUseQueryGame
    .mockReset()
    .mockReturnValue({ data: MOCK_GAME, isLoading: false, error: null });
  mockUseQueryGameSystem
    .mockReset()
    .mockReturnValue({ data: MOCK_GAME_SYSTEM, isLoading: false, error: null });
  mockUseQueryCampaignApplications.mockReset().mockReturnValue({
    data: { success: true, data: MOCK_APPLICATIONS },
    isLoading: false,
    error: null,
  });
  mockUseQueryGameApplications.mockReset().mockReturnValue({
    data: { success: true, data: [] },
    isLoading: false,
    error: null,
  });
  mockUseQueryUserCampaignApplication.mockReset().mockReturnValue({
    data: { success: true, data: null },
    isLoading: false,
    error: null,
  });
  mockUseQueryUserGameApplication.mockReset().mockReturnValue({
    data: { success: true, data: null },
    isLoading: false,
    error: null,
  });
  mockUseQueryCampaignGameSessions.mockReset().mockReturnValue({
    data: {
      success: true,
      data: [MOCK_CAMPAIGN_GAME_1, MOCK_CAMPAIGN_GAME_2, MOCK_CAMPAIGN_GAME_3],
    },
    isLoading: false,
    error: null,
  });
};
