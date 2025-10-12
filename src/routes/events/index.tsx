import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { DataErrorState } from "~/components/ui/data-state";
import { EventCard, EventCardSkeleton } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type {
  EventStatus,
  EventType,
  EventWithDetails,
  RegistrationType,
} from "~/features/events/events.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { getUserProfile } from "~/features/profile/profile.queries";
import { QuickFiltersBar } from "~/shared/components/quick-filters-bar";
import { useCountries } from "~/shared/hooks/useCountries";

const UPCOMING_EVENTS_LIMIT = 10;

const EVENT_TYPE_OPTIONS: Array<{ value: EventType; label: string }> = [
  { value: "tournament", label: "Tournament" },
  { value: "league", label: "League" },
  { value: "camp", label: "Camp" },
  { value: "social", label: "Social" },
  { value: "other", label: "Other" },
];

const EVENT_STATUS_OPTIONS: Array<{ value: EventStatus; label: string }> = [
  { value: "published", label: "Published" },
  { value: "registration_open", label: "Registration Open" },
  { value: "registration_closed", label: "Registration Closed" },
  { value: "in_progress", label: "In Progress" },
];

const REGISTRATION_TYPE_OPTIONS: Array<{
  value: RegistrationType;
  label: string;
}> = [
  { value: "team", label: "Team" },
  { value: "individual", label: "Individual" },
  { value: "both", label: "Team & Individual" },
];

type PlayerLocationFilters = {
  city: string | null;
  country: string | null;
};

type EventsLoaderData = {
  events: EventWithDetails[];
  playerFilters: PlayerLocationFilters | null;
};

type FiltersState = {
  country: string;
  city: string;
  type: EventType | "all";
  status: EventStatus | "all";
  registrationType: RegistrationType | "all";
};

type QuickFilterKey = "city" | "country";

interface QuickFilterDefinition {
  key: QuickFilterKey;
  label: string;
  apply: (filters: FiltersState) => FiltersState;
  clear: (filters: FiltersState) => FiltersState;
  isActive: (filters: FiltersState) => boolean;
}

const DEFAULT_FILTERS: FiltersState = {
  country: "all",
  city: "all",
  type: "all",
  status: "all",
  registrationType: "all",
};

const normalize = (value: string) => value.trim().toLowerCase();

const SKELETON_KEYS = ["north", "south", "east", "west", "central", "prairie"] as const;

export const Route = createFileRoute("/events/")({
  loader: async () => {
    const [eventsOutcome, profileOutcome] = await Promise.allSettled([
      getUpcomingEvents({
        data: { limit: UPCOMING_EVENTS_LIMIT },
      }),
      getUserProfile(),
    ]);

    let events: EventWithDetails[] = [];
    if (eventsOutcome.status === "fulfilled") {
      events = eventsOutcome.value as EventWithDetails[];
    } else {
      console.error("Failed to fetch events:", eventsOutcome.reason);
    }

    let playerFilters: PlayerLocationFilters | null = null;
    if (
      profileOutcome.status === "fulfilled" &&
      profileOutcome.value.success &&
      profileOutcome.value.data
    ) {
      const profile = profileOutcome.value.data;
      playerFilters = {
        city: profile.city ?? null,
        country: profile.country ?? null,
      };
    } else if (profileOutcome.status === "rejected") {
      console.error("Failed to fetch profile:", profileOutcome.reason);
    }

    return { events, playerFilters } satisfies EventsLoaderData;
  },
  component: EventsIndex,
});

function EventsIndex() {
  const { events: initialEvents, playerFilters } =
    Route.useLoaderData() as EventsLoaderData;
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const { getCountryName } = useCountries();

  const {
    data: events = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["upcoming-events", { limit: UPCOMING_EVENTS_LIMIT }],
    queryFn: async () =>
      (await getUpcomingEvents({
        data: { limit: UPCOMING_EVENTS_LIMIT },
      })) as EventWithDetails[],
    initialData: initialEvents,
    staleTime: 1000 * 60,
  });

  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    events.forEach((event) => {
      if (event.country) {
        map.set(event.country, getCountryName(event.country));
      }
    });
    if (playerFilters?.country) {
      map.set(playerFilters.country, getCountryName(playerFilters.country));
    }
    return Array.from(map.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));
  }, [events, playerFilters, getCountryName]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      if (event.city) {
        set.add(event.city.trim());
      }
    });
    if (playerFilters?.city) {
      set.add(playerFilters.city.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events, playerFilters]);

  const quickFilters = useMemo<QuickFilterDefinition[]>(() => {
    if (!playerFilters) {
      return [];
    }

    const definitions: QuickFilterDefinition[] = [];

    if (playerFilters.city) {
      const cityValue = playerFilters.city;
      definitions.push({
        key: "city",
        label: `In ${cityValue}`,
        apply: (current) => ({ ...current, city: cityValue }),
        clear: (current) => ({ ...current, city: "all" }),
        isActive: (current) => normalize(current.city) === normalize(cityValue),
      });
    }

    if (playerFilters.country) {
      const countryValue = playerFilters.country;
      const countryLabel = getCountryName(countryValue);
      definitions.push({
        key: "country",
        label: `In ${countryLabel}`,
        apply: (current) => ({ ...current, country: countryValue }),
        clear: (current) => ({ ...current, country: "all" }),
        isActive: (current) => current.country === countryValue,
      });
    }

    return definitions;
  }, [playerFilters, getCountryName]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.country !== "all" && event.country !== filters.country) {
        return false;
      }

      if (filters.city !== "all") {
        if (!event.city) {
          return false;
        }
        if (normalize(event.city) !== normalize(filters.city)) {
          return false;
        }
      }

      if (filters.type !== "all" && event.type !== filters.type) {
        return false;
      }

      if (filters.status !== "all" && event.status !== filters.status) {
        return false;
      }

      if (
        filters.registrationType !== "all" &&
        event.registrationType !== filters.registrationType
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  const isLoading = (isPending || isFetching) && events.length === 0;
  const quickFilterButtons = useMemo(() => {
    return quickFilters.map((filter) => ({
      id: filter.key,
      label: filter.label,
      active: filter.isActive(filters),
      onToggle: () =>
        setFilters((prev) =>
          filter.isActive(prev) ? filter.clear(prev) : filter.apply(prev),
        ),
    }));
  }, [filters, quickFilters]);

  const hasQuickFilters = quickFilterButtons.length > 0;
  const hasActiveFilters =
    filters.country !== "all" ||
    filters.city !== "all" ||
    filters.type !== "all" ||
    filters.status !== "all" ||
    filters.registrationType !== "all";

  const resetFilters = useCallback(
    () => setFilters({ ...DEFAULT_FILTERS }),
    [setFilters],
  );

  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Events"
        title="Tournaments, training camps, and community festivals"
        subtitle="Roundup Games sanctions competitions year-round so athletes at every level can compete, learn, and connect."
        backgroundImage="/images/hero-tabletop-board-game-tournament-optimized.png"
        ctaText="Register your team"
        ctaLink="/auth/signup"
        secondaryCta={{
          text: "Submit an event",
          link: "mailto:events@roundup.games",
        }}
      />

      <section className="bg-secondary py-10 sm:py-14 lg:py-16 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                  Filter upcoming events
                </p>
                <h2 className="text-foreground mt-2 text-2xl font-bold sm:text-3xl dark:text-gray-50">
                  Upcoming events calendar
                </h2>
              </div>
              {!hasQuickFilters && hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {hasQuickFilters ? (
              <QuickFiltersBar
                filters={quickFilterButtons}
                {...(hasActiveFilters ? { onClear: resetFilters } : {})}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase dark:text-gray-300">
                  Country
                </p>
                <Select
                  value={filters.country}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {countryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase dark:text-gray-300">
                  City
                </p>
                <Select
                  value={filters.city}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {cityOptions.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase dark:text-gray-300">
                  Type
                </p>
                <Select
                  value={filters.type}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      type: value as FiltersState["type"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {EVENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase dark:text-gray-300">
                  Status
                </p>
                <Select
                  value={filters.status}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: value as FiltersState["status"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {EVENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase dark:text-gray-300">
                  Registration type
                </p>
                <Select
                  value={filters.registrationType}
                  onValueChange={(value) =>
                    setFilters((prev) => ({
                      ...prev,
                      registrationType: value as FiltersState["registrationType"],
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All registration types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All registration types</SelectItem>
                    {REGISTRATION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && SKELETON_KEYS.map((key) => <EventCardSkeleton key={key} />)}
            {!isLoading && isError && filteredEvents.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <DataErrorState
                  title="Events failed to load"
                  description={error instanceof Error ? error.message : undefined}
                  onRetry={() => refetch()}
                />
              </div>
            )}
            {!isLoading && !isError && filteredEvents.length === 0 && (
              <div className="border-border bg-muted text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm sm:col-span-2 lg:col-span-3">
                No events match this filter right now. Contact us at{" "}
                <a href="mailto:events@roundup.games">events@roundup.games</a>
                and we’ll add your event to the calendar.
              </div>
            )}
            {!isLoading &&
              filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
