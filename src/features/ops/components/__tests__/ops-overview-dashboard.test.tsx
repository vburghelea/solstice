import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventListResult, EventWithDetails } from "~/features/events/events.types";

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn(),
  },
}));

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: queryMocks.useQuery,
    useMutation: queryMocks.useMutation,
    // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
    useQueryClient: () => queryMocks.queryClient,
  };
});

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...rest }: ComponentProps<"a"> & { to?: string }) => (
    <a {...rest} href={to ?? "#"}>
      {children}
    </a>
  ),
}));

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

const pageInfo: EventListResult["pageInfo"] = {
  currentPage: 1,
  pageSize: 50,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

function buildEvent(overrides: Partial<EventWithDetails> = {}): EventWithDetails {
  const base: EventWithDetails = {
    id: "event-1",
    createdAt: new Date("2024-03-01T12:00:00Z"),
    updatedAt: new Date("2024-03-01T12:00:00Z"),
    name: "Sample Event",
    slug: "sample-event",
    description: "",
    shortDescription: "",
    type: "tournament",
    status: "draft",
    venueName: null,
    venueAddress: null,
    city: "Toronto",
    province: "ON",
    country: "Canada",
    postalCode: null,
    locationNotes: null,
    startDate: "2024-04-20",
    endDate: "2024-04-21",
    registrationOpensAt: null,
    registrationClosesAt: null,
    registrationType: "team",
    maxTeams: 16,
    maxParticipants: null,
    minPlayersPerTeam: 7,
    maxPlayersPerTeam: 16,
    teamRegistrationFee: 0,
    individualRegistrationFee: 0,
    earlyBirdDiscount: 0,
    earlyBirdDeadline: null,
    organizerId: "org-1",
    contactEmail: "ops@example.com",
    contactPhone: null,
    rules: {},
    schedule: {},
    divisions: {},
    amenities: {},
    requirements: {},
    logoUrl: null,
    bannerUrl: null,
    isPublic: false,
    isFeatured: false,
    metadata: {},
    allowEtransfer: false,
    etransferInstructions: null,
    etransferRecipient: null,
    organizer: {
      id: "org-1",
      name: "Priya Patel",
      email: "priya@example.com",
    },
    registrationCount: 0,
    isRegistrationOpen: false,
    availableSpots: 12,
  };

  return { ...base, ...overrides };
}

describe("OpsOverviewDashboard", () => {
  const pendingEvent = buildEvent({
    id: "pending-1",
    name: "Community Showcase",
    slug: "community-showcase",
    shortDescription: "Story-first gathering for new tables",
    status: "draft",
    isPublic: false,
    createdAt: new Date("2024-03-28T12:00:00Z"),
    startDate: "2024-04-18",
  });

  const pipelineEvent = buildEvent({
    id: "pipeline-1",
    name: "Galactic Championship",
    slug: "galactic-championship",
    status: "registration_open",
    isPublic: true,
    isRegistrationOpen: true,
    registrationCount: 45,
    availableSpots: 3,
    startDate: "2024-04-04",
  });

  const publishedEvent = buildEvent({
    id: "pipeline-2",
    name: "Legends Cup Finals",
    slug: "legends-cup-finals",
    status: "published",
    isPublic: true,
    registrationCount: 28,
    availableSpots: undefined,
    startDate: "2024-04-22",
  });

  const reviewedEvent = buildEvent({
    id: "reviewed-1",
    name: "Aurora Story Slam",
    slug: "aurora-story-slam",
    status: "published",
    isPublic: true,
    updatedAt: new Date("2024-03-30T12:00:00Z"),
  });

  beforeEach(() => {
    queryMocks.useQuery.mockReset();
    queryMocks.useMutation.mockReset();
    toastMocks.success.mockReset();
    toastMocks.error.mockReset();
    Object.values(queryMocks.queryClient).forEach((spy) => {
      if (typeof spy === "function") {
        spy.mockReset();
      }
    });

    queryMocks.useQuery.mockImplementation(({ queryKey }) => {
      const key = Array.isArray(queryKey) ? queryKey[2] : queryKey;
      if (key === "pending") {
        return {
          data: {
            events: [pendingEvent],
            totalCount: 1,
            pageInfo,
          },
          isLoading: false,
          isFetching: false,
        };
      }

      if (key === "pipeline") {
        return {
          data: {
            events: [pipelineEvent, publishedEvent],
            totalCount: 2,
            pageInfo,
          },
          isLoading: false,
          isFetching: false,
        };
      }

      if (key === "recent") {
        return {
          data: {
            events: [reviewedEvent, publishedEvent],
            totalCount: 2,
            pageInfo,
          },
          isLoading: false,
          isFetching: false,
        };
      }

      return { data: undefined, isLoading: false, isFetching: false };
    });

    queryMocks.useMutation.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  afterEach(() => {
    // no-op
  });

  it("renders Priya's operations snapshot and pipeline", async () => {
    const { OpsOverviewDashboard } = await import("../ops-overview-dashboard");
    render(<OpsOverviewDashboard />);

    expect(screen.getByText("Event operations mission control")).toBeInTheDocument();
    expect(screen.getByText("Approve the next submission")).toBeInTheDocument();
    const missionLink = screen.getByRole("link", { name: "Review submission" });
    expect(missionLink).toHaveAttribute("href", "/dashboard/admin/events-review");
    expect(screen.getByText("Awaiting review")).toBeInTheDocument();

    expect(screen.getByText("Community Showcase")).toBeInTheDocument();
    expect(screen.getByText("Story-first gathering for new tables")).toBeInTheDocument();

    expect(screen.getByText("Recent approvals")).toBeInTheDocument();
    expect(screen.getByText("Aurora Story Slam")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("tab", { name: /Pipeline health/i }));
    const galacticRows = await screen.findAllByText("Galactic Championship");
    expect(galacticRows.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Legends Cup Finals").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Confirm staffing, safety briefings, and arrival logistics")
        .length,
    ).toBeGreaterThan(0);
  }, 10000);

  it("opens the approval dialog and triggers the mutation", async () => {
    const mutateSpy = vi.fn();
    queryMocks.useMutation.mockReturnValue({ mutate: mutateSpy, isPending: false });
    const { OpsOverviewDashboard } = await import("../ops-overview-dashboard");

    render(<OpsOverviewDashboard />);

    const user = userEvent.setup();
    const row = screen.getByText("Community Showcase").closest("tr");
    expect(row).not.toBeNull();
    if (!row) {
      throw new Error("Missing pending event row");
    }

    await user.click(within(row).getByRole("button", { name: /Approve/i }));
    const confirmButton = await screen.findByRole("button", { name: "Approve" });
    await user.click(confirmButton);

    expect(mutateSpy).toHaveBeenCalledWith({ eventId: "pending-1", approve: true });
  });
});
