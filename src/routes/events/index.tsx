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
import {
  DEFAULT_EVENT_FILTERS,
  buildEventFilterContext,
  filterEventsWithContext,
  hasActiveEventFilters,
  isCityFilterActive,
  isCountryFilterActive,
  type EventFilterContext,
  type EventFiltersState,
} from "~/features/events/events-filtering";
import {
  DEFAULT_UPCOMING_EVENTS_LIMIT,
  createUpcomingEventsQueryFn,
  prefetchUpcomingEvents,
  upcomingEventsQueryKey,
} from "~/features/events/events.query-options";
import type {
  EventStatus,
  EventType,
  EventWithDetails,
  RegistrationType,
} from "~/features/events/events.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { getCurrentUserProfileSafe } from "~/features/profile/profile.safe-queries";
import { QuickFiltersBar } from "~/shared/components/quick-filters-bar";
import { useCountries } from "~/shared/hooks/useCountries";
import { getCloudinaryAssetUrl } from "~/shared/lib/cloudinary-assets";

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

const EVENTS_HERO_IMAGE = getCloudinaryAssetUrl("heroTournament", {
  width: 1920,
  height: 1080,
  crop: "fill",
  gravity: "auto",
});

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
  playerFilters: PlayerLocationFilters | null;
};

type QuickFilterKey = "city" | "country";

interface QuickFilterDefinition {
  key: QuickFilterKey;
  label: string;
  apply: (filters: EventFiltersState) => EventFiltersState;
  clear: (filters: EventFiltersState) => EventFiltersState;
  isActive: (context: EventFilterContext) => boolean;
}

const SKELETON_KEYS = ["north", "south", "east", "west", "central", "prairie"] as const;

export const Route = createFileRoute("/events/")({
  loader: async ({ context }) => {
    const [, profile] = await Promise.all([
      prefetchUpcomingEvents(context.queryClient, DEFAULT_UPCOMING_EVENTS_LIMIT),
      getCurrentUserProfileSafe(),
    ]);

    const playerFilters: PlayerLocationFilters | null = profile
      ? {
          city: profile.city ?? null,
          country: profile.country ?? null,
        }
      : null;

    return { playerFilters } satisfies EventsLoaderData;
  },
  component: EventsIndex,
});

function EventsIndex() {
  const { playerFilters } = Route.useLoaderData() as EventsLoaderData;
  const [filters, setFilters] = useState<EventFiltersState>(DEFAULT_EVENT_FILTERS);
  const { getCountryName } = useCountries();

  const {
    data: events = [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<
    EventWithDetails[],
    Error,
    EventWithDetails[],
    ReturnType<typeof upcomingEventsQueryKey>
  >({
    queryKey: upcomingEventsQueryKey(DEFAULT_UPCOMING_EVENTS_LIMIT),
    queryFn: createUpcomingEventsQueryFn(DEFAULT_UPCOMING_EVENTS_LIMIT),
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
        isActive: (context) => isCityFilterActive(context, cityValue),
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
        isActive: (context) => isCountryFilterActive(context, countryValue),
      });
    }

    return definitions;
  }, [playerFilters, getCountryName]);

  const filterContext = useMemo(() => buildEventFilterContext(filters), [filters]);

  const filteredEvents = useMemo(
    () => filterEventsWithContext(events, filterContext),
    [events, filterContext],
  );

  const isLoading = (isPending || isFetching) && events.length === 0;
  const quickFilterButtons = useMemo(() => {
    return quickFilters.map((filter) => ({
      id: filter.key,
      label: filter.label,
      active: filter.isActive(filterContext),
      onToggle: () =>
        setFilters((prev) => {
          const previousContext = buildEventFilterContext(prev);
          return filter.isActive(previousContext)
            ? filter.clear(prev)
            : filter.apply(prev);
        }),
    }));
  }, [filterContext, quickFilters]);

  const hasQuickFilters = quickFilterButtons.length > 0;
  const hasActiveFilters = hasActiveEventFilters(filterContext);

  const resetFilters = useCallback(
    () => setFilters({ ...DEFAULT_EVENT_FILTERS }),
    [setFilters],
  );

  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Events"
        title="Tournaments, training camps, and community festivals"
        subtitle="Roundup Games sanctions competitions year-round so athletes at every level can compete, learn, and connect."
        backgroundImage={EVENTS_HERO_IMAGE}
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
                      type: value as EventFiltersState["type"],
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
                      status: value as EventFiltersState["status"],
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
                      registrationType: value as EventFiltersState["registrationType"],
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
