import { vi } from "vitest";
import { MOCK_CAMPAIGN } from "./campaigns";
import { MOCK_GAME } from "./games";
import { MOCK_OWNER_USER } from "./users";

export const mockReactRouter = () => {
  vi.mock("@tanstack/react-router", async () => {
    const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
      "@tanstack/react-router",
    );
    return {
      ...actual,
      useLoaderData: vi.fn(() => ({ game: MOCK_GAME, campaign: MOCK_CAMPAIGN })),
      useParams: vi.fn(() => ({ gameId: MOCK_GAME.id, campaignId: MOCK_CAMPAIGN.id })),
      useRouteContext: vi.fn(() => ({ user: MOCK_OWNER_USER })),
      useNavigate: vi.fn(() => vi.fn()),
      useSearch: vi.fn(() => ({ status: "scheduled" })),
    };
  });
};
