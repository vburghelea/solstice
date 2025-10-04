import type { EventWithDetails } from "~/features/events/events.types";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import type { GameListItem } from "~/features/games/games.types";
import type { CountryLocationGroup } from "~/features/profile/profile.types";
import type { AuthUser } from "~/lib/auth/types";

export const CITY_PREFERENCE_STORAGE_KEY = "roundup:selected-city";

export type CitySelection = {
  city: string;
  country: string;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function encodeSelection(selection: CitySelection): string {
  return `${encodeURIComponent(selection.country)}::${encodeURIComponent(selection.city)}`;
}

export function decodeSelection(value: string): CitySelection | null {
  if (!value) {
    return null;
  }

  const [country, city] = value.split("::");
  if (!country || !city) {
    return null;
  }

  try {
    return {
      country: decodeURIComponent(country),
      city: decodeURIComponent(city),
    };
  } catch {
    return null;
  }
}

export function deriveInitialCity(
  user: AuthUser,
  groups: CountryLocationGroup[],
): CitySelection | null {
  if (user?.city && user.country) {
    const normalizedCity = normalizeText(user.city);
    const normalizedCountry = normalizeText(user.country);

    for (const group of groups) {
      if (normalizeText(group.country) !== normalizedCountry) {
        continue;
      }

      const match = group.cities.find(
        (city) => normalizeText(city.city) === normalizedCity,
      );

      if (match) {
        return { city: match.city, country: group.country };
      }
    }

    return { city: user.city, country: user.country };
  }

  return null;
}

export function buildFallbackSelection(
  groups: CountryLocationGroup[],
): CitySelection | null {
  for (const group of groups) {
    const firstCity = group.cities[0];
    if (firstCity) {
      return { city: firstCity.city, country: group.country };
    }
  }

  return null;
}

export function guessCityFromTimezone(
  groups: CountryLocationGroup[],
): CitySelection | null {
  if (typeof Intl === "undefined" || groups.length === 0) {
    return null;
  }

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timezone) {
      return null;
    }

    const [, rawCity] = timezone.split("/");
    if (!rawCity) {
      return null;
    }

    const candidate = normalizeText(rawCity.replace(/_/g, " "));

    for (const group of groups) {
      const normalizedCountry = normalizeText(group.country);
      if (
        normalizedCountry.includes(candidate) ||
        candidate.includes(normalizedCountry)
      ) {
        const fallbackCity = group.cities[0];
        if (fallbackCity) {
          return { city: fallbackCity.city, country: group.country };
        }
      }

      for (const city of group.cities) {
        const normalizedCity = normalizeText(city.city);
        if (normalizedCity.includes(candidate) || candidate.includes(normalizedCity)) {
          return { city: city.city, country: group.country };
        }
      }
    }
  } catch (error) {
    console.warn("Unable to infer city from timezone:", error);
  }

  return null;
}

export function cityOptionExists(
  selection: CitySelection | null,
  groups: CountryLocationGroup[],
): boolean {
  if (!selection) {
    return false;
  }

  const normalizedCity = normalizeText(selection.city);
  const normalizedCountry = normalizeText(selection.country);

  return groups.some((group) => {
    if (normalizeText(group.country) !== normalizedCountry) {
      return false;
    }

    return group.cities.some((city) => normalizeText(city.city) === normalizedCity);
  });
}

export function filterGamesBySelection(
  games: GameListItem[],
  selection: CitySelection | null,
): GameListItem[] {
  if (games.length === 0) {
    return [];
  }

  if (!selection) {
    return games.slice(0, 3);
  }

  const normalizedCity = normalizeText(selection.city);
  const normalizedCountry = normalizeText(selection.country);

  const matches = games.filter((game) => {
    const address = game.location?.address ?? "";
    const normalizedAddress = normalizeText(address);
    return (
      normalizedAddress.includes(normalizedCity) ||
      normalizedAddress.includes(normalizedCountry)
    );
  });

  return matches.slice(0, 3);
}

export function filterEventsBySelection(
  events: EventWithDetails[],
  selection: CitySelection | null,
): EventWithDetails[] {
  if (events.length === 0) {
    return [];
  }

  if (!selection) {
    return events.slice(0, 3);
  }

  const normalizedCity = normalizeText(selection.city);
  const normalizedCountry = normalizeText(selection.country);

  const matches = events.filter((event) => {
    const eventCity = event.city ? normalizeText(event.city) : "";
    const eventCountry = event.country ? normalizeText(event.country) : "";

    return (
      (eventCity &&
        (eventCity.includes(normalizedCity) || normalizedCity.includes(eventCity))) ||
      (eventCountry &&
        (eventCountry.includes(normalizedCountry) ||
          normalizedCountry.includes(eventCountry)))
    );
  });

  return matches.slice(0, 3);
}

export function deriveSystemHighlights(
  systems: PopularGameSystem[],
): PopularGameSystem[] {
  return systems.slice(0, 12);
}
