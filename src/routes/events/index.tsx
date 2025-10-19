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
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { getCurrentUserProfileSafe } from "~/features/profile/profile.safe-queries";
import { useEventsTranslation } from "~/hooks/useTypedTranslation";
import { QuickFiltersBar } from "~/shared/components/quick-filters-bar";
import { useCountries } from "~/shared/hooks/useCountries";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";

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

const EVENTS_HERO_IMAGE = createResponsiveCloudinaryImage("heroTournament", {
  transformation: {
    width: 1920,
    height: 1080,
    crop: "fill",
    gravity: "auto",
  },
  widths: [480, 768, 1024, 1440, 1920],
  sizes: "100vw",
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
  const { t } = useEventsTranslation();
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
    <VisitorShell>
      <HeroSection
        eyebrow={t("events.listing.title")}
        title={t("events.listing.subtitle")}
        subtitle={t("events.listing.description")}
        backgroundImageSet={EVENTS_HERO_IMAGE}
        ctaText={t("events.listing.register_team")}
        ctaLink="/auth/signup"
        secondaryCta={{
          text: t("events.listing.submit_event"),
          link: "mailto:events@roundup.games",
        }}
      />

      <section className="bg-secondary py-10 sm:py-14 lg:py-16 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                  {t("events.listing.filter")}
                </p>
                <h2 className="text-foreground mt-2 text-2xl font-bold sm:text-3xl dark:text-gray-50">
                  {t("events.listing.calendar_title")}
                </h2>
              </div>
              {!hasQuickFilters && hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  {t("events.listing.clear_filters")}
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
                  {t("events.listing.country")}
                </p>
                <Select
                  value={filters.country}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, country: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("events.listing.all_countries")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("events.listing.all_countries")}
                    </SelectItem>
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
                  {t("events.listing.city")}
                </p>
                <Select
                  value={filters.city}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, city: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("events.listing.all_cities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("events.listing.all_cities")}</SelectItem>
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
                  {t("events.listing.type")}
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
                    <SelectValue placeholder={t("events.listing.all_types")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("events.listing.all_types")}</SelectItem>
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
                  {t("events.listing.status")}
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
                    <SelectValue placeholder={t("events.listing.all_statuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("events.listing.all_statuses")}
                    </SelectItem>
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
                  {t("events.listing.registration_type")}
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
                    <SelectValue
                      placeholder={t("events.listing.all_registration_types")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("events.listing.all_registration_types")}
                    </SelectItem>
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
                  title={t("events.listing.load_failed")}
                  description={error instanceof Error ? error.message : undefined}
                  onRetry={() => refetch()}
                />
              </div>
            )}
            {!isLoading && !isError && filteredEvents.length === 0 && (
              <div className="border-border bg-muted text-muted-foreground rounded-2xl border border-dashed p-8 text-center text-sm sm:col-span-2 lg:col-span-3">
                {t("events.listing.no_results", { email: "events@roundup.games" })}
              </div>
            )}
            {!isLoading &&
              filteredEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
