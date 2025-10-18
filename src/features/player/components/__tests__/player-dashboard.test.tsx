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
  onFeatureFlags: vi.fn((callback: () => void) => {
    // Immediately call the callback to set showSpotlight to true
    callback();
  }),
  isFeatureEnabled: vi.fn((key: string) => (key === "dashboard-new-card" ? true : false)),
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

vi.mock("~/hooks/useTypedTranslation", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  usePlayerTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let result = key; // Return the key itself - tests shouldn't depend on translation content

      // Handle parameter interpolation for test data that needs it
      if (params) {
        Object.entries(params).forEach(([param, value]) => {
          result = result.replace(`{{${param}}}`, String(value));
        });
      }

      return result;
    },
  }),
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useCommonTranslation: () => ({
    t: (key: string) => key, // Return the key itself
  }),
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
        case "player-workspace-stats":
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
        case "next-player-game":
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

  it("surfaces Leo's primary dashboard cues", async () => {
    render(<PlayerDashboard user={null} />);

    // Test for main structural elements
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

    // Test for action links by finding all links and checking their destinations
    const links = screen.getAllByRole("link");
    const profileLink = links.find((link) =>
      link.getAttribute("href")?.includes("/player/profile"),
    );
    expect(profileLink).toBeInTheDocument();

    // Test for membership status by looking for the status text
    expect(screen.getByText("dashboard.membership.status_active")).toBeInTheDocument();

    // Test for event content
    expect(screen.getByText(/Catalyst Cup/)).toBeInTheDocument();

    // Test for cards and sections
    const cards = document.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBeGreaterThan(5); // Should have multiple cards

    // Test for team content
    expect(screen.getByText("Story Seekers")).toBeInTheDocument();

    // Test for privacy settings controls by looking for checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0); // Should have some checkboxes for settings

    // Test for notification settings
    expect(
      screen.getByText("dashboard.notifications.review_reminders.label"),
    ).toBeInTheDocument();
  });
});
