import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("~/features/profile/profile.queries", () => ({
  getUserProfile: vi.fn(async ({ data }: { data?: { userId?: string } }) => ({
    success: true,
    data: {
      id: data?.userId ?? "u2",
      name: "Other User",
      email: "other@example.com",
      image: null,
      uploadedAvatarPath: "/api/avatars/u2.webp",
      profileComplete: true,
      languages: [],
      identityTags: [],
      preferredGameThemes: [],
      isGM: false,
      gamesHosted: 0,
      responseRate: 0,
      profileVersion: 1,
    },
  })),
}));

vi.mock("~/features/teams/teams.queries", () => ({
  areTeammatesWithCurrentUser: vi.fn(async () => ({ areTeammates: true })),
}));

vi.mock("~/features/social", () => ({
  getRelationshipSnapshot: vi.fn(async () => ({
    success: true,
    data: { follows: false, followedBy: false, blocked: false, blockedBy: false },
  })),
}));

describe.skip("Other user's profile avatar", () => {
  it("renders header avatar for other profile", async () => {
    const mod = await import("../$userId");
    (mod.Route as unknown as { useLoaderData: () => { userId: string } }).useLoaderData =
      () => ({
        userId: "u2",
      });
    (
      mod.Route as unknown as { useRouteContext: () => { user: { id: string } } }
    ).useRouteContext = () => ({
      user: { id: "viewer" },
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const Component = mod.Route.options.component!;
    render(
      <QueryClientProvider client={qc}>
        <Component />
      </QueryClientProvider>,
    );

    const img = await screen.findByRole("img", { name: /other user/i });
    expect(img).toHaveAttribute("src", "/api/avatars/u2.webp");
  });
});
