import { afterEach, describe, expect, it, vi } from "vitest";

import type { EventWithDetails } from "~/features/events/events.types";
import type { GameListItem } from "~/features/games/games.types";
import {
  buildFallbackSelection,
  CITY_PREFERENCE_STORAGE_KEY,
  cityOptionExists,
  decodeSelection,
  deriveInitialCity,
  encodeSelection,
  filterEventsBySelection,
  filterGamesBySelection,
  guessCityFromTimezone,
} from "~/features/profile/location-preferences";
import type { CountryLocationGroup } from "~/features/profile/profile.types";
import type { AuthUser } from "~/lib/auth/types";

const MOCK_GROUPS: CountryLocationGroup[] = [
  {
    country: "United States",
    totalUsers: 10,
    cities: [
      { city: "Chicago", userCount: 6 },
      { city: "New York", userCount: 4 },
    ],
  },
  {
    country: "Canada",
    totalUsers: 2,
    cities: [{ city: "Toronto", userCount: 2 }],
  },
];

const MOCK_EVENTS = [
  {
    id: "1",
    city: "Chicago",
    country: "United States",
  },
  {
    id: "2",
    city: "Toronto",
    country: "Canada",
  },
] as unknown as EventWithDetails[];

const MOCK_GAMES = [
  {
    id: "g-1",
    location: {
      address: "123 Game Ave, Chicago, IL",
    },
  },
  {
    id: "g-2",
    location: {
      address: "456 High St, Toronto, Canada",
    },
  },
] as unknown as GameListItem[];

describe("city preference helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("round-trips encoded selections", () => {
    const encoded = encodeSelection({ city: "Chicago", country: "United States" });
    expect(encoded).toBe("United%20States::Chicago");
    expect(decodeSelection(encoded)).toEqual({
      city: "Chicago",
      country: "United States",
    });
  });

  it("derives initial city from user profile", () => {
    const selection = deriveInitialCity(
      {
        id: "user-1",
        email: "maya@example.com",
        name: "Maya Explorer",
        image: null,
        profileComplete: false,
        gender: null,
        pronouns: null,
        phone: null,
        city: "New York",
        country: "United States",
        privacySettings: null,
        profileVersion: 1,
        profileUpdatedAt: null,
        roles: [],
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
        locale: "en",
        timezone: "America/New_York",
      } as unknown as AuthUser,
      MOCK_GROUPS,
    );
    expect(selection).toEqual({ city: "New York", country: "United States" });
  });

  it("falls back to the first available city when no preference exists", () => {
    const fallback = buildFallbackSelection(MOCK_GROUPS);
    expect(fallback).toEqual({ city: "Chicago", country: "United States" });
  });

  it("detects when a selection exists in the location options", () => {
    expect(cityOptionExists({ city: "Toronto", country: "Canada" }, MOCK_GROUPS)).toBe(
      true,
    );
    expect(cityOptionExists({ city: "London", country: "Canada" }, MOCK_GROUPS)).toBe(
      false,
    );
  });

  it("filters events by the active selection", () => {
    const filtered = filterEventsBySelection(MOCK_EVENTS, {
      city: "Toronto",
      country: "Canada",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("2");
  });

  it("filters games by address when a selection is active", () => {
    const filtered = filterGamesBySelection(MOCK_GAMES, {
      city: "Chicago",
      country: "United States",
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe("g-1");
  });

  it("infers a city from the current timezone", () => {
    const original = Intl.DateTimeFormat;
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ timeZone: "America/Chicago" }),
        }) as Intl.DateTimeFormat,
    );

    const inferred = guessCityFromTimezone(MOCK_GROUPS);
    expect(inferred).toEqual({ city: "Chicago", country: "United States" });

    Intl.DateTimeFormat = original;
  });

  it("exposes a shared storage key for city preferences", () => {
    expect(CITY_PREFERENCE_STORAGE_KEY).toBe("roundup:selected-city");
  });
});
