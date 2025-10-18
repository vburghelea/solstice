import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  EventOperationResult,
  EventWithDetails,
} from "~/features/events/events.types";
import { OpsEventDetail } from "~/features/ops/components/ops-event-detail";

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query",
  );
  return {
    ...actual,
    useQuery: queryMocks.useQuery,
  };
});

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to?: string }) => (
    <a href={to ?? "#"} {...props}>
      {children}
    </a>
  ),
}));

// Import real locale data
import commonTranslations from "~/lib/i18n/locales/en/common.json";
import opsTranslations from "~/lib/i18n/locales/en/ops.json";

vi.mock("~/hooks/useTypedTranslation", () => ({
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useOpsTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      // Helper function to get nested value from object using dot notation
      const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
        const keys = path.split(".");
        let current: unknown = obj;

        for (const k of keys) {
          if (
            current &&
            typeof current === "object" &&
            current !== null &&
            k in current
          ) {
            current = (current as Record<string, unknown>)[k];
          } else {
            return key; // Return key if not found
          }
        }

        return typeof current === "string" ? current : key;
      };

      // Try to get the value from the translations
      let result = getNestedValue(opsTranslations, key);

      // If not found, try the event_detail_hardcoded nested structure
      if (result === key) {
        result = getNestedValue(opsTranslations, `event_detail_hardcoded.${key}`);
      }

      // Handle interpolation for template strings
      if (options && typeof result === "string") {
        result = result.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return String(options[param] || match);
        });
      }

      return result;
    },
  }),
  // eslint-disable-next-line @eslint-react/hooks-extra/no-unnecessary-use-prefix
  useCommonTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const getNestedValue = (obj: Record<string, unknown>, path: string): string => {
        const keys = path.split(".");
        let current: unknown = obj;

        for (const k of keys) {
          if (
            current &&
            typeof current === "object" &&
            current !== null &&
            k in current
          ) {
            current = (current as Record<string, unknown>)[k];
          } else {
            return key;
          }
        }

        return typeof current === "string" ? current : key;
      };

      let result = getNestedValue(commonTranslations, key);

      // Handle interpolation for template strings
      if (options && typeof result === "string") {
        result = result.replace(/\{\{(\w+)\}\}/g, (match, param) => {
          return String(options[param] || match);
        });
      }

      return result;
    },
  }),
}));

vi.mock("~/components/ui/SafeLink", () => ({
  SafeLink: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children:
      | ReactNode
      | ((args: { isActive: boolean; isTransitioning: boolean }) => ReactNode);
  } & Omit<ComponentProps<"a">, "href">) => (
    <a href={to} {...rest}>
      {typeof children === "function"
        ? children({ isActive: false, isTransitioning: false })
        : children}
    </a>
  ),
}));

function buildEvent(overrides: Partial<EventWithDetails> = {}): EventWithDetails {
  const base: EventWithDetails = {
    id: "event-123",
    createdAt: new Date("2024-03-01T12:00:00Z"),
    updatedAt: new Date("2024-03-01T12:00:00Z"),
    name: "Galactic Invitational",
    slug: "galactic-invitational",
    description: "",
    shortDescription: "",
    type: "tournament",
    status: "registration_open",
    venueName: "Galactic Arena",
    venueAddress: null,
    city: "Vancouver",
    province: "BC",
    country: "Canada",
    postalCode: null,
    locationNotes: null,
    startDate: "2024-06-15",
    endDate: "2024-06-16",
    registrationOpensAt: new Date("2024-04-01T00:00:00Z"),
    registrationClosesAt: null,
    registrationType: "team",
    maxTeams: 32,
    maxParticipants: null,
    minPlayersPerTeam: 6,
    maxPlayersPerTeam: 12,
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
    isPublic: true,
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
    registrationCount: 24,
    isRegistrationOpen: true,
    availableSpots: 3,
  };

  return { ...base, ...overrides };
}

describe("OpsEventDetail", () => {
  const baseResult: EventOperationResult<EventWithDetails> = {
    success: true,
    data: buildEvent(),
  };

  beforeEach(() => {
    localStorage.clear();
    queryMocks.useQuery.mockReset();
  });

  it("surfaces event metadata and the generated operations task board", () => {
    queryMocks.useQuery.mockReturnValue({
      data: baseResult,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

    render(<OpsEventDetail eventId="event-123" />);

    expect(
      screen.getByRole("heading", { name: "Galactic Invitational" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Vancouver, BC")).toBeInTheDocument();
    expect(screen.getByText(/24 registered/)).toBeInTheDocument();

    const taskTable = screen.getByRole("table");
    const registrationRow = within(taskTable)
      .getByText("Monitor registration health")
      .closest("tr");
    expect(registrationRow).toBeTruthy();
    const statusBadges = within(registrationRow as HTMLElement).getAllByText(
      "Needs attention",
    );
    expect(statusBadges.length).toBeGreaterThan(0);

    expect(screen.getByText("Attention signals")).toBeInTheDocument();
    expect(screen.getByText("Operations snapshot")).toBeInTheDocument();
  });

  it("lets Priya update task status selections and persists them", async () => {
    const user = userEvent.setup();
    queryMocks.useQuery.mockReturnValue({
      data: baseResult,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

    render(<OpsEventDetail eventId="event-123" />);

    const statusControl = screen.getByLabelText(
      "Set status for Final approval & publish",
    );
    await user.click(statusControl);

    const inProgressOption = await screen.findByRole("option", { name: "In progress" });
    await user.click(inProgressOption);

    await waitFor(() => expect(statusControl).toHaveTextContent("In progress"));

    const storagePayload = localStorage.getItem("ops-task-board-event-123");
    expect(storagePayload).toBeTruthy();
    expect(storagePayload && JSON.parse(storagePayload)).toMatchObject({
      "ops-approval": { status: "in_progress" },
    });
  });

  it("lets Priya reassign owners and capture task notes", async () => {
    const user = userEvent.setup();
    queryMocks.useQuery.mockReturnValue({
      data: baseResult,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

    render(<OpsEventDetail eventId="event-123" />);

    const ownerControl = screen.getByLabelText(
      "Assign owner for Kickoff marketing campaign",
    );
    await user.click(ownerControl);

    const operationsOption = await screen.findByRole("option", { name: "Operations" });
    await user.click(operationsOption);

    await waitFor(() => expect(ownerControl).toHaveTextContent("Operations"));

    const noteTrigger = screen.getByLabelText("Add note for Kickoff marketing campaign");
    await user.click(noteTrigger);

    const noteField = await screen.findByLabelText("Notes");
    await user.clear(noteField);
    await user.type(noteField, "Coordinate with design on assets");

    const doneButton = screen.getByRole("button", { name: "Done" });
    await user.click(doneButton);

    const payload = localStorage.getItem("ops-task-board-event-123");
    expect(payload).toBeTruthy();
    expect(payload && JSON.parse(payload)).toMatchObject({
      "ops-marketing": {
        status: "in_progress",
        owner: "Operations",
        note: "Coordinate with design on assets",
      },
    });
  });

  it("filters tasks by the selected status chip", async () => {
    const user = userEvent.setup();
    queryMocks.useQuery.mockReturnValue({
      data: baseResult,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

    render(<OpsEventDetail eventId="event-123" />);

    const filterControl = screen.getByLabelText("Filter tasks by status");
    await user.click(filterControl);

    const blockedOption = await screen.findByRole("option", { name: "Needs attention" });
    await user.click(blockedOption);

    const table = screen.getByRole("table");
    await waitFor(() =>
      expect(
        within(table).queryByText("Kickoff marketing campaign"),
      ).not.toBeInTheDocument(),
    );

    expect(screen.getByText(/Showing \d+ of 7 tasks\./)).toBeInTheDocument();
    expect(within(table).getByText("Monitor registration health")).toBeInTheDocument();
  });

  it("hydrates legacy status-only task state from local storage", async () => {
    localStorage.setItem(
      "ops-task-board-event-123",
      JSON.stringify({ "ops-approval": "blocked" }),
    );

    queryMocks.useQuery.mockReturnValue({
      data: baseResult,
      isLoading: false,
      isFetching: false,
      error: undefined,
    });

    render(<OpsEventDetail eventId="event-123" />);

    await waitFor(() =>
      expect(
        screen.getByLabelText("Set status for Final approval & publish"),
      ).toHaveTextContent("Needs attention"),
    );
  });
});
