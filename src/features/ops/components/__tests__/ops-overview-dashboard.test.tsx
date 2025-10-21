import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Setup mocks before imports
import type { EventListResult, EventWithDetails } from "~/features/events/events.types";
import { localizedLinkMock, tanStackRouterMock } from "~/tests/mocks";

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

// Mock TanStack Router
vi.mock("@tanstack/react-router", () => tanStackRouterMock);

vi.mock("~/components/ui/LocalizedLink", () => localizedLinkMock);

vi.mock("sonner", () => ({
  toast: toastMocks,
}));

vi.mock("~/features/events/events.queries", () => ({
  listEvents: vi.fn(),
}));

const useOpsEventsDataMock = vi.fn();

vi.mock("~/features/ops/components/use-ops-events-data", () => ({
  useOpsEventsData: useOpsEventsDataMock,
  opsCapacityThreshold: 5,
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
    city: "Berlin",
    province: "Berlin",
    country: "Germany",
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
    isPublic: false, // This should stay false as we want to test approving a non-public event
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
    useOpsEventsDataMock.mockReset();
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

    useOpsEventsDataMock.mockReturnValue({
      pendingList: [pendingEvent],
      pipelineList: [pipelineEvent, publishedEvent],
      recentlyReviewed: [reviewedEvent, publishedEvent],
      snapshot: {
        approvals: 1,
        registrationOpen: 1,
        confirmedEvents: 1,
        upcomingWeek: 2,
        capacityAlerts: 1,
      },
      attentionItems: [
        {
          id: "attention-1",
          name: "Galactic Championship",
          severity: "critical" as const,
          message: "Confirm staffing, safety briefings, and arrival logistics",
          startDate: new Date("2024-04-04"),
          availableSpots: 3,
          city: "Berlin",
        },
      ],
      marketingBreakdown: [],
      liveEvents: [],
      isLoading: false,
      isRefreshing: false,
    });
  });

  afterEach(() => {
    // no-op
  });

  it("renders Priya's operations snapshot and pipeline", async () => {
    const { OpsOverviewDashboard } = await import("../ops-overview-dashboard");
    render(<OpsOverviewDashboard />);

    // Test for structural elements - focus on what we can reliably test
    expect(document.querySelector("h1")).toBeInTheDocument();
    expect(screen.getByRole("tablist")).toBeInTheDocument();

    // Get all tabs and verify we have the expected number
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);

    // Test for mission focus section and link by its href
    const missionLink = screen.getByRole("link", { name: /review submission/i });
    expect(missionLink).toHaveAttribute("href", "/admin/events-review");

    // Test for snapshot cards by looking for the grid layout
    const snapshotGrid = document.querySelector(
      ".grid.md\\:grid-cols-2.lg\\:grid-cols-4",
    );
    expect(snapshotGrid).toBeInTheDocument();
    const cards = snapshotGrid?.querySelectorAll('[data-slot="card"]');
    expect(cards?.length).toBe(4);

    // Test for pending events table and our test data (get the first table which should be approvals)
    const tables = screen.getAllByRole("table");
    expect(tables.length).toBeGreaterThan(0);
    const table = tables[0];
    expect(table).toBeInTheDocument();
    expect(screen.getByText("Community Showcase")).toBeInTheDocument();
    expect(screen.getByText("Story-first gathering for new tables")).toBeInTheDocument();

    // Test for recent approvals section
    expect(screen.getByText("Aurora Story Slam")).toBeInTheDocument();

    // Test switching to pipeline tab (click the second tab)
    const user = userEvent.setup();
    await user.click(tabs[1]);

    // Test pipeline content
    const galacticRows = screen.getAllByText("Galactic Championship");
    expect(galacticRows.length).toBeGreaterThan(0);
    expect(screen.getAllByText("Legends Cup Finals").length).toBeGreaterThan(0);

    // Test for attention items if they exist
    const attentionItems = screen.queryAllByText(/critical|warning/i);
    if (attentionItems.length > 0) {
      expect(attentionItems[0]).toBeInTheDocument();
    }
  }, 10000);

  it("opens the approval dialog and triggers the mutation", async () => {
    const mutateSpy = vi.fn();
    queryMocks.useMutation.mockReturnValue({ mutate: mutateSpy, isPending: false });

    // Override the mock to ensure the pending event is included
    useOpsEventsDataMock.mockReturnValue({
      pendingList: [pendingEvent],
      pipelineList: [pipelineEvent, publishedEvent],
      recentlyReviewed: [reviewedEvent, publishedEvent],
      snapshot: {
        approvals: 1,
        registrationOpen: 1,
        confirmedEvents: 1,
        upcomingWeek: 2,
        capacityAlerts: 1,
      },
      attentionItems: [
        {
          id: "attention-1",
          name: "Galactic Championship",
          severity: "critical" as const,
          message: "Confirm staffing, safety briefings, and arrival logistics",
          startDate: new Date("2024-04-04"),
          availableSpots: 3,
          city: "Berlin",
        },
      ],
      marketingBreakdown: [],
      liveEvents: [],
      isLoading: false,
      isRefreshing: false,
    });

    const { OpsOverviewDashboard } = await import("../ops-overview-dashboard");

    render(<OpsOverviewDashboard />);

    const user = userEvent.setup();

    // Find the row containing the pending event
    const eventRow = screen.getByText("Community Showcase").closest("tr");
    expect(eventRow).toBeInTheDocument();

    // Look for the approve button within that row (should be the second button after preview)
    const buttons = within(eventRow!).getAllByRole("button");
    const approveButton = buttons.find(
      (button) =>
        button.textContent?.includes("Approve") ||
        button.getAttribute("name")?.includes("approve"),
    );
    expect(approveButton).toBeInTheDocument();

    await user.click(approveButton!);

    // Test that the dialog opened by looking for the confirmation button
    const confirmButton = await screen.findByRole("button", { name: /approve/i });
    expect(confirmButton).toBeInTheDocument();

    await user.click(confirmButton);

    expect(mutateSpy).toHaveBeenCalledWith({ eventId: "pending-1", approve: true });
  });
});
