import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVENT_FILTERS,
  buildEventFilterContext,
  filterEventsWithContext,
  hasActiveEventFilters,
  isCityFilterActive,
  isCountryFilterActive,
  type EventFiltersState,
} from "~/features/events/events-filtering";
import type { EventWithDetails } from "~/features/events/events.types";

function createEvent(overrides: Partial<EventWithDetails> = {}): EventWithDetails {
  const base: EventWithDetails = {
    id: "event-1",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-01T00:00:00Z"),
    name: "Founders Cup",
    slug: "founders-cup",
    description: null,
    shortDescription: null,
    type: "tournament",
    status: "published",
    venueName: null,
    venueAddress: null,
    city: null,
    province: null,
    country: null,
    postalCode: null,
    locationNotes: null,
    startDate: "2024-03-01",
    endDate: "2024-03-03",
    registrationOpensAt: null,
    registrationClosesAt: null,
    registrationType: "team",
    maxTeams: null,
    maxParticipants: null,
    minPlayersPerTeam: 7,
    maxPlayersPerTeam: 21,
    teamRegistrationFee: 0,
    individualRegistrationFee: 0,
    earlyBirdDiscount: 0,
    earlyBirdDeadline: null,
    organizerId: "org-1",
    contactEmail: null,
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
    registrationCount: 0,
    isRegistrationOpen: true,
    availableSpots: undefined,
  };

  return { ...base, ...overrides };
}

describe("events filtering helpers", () => {
  it("builds an empty context when filters are default", () => {
    const context = buildEventFilterContext(DEFAULT_EVENT_FILTERS);
    expect(context).toEqual({});
    expect(hasActiveEventFilters(context)).toBe(false);
  });

  it("builds a context with active filters", () => {
    const filters: EventFiltersState = {
      ...DEFAULT_EVENT_FILTERS,
      country: "DEU",
      city: "Berlin",
      type: "league",
      status: "registration_open",
      registrationType: "individual",
    };

    const context = buildEventFilterContext(filters);

    expect(context).toMatchObject({
      country: "DEU",
      normalizedCity: "berlin",
      type: "league",
      status: "registration_open",
      registrationType: "individual",
    });
    expect(hasActiveEventFilters(context)).toBe(true);
  });

  it("returns the original array when no filters are active", () => {
    const events = [createEvent({ id: "a" }), createEvent({ id: "b" })];
    const context = buildEventFilterContext(DEFAULT_EVENT_FILTERS);

    const result = filterEventsWithContext(events, context);

    expect(result).toBe(events);
  });

  it("filters events by country, city, type, status, and registration type", () => {
    const events = [
      createEvent({
        id: "city-match",
        country: "DEU",
        city: "Berlin",
        type: "league",
        status: "registration_open",
        registrationType: "individual",
      }),
      createEvent({
        id: "country-only",
        country: "DEU",
        city: "München",
        type: "tournament",
        status: "published",
        registrationType: "team",
      }),
      createEvent({
        id: "different-country",
        country: "USA",
        city: "Buffalo",
      }),
    ];

    const filters: EventFiltersState = {
      ...DEFAULT_EVENT_FILTERS,
      country: "DEU",
      city: " Berlin",
      type: "league",
      status: "registration_open",
      registrationType: "individual",
    };

    const context = buildEventFilterContext(filters);
    const result = filterEventsWithContext(events, context);

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("city-match");
  });

  it("determines when quick filters are active", () => {
    const filters: EventFiltersState = {
      ...DEFAULT_EVENT_FILTERS,
      country: "DEU",
      city: "Berlin",
    };

    const context = buildEventFilterContext(filters);

    expect(isCountryFilterActive(context, "DEU")).toBe(true);
    expect(isCountryFilterActive(context, "USA")).toBe(false);
    expect(isCityFilterActive(context, "Berlin")).toBe(true);
    expect(isCityFilterActive(context, "München")).toBe(false);
  });
});
