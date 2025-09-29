import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlayerDashboard } from "../player-dashboard";

const queryMocks = vi.hoisted(() => ({
  queryMock: vi.fn(),
  mutationMock: vi.fn(),
  queryClient: {
    cancelQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: queryMocks.queryMock,
    useMutation: queryMocks.mutationMock,
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useQueryClient: () => queryMocks.queryClient,
  };
});

const posthogMocks = vi.hoisted(() => ({
  onFeatureFlags: vi.fn((callback: () => void) => callback()),
  isFeatureEnabled: vi.fn(() => true),
  capture: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  __esModule: true,
  default: {
    onFeatureFlags: posthogMocks.onFeatureFlags,
    isFeatureEnabled: posthogMocks.isFeatureEnabled,
    capture: posthogMocks.capture,
  },
}));

vi.mock("~/components/ui/SafeLink", () => ({
  SafeLink: ({ children, to, ...rest }: ComponentProps<"a"> & { to?: unknown }) => (
    <a {...rest} href={typeof to === "string" ? to : "#"}>
      {children}
    </a>
  ),
}));

describe("PlayerDashboard", () => {
  beforeEach(() => {
    const now = new Date();
    queryMocks.queryMock.mockReset();
    queryMocks.mutationMock.mockReset();
    Object.values(queryMocks.queryClient).forEach((spy) => {
      if (typeof spy === "function") {
        spy.mockReset();
      }
    });
    posthogMocks.capture.mockReset();
    queryMocks.mutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
    queryMocks.queryMock.mockImplementation(({ queryKey }) => {
      const key = Array.isArray(queryKey) ? queryKey[0] : queryKey;
      switch (key) {
        case "player-profile":
          return {
            data: {
              profileComplete: true,
              privacySettings: {
                showEmail: false,
                showPhone: false,
                showLocation: false,
                showLanguages: false,
                showGamePreferences: false,
                allowTeamInvitations: true,
                allowFollows: true,
                allowInvitesOnlyFromConnections: false,
              },
              notificationPreferences: {
                gameReminders: true,
                gameUpdates: true,
                campaignDigests: true,
                campaignUpdates: true,
                reviewReminders: true,
                socialNotifications: false,
              },
            },
          };
        case "dashboard-stats":
          return {
            data: {
              campaigns: { owned: 1, member: 2, pendingInvites: 1 },
              games: { owned: 0, member: 3, pendingInvites: 2 },
            },
          };
        case "membership-status":
          return { data: { hasMembership: true, daysRemaining: 12 } };
        case "userTeams":
          return {
            data: [
              {
                team: { id: "team-1", name: "Story Seekers" },
                membership: { role: "owner" },
                memberCount: 5,
              },
            ],
          };
        case "next-user-game":
          return {
            data: {
              success: true,
              data: {
                id: "game-1",
                name: "Stars of Eldoria",
                dateTime: now.toISOString(),
                location: { address: "Community Hall" },
              },
            },
          };
        case "upcoming-events-dashboard":
          return {
            data: [
              {
                id: "event-1",
                name: "Catalyst Cup",
                startDate: now.toISOString(),
                city: "Toronto",
                province: "ON",
                country: "Canada",
              },
            ],
          };
        case "pending-gm-reviews-count":
          return { data: 2 };
        default:
          return { data: undefined };
      }
    });
  });

  it("surfaces Leo's primary dashboard cues", () => {
    render(<PlayerDashboard user={null} />);

    expect(screen.getByText(/Welcome back, Leo/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /update profile details/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Membership/)).toBeInTheDocument();
    expect(screen.getByText(/Catalyst Cup/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Join the pilot/i })).toBeInTheDocument();
    expect(screen.getByText(/Connections radar/i)).toBeInTheDocument();
    expect(screen.getByText(/Only allow invites from connections/i)).toBeInTheDocument();
  });
});
