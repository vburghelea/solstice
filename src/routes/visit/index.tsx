import { createFileRoute, Link } from "@tanstack/react-router";
import { startTransition, useEffect, useMemo, useState } from "react";

import { buttonVariants } from "~/components/ui/button";
import { EventCard } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { listPopularSystems } from "~/features/game-systems/game-systems.queries";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import { GameShowcaseCard } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import {
  buildFallbackSelection,
  CITY_PREFERENCE_STORAGE_KEY,
  cityOptionExists,
  CitySelection,
  decodeSelection,
  deriveInitialCity,
  deriveSystemHighlights,
  encodeSelection,
  filterEventsBySelection,
  filterGamesBySelection,
  guessCityFromTimezone,
} from "~/features/profile/location-preferences";
import { listUserLocations } from "~/features/profile/profile.queries";
import type { CountryLocationGroup } from "~/features/profile/profile.types";
import type { AuthUser } from "~/lib/auth/types";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

type VisitorLoaderData = {
  featuredGames: GameListItem[];
  popularSystems: PopularGameSystem[];
  upcomingEvents: EventWithDetails[];
  locationGroups: CountryLocationGroup[];
};

export const Route = createFileRoute("/visit/")({
  loader: async (): Promise<VisitorLoaderData> => {
    const [
      gamesResult,
      popularSystemsResult,
      upcomingEventsResult,
      locationGroupsResult,
    ] = await Promise.all([
      listGames({ data: { filters: { visibility: "public", status: "scheduled" } } }),
      listPopularSystems().catch((error) => {
        console.error("Failed to fetch popular systems:", error);
        return [] as PopularGameSystem[];
      }),
      getUpcomingEvents({ data: { limit: 24 } }).catch((error) => {
        console.error("Failed to fetch upcoming events:", error);
        return [] as EventWithDetails[];
      }),
      listUserLocations({ data: { limitPerCountry: 8 } }).catch((error) => {
        console.error("Failed to fetch location options:", error);
        return [] as CountryLocationGroup[];
      }),
    ]);

    if (!gamesResult.success) {
      console.error("Failed to fetch featured games:", gamesResult.errors);
    }

    return {
      featuredGames: gamesResult.success ? gamesResult.data.slice(0, 6) : [],
      popularSystems: popularSystemsResult,
      upcomingEvents: upcomingEventsResult,
      locationGroups: locationGroupsResult,
    };
  },
  component: VisitorExperience,
});
const DISCOVERY_THEMES = [
  {
    title: "Curated spotlights",
    description:
      "Hand-picked sessions and stories make it easy to feel the Roundup vibe before you ever sit down at the table.",
  },
  {
    title: "Effortless planning",
    description:
      "Choose a city, explore open seats, and mark events you love without committing before you're ready.",
  },
  {
    title: "Trust-first design",
    description:
      "Safety practices, accessibility callouts, and facilitator intros appear upfront so explorers can make confident choices.",
  },
];

const STORY_CHAPTERS = [
  "Preview gatherings and festivals curated for curious first-timers.",
  "Explore systems and campaigns that prioritize onboarding and safety tools.",
  "Save a home base city to receive updates when seats open up.",
];

const TRUST_PROMISES = [
  {
    title: "Safety tools on display",
    description:
      "Hosts showcase Lines & Veils, X-Cards, and debrief rituals so everyone knows how care shows up at the table.",
  },
  {
    title: "Meet the facilitator",
    description:
      "GM bios highlight pronouns, session pacing, and welcome rituals to help you read the room before you arrive.",
  },
  {
    title: "Spaces that feel welcoming",
    description:
      "Each venue callout includes mobility notes, transit tips, and community vibes, helping visitors picture the experience.",
  },
];

const SECTION_SURFACE =
  "rounded-3xl bg-secondary shadow-sm ring-1 ring-inset ring-[color:color-mix(in_oklab,var(--primary-soft)_18%,transparent)]";

function VisitorExperience() {
  const { featuredGames, popularSystems, upcomingEvents, locationGroups } =
    Route.useLoaderData() as VisitorLoaderData;
  const { user } = Route.useRouteContext() as { user: AuthUser };

  const fallbackSelection = useMemo(
    () => buildFallbackSelection(locationGroups),
    [locationGroups],
  );

  const [selectedCity, setSelectedCity] = useState<CitySelection | null>(() =>
    deriveInitialCity(user, locationGroups),
  );
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasLoadedPreference) {
      return;
    }

    if (selectedCity) {
      startTransition(() => setHasLoadedPreference(true));
      return;
    }

    let resolved: CitySelection | null = null;

    try {
      const stored = window.localStorage.getItem(CITY_PREFERENCE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CitySelection;
        if (parsed?.city && parsed?.country) {
          resolved = parsed;
        }
      }
    } catch (error) {
      console.warn("Failed to restore stored city preference:", error);
    }

    if (!resolved) {
      resolved = guessCityFromTimezone(locationGroups);
    }

    if (!resolved) {
      resolved = fallbackSelection;
    }

    if (resolved) {
      startTransition(() => setSelectedCity(resolved));
    }

    startTransition(() => setHasLoadedPreference(true));
  }, [fallbackSelection, hasLoadedPreference, locationGroups, selectedCity]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasLoadedPreference) {
      return;
    }

    try {
      if (selectedCity) {
        window.localStorage.setItem(
          CITY_PREFERENCE_STORAGE_KEY,
          JSON.stringify(selectedCity),
        );
      } else {
        window.localStorage.removeItem(CITY_PREFERENCE_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Failed to persist city preference:", error);
    }
  }, [hasLoadedPreference, selectedCity]);

  const activeSelection = selectedCity ?? fallbackSelection ?? null;
  const activeSelectionLabel = activeSelection
    ? `${activeSelection.city}, ${activeSelection.country}`
    : "your area";

  const localEvents = useMemo(
    () => filterEventsBySelection(upcomingEvents, activeSelection),
    [upcomingEvents, activeSelection],
  );
  const localGames = useMemo(
    () => filterGamesBySelection(featuredGames, activeSelection),
    [featuredGames, activeSelection],
  );

  const systemHighlights = useMemo(
    () => deriveSystemHighlights(popularSystems),
    [popularSystems],
  );

  const locationSelectValue = selectedCity ? encodeSelection(selectedCity) : "";
  const selectionInOptions = cityOptionExists(selectedCity, locationGroups);
  const hasLocationOptions = locationGroups.length > 0;

  const flattenedSuggestions = useMemo(
    () =>
      locationGroups
        .flatMap((group) =>
          group.cities.map((city) => ({
            city: city.city,
            country: group.country,
            userCount: city.userCount,
            key: encodeSelection({ city: city.city, country: group.country }),
          })),
        )
        .sort((a, b) => b.userCount - a.userCount),
    [locationGroups],
  );

  const suggestionChips = useMemo(() => {
    if (!flattenedSuggestions.length) {
      return [] as typeof flattenedSuggestions;
    }
    const currentKey = selectedCity ? encodeSelection(selectedCity) : null;
    return flattenedSuggestions.filter((option) => option.key !== currentKey).slice(0, 6);
  }, [flattenedSuggestions, selectedCity]);

  return (
    <div className="token-stack-3xl">
      <HeroSection
        eyebrow="Start planning"
        title="Discover tabletop adventures tailored to explorers"
        subtitle="Tour community gatherings, curate your favourite systems, and follow the storytellers who match your style."
        backgroundImage="/images/hero-tabletop-board-game-tournament-cards-optimized.png"
        ctaText="Create your profile"
        ctaLink="/auth/signup"
        secondaryCta={{ text: "Log in to continue", link: "/auth/login" }}
      />

      <section className={cn("token-stack-2xl p-6 md:p-10", SECTION_SURFACE)}>
        <div className="token-stack-lg rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_38%,transparent)] bg-[radial-gradient(circle_at_top,_rgba(255,227,208,0.75),_rgba(255,255,255,0.95))] p-6 shadow-sm md:p-8">
          <div className="token-gap-xl flex flex-col lg:flex-row lg:items-start lg:justify-between">
            <div className="token-stack-md max-w-2xl">
              <p className="text-eyebrow text-primary-soft">Explorer guide</p>
              <div className="token-stack-sm">
                <h2 className="text-heading-md text-foreground">
                  Chart the next stop on your journey
                </h2>
                <p className="text-body-md text-muted-strong">
                  Set a home base city to preview gatherings, facilitators, and story
                  worlds that welcome new players.
                </p>
              </div>
              <List className="token-stack-sm">
                {DISCOVERY_THEMES.map((theme) => (
                  <List.Item key={theme.title} className="token-gap-xs flex items-start">
                    <span
                      aria-hidden
                      className="bg-primary-soft/40 text-primary-strong mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    >
                      •
                    </span>
                    <div className="token-stack-2xs">
                      <p className="text-body-sm text-foreground font-semibold">
                        {theme.title}
                      </p>
                      <p className="text-body-sm text-muted-strong">
                        {theme.description}
                      </p>
                    </div>
                  </List.Item>
                ))}
              </List>
            </div>
            <div className="token-stack-sm w-full max-w-sm">
              <label className="text-body-sm text-muted-strong" htmlFor="visitor-city">
                Focus on a city
              </label>
              <div className="relative">
                <select
                  id="visitor-city"
                  className="border-subtle focus:border-primary focus:ring-primary/30 bg-surface-default text-body-sm w-full appearance-none rounded-full border px-5 py-3 pr-12 font-medium shadow-sm transition focus:ring-2 focus:outline-none"
                  value={locationSelectValue}
                  onChange={(event) => {
                    setSelectedCity(decodeSelection(event.target.value));
                  }}
                  disabled={!hasLocationOptions}
                >
                  <option value="">
                    {hasLocationOptions
                      ? "Browse all locations"
                      : "Location data coming soon"}
                  </option>
                  {selectedCity && !selectionInOptions ? (
                    <option value={locationSelectValue}>
                      {selectedCity.city}, {selectedCity.country} (from your profile)
                    </option>
                  ) : null}
                  {locationGroups.map((group) => (
                    <optgroup
                      key={group.country}
                      label={`${group.country} • ${group.totalUsers} players`}
                    >
                      {group.cities.map((city) => {
                        const value = encodeSelection({
                          city: city.city,
                          country: group.country,
                        });
                        return (
                          <option key={value} value={value}>
                            {city.city} ({city.userCount} players)
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
                <div className="text-muted-strong pointer-events-none absolute inset-y-0 right-5 flex items-center">
                  <svg
                    aria-hidden
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95 10 13.657 15.657 8 14.243 6.586 10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
              <p className="text-body-xs text-muted-strong">
                We suggest cities from your profile, saved preferences, or timezone when
                we can.
              </p>
              {suggestionChips.length > 0 ? (
                <div className="token-gap-xs flex flex-wrap items-center">
                  <span className="text-body-xs text-muted-strong">Popular cities:</span>
                  {suggestionChips.map((suggestion) => (
                    <button
                      key={suggestion.key}
                      type="button"
                      onClick={() =>
                        setSelectedCity({
                          city: suggestion.city,
                          country: suggestion.country,
                        })
                      }
                      className="text-body-xs text-muted-strong hover:text-foreground rounded-full border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_12%,white)]/90 px-3 py-1 transition hover:border-[color:color-mix(in_oklab,var(--primary-soft)_48%,transparent)]"
                    >
                      {suggestion.city}, {suggestion.country}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="token-gap-lg rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/85 p-6 shadow-sm md:p-8">
          <div className="token-stack-sm max-w-xl">
            <h3 className="text-heading-sm text-foreground">How this tour flows</h3>
            <p className="text-body-sm text-muted-strong">
              Follow these beats to decide when to join the community or watch for new
              invitations.
            </p>
          </div>
          <ol className="token-gap-md grid gap-5 md:grid-cols-3">
            {STORY_CHAPTERS.map((chapter, index) => (
              <li
                key={chapter}
                className="token-stack-sm rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_14%,white)]/90 p-4 shadow-sm"
              >
                <span className="bg-primary-soft text-primary-strong text-body-sm inline-flex h-9 w-9 items-center justify-center rounded-full font-semibold">
                  {index + 1}
                </span>
                <p className="text-body-sm text-muted-strong">{chapter}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={cn("token-stack-xl p-6 md:p-10", SECTION_SURFACE)}>
        <div className="token-stack-xs">
          <p className="text-eyebrow text-primary-soft">Confidence signals</p>
          <h2 className="text-heading-sm text-foreground">
            What makes Roundup feel safe
          </h2>
          <p className="text-body-sm text-muted-strong">
            We foreground the cues that help solo explorers feel confident before stepping
            into a new space.
          </p>
        </div>
        <div className="token-gap-md grid gap-5 md:grid-cols-3">
          {TRUST_PROMISES.map((signal) => (
            <div
              key={signal.title}
              className="token-stack-sm rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_12%,white)]/90 p-5 shadow-sm"
            >
              <p className="text-body-sm text-foreground font-semibold">{signal.title}</p>
              <p className="text-body-sm text-muted-strong">{signal.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={cn("token-stack-xl p-6 md:p-10", SECTION_SURFACE)}>
        <div className="token-gap-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="token-stack-xs">
            <p className="text-eyebrow text-primary-soft">Upcoming gatherings</p>
            <h2 className="text-heading-sm text-foreground">
              Events near {activeSelectionLabel}
            </h2>
            <p className="text-body-sm text-muted-strong">
              Curated by community hosts. Each RSVP takes you closer to your first
              campaign memory.
            </p>
          </div>
          <Link
            to="/visit/events"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-full",
            )}
          >
            Browse full calendar
          </Link>
        </div>

        {localEvents.length === 0 ? (
          <div className="token-stack-sm items-center rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_28%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/85 p-8 text-center">
            <p className="text-body-md text-muted-strong">
              No events scheduled for this city yet.
            </p>
            <p className="text-body-sm text-muted-strong">
              Switch to another city or check back as hosts publish new sessions.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {localEvents.map((event) => (
              <EventCard key={`visitor-${event.id}`} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className={cn("token-stack-xl p-6 md:p-10", SECTION_SURFACE)}>
        <div className="token-gap-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="token-stack-xs">
            <p className="text-eyebrow text-primary-soft">Stories to sample</p>
            <h2 className="text-heading-sm text-foreground">
              Campaigns welcoming new explorers
            </h2>
            <p className="text-body-sm text-muted-strong">
              These tables lean into onboarding, safety tools, and collaborative energy.
            </p>
          </div>
          <Link
            to="/visit/search"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-full",
            )}
          >
            Search all games
          </Link>
        </div>

        {localGames.length === 0 ? (
          <div className="token-stack-sm items-center rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_28%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/85 p-8 text-center">
            <p className="text-body-md text-muted-strong">
              No spotlight campaigns in this city yet.
            </p>
            <p className="text-body-sm text-muted-strong">
              Try a nearby metro or follow our newsletter for launch announcements.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {localGames.map((game) => (
              <GameShowcaseCard
                key={`visitor-game-${game.id}`}
                game={game}
                className="h-full"
              />
            ))}
          </div>
        )}
      </section>

      <section className={cn("token-stack-lg p-6 md:p-10", SECTION_SURFACE)}>
        <div className="token-stack-xs">
          <p className="text-eyebrow text-primary-soft">Trending systems</p>
          <h2 className="text-heading-sm text-foreground">Rulesets with momentum</h2>
          <p className="text-body-sm text-muted-strong">
            Discover which systems are lighting up tables so you know what to learn next.
          </p>
        </div>
        {systemHighlights.length === 0 ? (
          <p className="text-body-sm text-muted-strong">
            We’ll highlight popular systems once more sessions are scheduled.
          </p>
        ) : (
          <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
            {systemHighlights.map((system) => (
              <Link
                key={system.id}
                to="/visit/systems/$slug"
                params={{ slug: system.slug }}
                className="focus-visible:ring-primary focus-visible:ring-offset-background min-w-[16rem] rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_12%,white)]/90 p-4 transition hover:border-[color:color-mix(in_oklab,var(--primary-soft)_50%,transparent)] hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="token-stack-sm">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    {system.heroUrl ? (
                      <img
                        src={system.heroUrl}
                        alt={`${system.name} cover art`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="bg-muted text-muted-strong text-body-xs flex h-full w-full items-center justify-center">
                        Hero art pending moderation
                      </div>
                    )}
                  </div>
                  <div className="token-stack-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-body-sm text-foreground font-semibold">
                        {system.name}
                      </p>
                      <span className="text-body-2xs text-muted-strong tracking-wide uppercase">
                        {system.gameCount} sessions
                      </span>
                    </div>
                    <p className="text-body-xs text-muted-strong line-clamp-3">
                      {system.summary ?? "Description coming soon."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section
        className={cn(
          "token-stack-xl from-primary-soft/28 bg-gradient-to-br via-[color:color-mix(in_oklab,var(--primary-soft)_14%,white)] to-amber-50/80 p-8 text-center",
          SECTION_SURFACE,
        )}
      >
        <div className="token-stack-sm">
          <h2 className="text-heading-sm text-foreground">
            When you’re ready to go deeper
          </h2>
          <p className="text-body-md text-muted-strong">
            Create a free account to follow cities, bookmark campaigns, and receive
            invites from trusted GMs.
          </p>
        </div>
        <div className="token-gap-sm flex flex-wrap items-center justify-center">
          <Link
            to="/auth/signup"
            className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
          >
            Start your player profile
          </Link>
          <Link
            to="/auth/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "lg" }),
              "rounded-full px-8",
            )}
          >
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  );
}
