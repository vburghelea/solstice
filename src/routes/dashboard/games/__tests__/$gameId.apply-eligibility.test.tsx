import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// We do not mock games.queries here because useQuery is globally mocked in test setup.
// Instead, override the react-query useQuery return values directly for this test case.
import { mockUseQueryGame, mockUseQueryRelationship } from "~/tests/mocks/react-query";

function setupRoute(mod: unknown, currentUserId: string, gameId = "g1", loaderData = {}) {
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

function qc() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

// Use the shared mock from test setup to avoid being reset by setupGameMocks
// Route helpers

describe("GameDetailsPage apply eligibility (connections-only)", () => {
  it("hides Apply when protected and not a connection", async () => {
    // Provide protected game data via mocked useQuery("game")
    mockUseQueryGame.mockReturnValueOnce({
      data: {
        id: "g1",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        dateTime: new Date().toISOString(),
        description: "A test game session",
        expectedDuration: 120,
        price: 0,
        language: "English",
        location: { address: "Test Location" },
        status: "scheduled",
        minimumRequirements: null,
        safetyRules: {
          basicRules: {
            noAlcohol: false,
            safeWordRequired: false,
            encourageOpenCommunication: false,
          },
          safetyTools: [{ id: "tool1", label: "Safety Tool", enabled: false }],
        },
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      isLoading: false,
      error: null,
    });
    // Relationship: not a connection
    mockUseQueryRelationship.mockReturnValueOnce({
      data: {
        success: true,
        data: { blocked: false, blockedBy: false, isConnection: false },
      },
      isLoading: false,
      error: null,
    });

    const mod = await import("../$gameId");
    setupRoute(mod, "viewer", "g1", {
      game: {
        id: "g1",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        dateTime: new Date().toISOString(),
        description: "A test game session",
        expectedDuration: 120,
        price: 0,
        language: "English",
        location: { address: "Test Location" },
        status: "scheduled",
        minimumRequirements: null,
        safetyRules: {
          basicRules: {
            noAlcohol: false,
            safeWordRequired: false,
            encourageOpenCommunication: false,
          },
          safetyTools: [{ id: "tool1", label: "Safety Tool", enabled: false }],
        },
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      error: null,
    });

    render(
      <QueryClientProvider client={qc()}>
        <mod.GameDetailsPage />
      </QueryClientProvider>,
    );

    // Wait for main section to render
    await screen.findByText(/general/i);
    // Button should not be present
    const btn = screen.queryByRole("button", { name: /apply to game/i });
    expect(btn).toBeNull();
  });

  it("shows Apply when protected and viewer is a connection", async () => {
    // Provide protected game data via mocked useQuery("game")
    mockUseQueryGame.mockReturnValueOnce({
      data: {
        id: "g2",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        dateTime: new Date().toISOString(),
        description: "A test game session",
        expectedDuration: 120,
        price: 0,
        language: "English",
        location: { address: "Test Location" },
        status: "scheduled",
        minimumRequirements: null,
        safetyRules: {
          basicRules: {
            noAlcohol: false,
            safeWordRequired: false,
            encourageOpenCommunication: false,
          },
          safetyTools: [{ id: "tool1", label: "Safety Tool", enabled: false }],
        },
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      isLoading: false,
      error: null,
    });
    // Relationship: is a connection
    mockUseQueryRelationship.mockReturnValueOnce({
      data: {
        success: true,
        data: { blocked: false, blockedBy: false, isConnection: true },
      },
      isLoading: false,
      error: null,
    });

    const mod = await import("../$gameId");
    setupRoute(mod, "viewer", "g2", {
      game: {
        id: "g2",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "Test System" },
        dateTime: new Date().toISOString(),
        description: "A test game session",
        expectedDuration: 120,
        price: 0,
        language: "English",
        location: { address: "Test Location" },
        status: "scheduled",
        minimumRequirements: null,
        safetyRules: {
          basicRules: {
            noAlcohol: false,
            safeWordRequired: false,
            encourageOpenCommunication: false,
          },
          safetyTools: [{ id: "tool1", label: "Safety Tool", enabled: false }],
        },
        visibility: "protected",
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [],
      },
      error: null,
    });

    render(
      <QueryClientProvider client={qc()}>
        <mod.GameDetailsPage />
      </QueryClientProvider>,
    );

    // Wait for main section to render
    await screen.findByText(/general/i);
    const btn = await screen.findByRole("button", { name: /apply to game/i });
    expect(btn).toBeInTheDocument();
  });
});
