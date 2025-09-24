import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("~/features/campaigns/campaigns.queries", () => ({
  getCampaign: vi.fn(),
  getCampaignApplicationForUser: vi.fn(async () => ({ success: true, data: null })),
  getCampaignApplications: vi.fn(async () => ({ success: true, data: [] })),
  listGameSessionsByCampaignId: vi.fn(async () => ({ success: true, data: [] })),
}));

vi.mock("~/features/social", () => ({
  getRelationshipSnapshot: vi.fn(async () => ({
    success: true,
    data: { follows: false, followedBy: false, blocked: false, blockedBy: false },
  })),
}));

describe.skip("CampaignDetailsPage avatars", () => {
  it("shows avatars for invited users in ManageInvitations when owner", async () => {
    const cq = await import("~/features/campaigns/campaigns.queries");
    (cq.getCampaign as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: {
        id: "c1",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "System" },
        name: "Camp",
        recurrence: "weekly",
        timeOfDay: "evening",
        sessionDuration: 120,
        pricePerSession: 0,
        language: "en",
        visibility: "public",
        location: { address: "Somewhere" },
        createdAt: new Date(),
        updatedAt: new Date(),
        minimumRequirements: null,
        safetyRules: null,
        applications: [],
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
              name: "Invited Camp",
              email: "inv@example.com",
              uploadedAvatarPath: "/api/avatars/u2.webp",
              image: null,
            },
          },
        ],
      },
    });

    const mod = await import("../index");
    // Stub useSearch to avoid RouterProvider
    (mod.Route as unknown as { useSearch: () => Record<string, never> }).useSearch =
      () => ({});
    (mod.Route as unknown as { useParams: () => { campaignId: string } }).useParams =
      () => ({
        campaignId: "c1",
      });
    (
      mod.Route as unknown as { useRouteContext: () => { user: { id: string } } }
    ).useRouteContext = () => ({
      user: { id: "owner" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={qc}>
        <Component />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /invited camp/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });

  it("shows avatars in participants list when viewer is a participant", async () => {
    const cq = await import("~/features/campaigns/campaigns.queries");
    (cq.getCampaign as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      success: true,
      data: {
        id: "c1",
        owner: { id: "owner", name: "Owner", email: "o@x" },
        gameSystem: { id: 1, name: "System" },
        name: "Camp",
        recurrence: "weekly",
        timeOfDay: "evening",
        sessionDuration: 120,
        pricePerSession: 0,
        language: "en",
        visibility: "public",
        location: { address: "Somewhere" },
        createdAt: new Date(),
        updatedAt: new Date(),
        minimumRequirements: null,
        safetyRules: null,
        applications: [],
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
              name: "Camp Player",
              email: "p2@x",
              uploadedAvatarPath: "/api/avatars/u2.webp",
              image: null,
            },
          },
        ],
      },
    });

    const mod = await import("../index");
    (mod.Route as unknown as { useSearch: () => Record<string, never> }).useSearch =
      () => ({});
    (mod.Route as unknown as { useParams: () => { campaignId: string } }).useParams =
      () => ({
        campaignId: "c1",
      });
    (
      mod.Route as unknown as { useRouteContext: () => { user: { id: string } } }
    ).useRouteContext = () => ({
      user: { id: "cu" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={qc}>
        <Component />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /camp player/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });
});
