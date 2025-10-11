import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { mockUseQueryGame } from "~/tests/mocks/react-query";

vi.mock("~/features/games/games.queries", () => ({
  getGame: vi.fn(),
  getGameApplicationForUser: vi.fn(async () => ({ success: true, data: null })),
  getGameApplications: vi.fn(async () => ({ success: true, data: [] })),
}));

vi.mock("~/features/social", () => ({
  getRelationshipSnapshot: vi.fn(async () => ({
    success: true,
    data: { follows: false, followedBy: false, blocked: false, blockedBy: false },
  })),
}));

function setupRoute(
  mod: unknown,
  currentUserId: string,
  gameId: string,
  loaderData: unknown,
) {
  const m = mod as { Route: unknown };
  (m.Route as unknown as { useParams: () => { gameId: string } }).useParams = () => ({
    gameId,
  });
  (
    m.Route as unknown as { useRouteContext: () => { user: { id: string } | null } }
  ).useRouteContext = () => ({
    user: { id: currentUserId },
  });
  (m.Route as unknown as { useLoaderData: () => unknown }).useLoaderData = () =>
    loaderData;
}

function createClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

describe("GameDetailsPage avatars", () => {
  it("shows avatars for invited users in ManageInvitations when owner", async () => {
    const gameData = {
      id: "g1",
      owner: { id: "owner", name: "Owner", email: "o@x" },
      gameSystem: { id: 1, name: "System" },
      dateTime: new Date().toISOString(),
      description: "",
      expectedDuration: 60,
      price: 0,
      language: "en",
      location: { address: "Somewhere" },
      status: "scheduled",
      minimumRequirements: null,
      safetyRules: null,
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [
        {
          id: "p2",
          userId: "u2",
          role: "invited",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "u2",
            name: "Invitee",
            email: "inv@example.com",
            uploadedAvatarPath: "/api/avatars/u2.webp",
            image: null,
          },
        },
      ],
    };

    mockUseQueryGame.mockReturnValue({
      data: gameData,
      isLoading: false,
      error: null,
    });

    const mod = await import("../$gameId");
    setupRoute(mod, "owner", "g1", { game: gameData, error: null });

    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={createClient()}>
        <Component />
      </QueryClientProvider>,
    );

    await screen.findByText(/Manage Invitations/i);
    const img = await screen.findByRole("img", { name: /invitee/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });

  it("shows avatars in participants list when viewer is a participant", async () => {
    const gameData = {
      id: "g1",
      owner: { id: "owner", name: "Owner", email: "o@x" },
      gameSystem: { id: 1, name: "System" },
      dateTime: new Date().toISOString(),
      description: "",
      expectedDuration: 60,
      price: 0,
      language: "en",
      location: { address: "Somewhere" },
      status: "scheduled",
      minimumRequirements: null,
      safetyRules: null,
      visibility: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      participants: [
        {
          id: "p1",
          userId: "cu",
          role: "player",
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: "cu", name: "Current", email: "cu@x" },
        },
        {
          id: "p2",
          userId: "u2",
          role: "player",
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: "u2",
            name: "Player Two",
            email: "p2@x",
            uploadedAvatarPath: "/api/avatars/u2.webp",
            image: null,
          },
        },
      ],
    };

    mockUseQueryGame.mockReturnValue({
      data: gameData,
      isLoading: false,
      error: null,
    });

    const mod = await import("../$gameId");
    setupRoute(mod, "cu", "g1", { game: gameData, error: null });

    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={createClient()}>
        <Component />
      </QueryClientProvider>,
    );

    await screen.findByText(/Participants/i);
    const img = await screen.findByRole("img", { name: /player two/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });
});
