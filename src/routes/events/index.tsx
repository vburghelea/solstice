import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import type { EventWithDetails } from "~/features/events/events.types";
import { PublicLayout } from "~/features/layouts/public-layout";

const UPCOMING_EVENTS_LIMIT = 10;

export const Route = createFileRoute("/events/")({
  loader: async () => {
    const events = (await getUpcomingEvents({
      data: { limit: UPCOMING_EVENTS_LIMIT },
    })) as EventWithDetails[];
    return { events };
  },
  component: EventsIndex,
});

function EventsIndex() {
  const { events: initialEvents } = Route.useLoaderData() as {
    events: EventWithDetails[];
  };
  const [countryFilter, setCountryFilter] = useState<string>("all");

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

  const countries = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => {
      if (event.country) {
        set.add(event.country);
      }
    });
    return Array.from(set).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (countryFilter === "all") {
      return events;
    }
    return events.filter(
      (event) => (event.country || "").toLowerCase() === countryFilter,
    );
  }, [events, countryFilter]);

  const isLoading = (isPending || isFetching) && events.length === 0;
  const skeletonKeys = ["north", "south", "east", "west", "central", "prairie"];

  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Events"
        title="Tournaments, training camps, and community festivals"
        subtitle="Roundup Games sanctions competitions year-round so athletes at every level can compete, learn, and connect."
        backgroundImage="https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=2000&q=80"
        ctaText="Register your team"
        ctaLink="/auth/signup"
        secondaryCta={{
          text: "Submit an event",
          link: "mailto:events@roundup.games",
        }}
      />

      <section className="bg-background py-10 sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                Filter by location
              </p>
              <h2 className="text-foreground mt-2 text-2xl font-bold sm:text-3xl">
                Upcoming events calendar
              </h2>
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country.toLowerCase()}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading && skeletonKeys.map((key) => <EventCardSkeleton key={key} />)}
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
                No events match this filter right now. Submit your club details to
                events@roundup.games and we’ll add your tournament to the national
                calendar.
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
