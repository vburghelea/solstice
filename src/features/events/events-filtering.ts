import type {
  EventStatus,
  EventType,
  EventWithDetails,
  RegistrationType,
} from "~/features/events/events.types";
import { normalizeText } from "~/shared/lib/utils";

export type EventFiltersState = {
  country: string;
  city: string;
  type: EventType | "all";
  status: EventStatus | "all";
  registrationType: RegistrationType | "all";
};

export const DEFAULT_EVENT_FILTERS: EventFiltersState = {
  country: "all",
  city: "all",
  type: "all",
  status: "all",
  registrationType: "all",
};

export interface EventFilterContext {
  country?: string;
  normalizedCity?: string;
  type?: EventType;
  status?: EventStatus;
  registrationType?: RegistrationType;
}

export function buildEventFilterContext(filters: EventFiltersState): EventFilterContext {
  const context: EventFilterContext = {};

  if (filters.country !== "all") {
    context.country = filters.country;
  }

  if (filters.city !== "all" && filters.city.trim().length > 0) {
    context.normalizedCity = normalizeText(filters.city);
  }

  if (filters.type !== "all") {
    context.type = filters.type;
  }

  if (filters.status !== "all") {
    context.status = filters.status;
  }

  if (filters.registrationType !== "all") {
    context.registrationType = filters.registrationType;
  }

  return context;
}

export function hasActiveEventFilters(context: EventFilterContext): boolean {
  return (
    context.country !== undefined ||
    context.normalizedCity !== undefined ||
    context.type !== undefined ||
    context.status !== undefined ||
    context.registrationType !== undefined
  );
}

export function filterEventsWithContext(
  events: EventWithDetails[],
  context: EventFilterContext,
): EventWithDetails[] {
  if (!hasActiveEventFilters(context)) {
    return events;
  }

  return events.filter((event) => {
    if (context.country && event.country !== context.country) {
      return false;
    }

    if (context.normalizedCity) {
      if (!event.city) {
        return false;
      }

      const normalizedEventCity = normalizeText(event.city);
      if (normalizedEventCity !== context.normalizedCity) {
        return false;
      }
    }

    if (context.type && event.type !== context.type) {
      return false;
    }

    if (context.status && event.status !== context.status) {
      return false;
    }

    if (context.registrationType && event.registrationType !== context.registrationType) {
      return false;
    }

    return true;
  });
}

export function isCityFilterActive(context: EventFilterContext, city: string): boolean {
  if (!context.normalizedCity || !city.trim()) {
    return false;
  }

  return normalizeText(city) === context.normalizedCity;
}

export function isCountryFilterActive(
  context: EventFilterContext,
  country: string,
): boolean {
  if (!context.country) {
    return false;
  }

  return context.country === country;
}
