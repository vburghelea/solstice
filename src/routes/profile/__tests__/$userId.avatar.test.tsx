import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
  followUser: vi.fn(async () => ({ success: true })),
  unfollowUser: vi.fn(async () => ({ success: true })),
  blockUser: vi.fn(async () => ({ success: true })),
  unblockUser: vi.fn(async () => ({ success: true })),
}));

vi.mock("~/lib/pacer", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useRateLimitedServerFn: (fn: unknown) => fn,
  useRateLimitedSearch: vi.fn(),
}));

describe("Other user's profile avatar", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("renders header avatar for other profile", async () => {
    const mod = await import("../$userId");
    const profileQueries = await import("~/features/profile/profile.queries");
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
    await waitFor(() => expect(profileQueries.getUserProfile).toHaveBeenCalled());
    qc.clear();
  });
});
