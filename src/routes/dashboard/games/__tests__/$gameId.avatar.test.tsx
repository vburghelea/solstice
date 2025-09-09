import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

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

describe.skip("GameDetailsPage avatars", () => {
  it("shows avatars for invited users in ManageInvitations when owner", async () => {
    const gamesQueries = await import("~/features/games/games.queries");
    (gamesQueries.getGame as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: {
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
      },
    });

    const mod = await import("../$gameId");
    // Patch route context/params
    (mod.Route as unknown as { useParams: () => { gameId: string } }).useParams = () => ({
      gameId: "g1",
    });
    (
      mod.Route as unknown as { useRouteContext: () => { user: { id: string } } }
    ).useRouteContext = () => ({
      user: { id: "owner" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <mod.GameDetailsPage />
      </QueryClientProvider>,
    );

    // Avatar for the invited user should be present
    const img = await screen.findByRole("img", { name: /invitee/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });

  it("shows avatars in participants list when viewer is a participant", async () => {
    const gamesQueries = await import("~/features/games/games.queries");
    (gamesQueries.getGame as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: {
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
      },
    });

    const mod = await import("../$gameId");
    (mod.Route as unknown as { useParams: () => { gameId: string } }).useParams = () => ({
      gameId: "g1",
    });
    (
      mod.Route as unknown as { useRouteContext: () => { user: { id: string } } }
    ).useRouteContext = () => ({
      user: { id: "cu" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <mod.GameDetailsPage />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /player two/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });
});
