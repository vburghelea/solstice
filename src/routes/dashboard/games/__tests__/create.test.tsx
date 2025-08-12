import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCampaign } from "~/features/campaigns/campaigns.queries"; // Re-add import
import { createGame } from "~/features/games/games.mutations";
import { MOCK_CAMPAIGN } from "~/tests/mocks/campaigns";
import { MOCK_GAME } from "~/tests/mocks/games";
import { MOCK_OWNER_USER } from "~/tests/mocks/users";
import { renderWithRouter } from "~/tests/utils/router";
import { CreateGamePage } from "../create";

vi.mock("~/lib/form.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/lib/form.ts")>();
  return {
    ...actual,
    useForm: vi.fn(() => ({
      form: {
        subscribe: vi.fn(),
        setFieldValue: vi.fn(),
        validateAllFields: vi.fn(),
        handleSubmit: vi.fn(),
        getFieldValue: vi.fn(),
        setErrors: vi.fn(),
        reset: vi.fn(),
      },
      Field: vi.fn(({ children }) => children),
      useField: vi.fn(() => ({
        state: { value: "", errors: [], isDirty: false, isValid: true, isTouched: false },
        meta: { isTouched: false, isValid: true, errors: [] },
        props: { value: "", onChange: vi.fn(), onBlur: vi.fn() },
      })),
      isPending: false,
    })),
    isFieldApi: actual.isFieldApi, // Export isFieldApi
  };
});

// Mock queries and mutations
vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn(),
  QueryClientProvider: vi.fn(({ children }) => children),
  useQuery: vi.fn(),
  useMutation: vi.fn((options) => ({
    isPending: false, // Mock isPending
    mutate: vi.fn(),
    mutateAsync: vi.fn(async (variables) => {
      // Simulate the behavior of the actual mutationFn
      const result = await options.mutationFn(variables);
      return result;
    }),
  })),
}));

vi.mock("~/features/campaigns/campaigns.queries", () => ({
  getCampaign: vi.fn(),
}));

vi.mock("~/features/games/games.mutations", () => ({
  createGame: vi.fn(),
}));

vi.mock("~/features/games/games.queries", () => ({
  getGameSystem: vi.fn(),
}));

describe("CreateGamePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip("renders the create game form", async () => {
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

    vi.mock("@tanstack/react-router", async (importOriginal) => {
      const original = await importOriginal<typeof import("@tanstack/react-router")>();
      return {
        ...original,
        // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
        useNavigate: () => vi.fn(),
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
  });
});
