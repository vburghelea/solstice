import { createFileRoute, Link } from "@tanstack/react-router";
import { startTransition, useEffect, useMemo, useState } from "react";
import { buttonVariants } from "~/components/ui/button";
import { EventCard } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { listPopularSystems } from "~/features/game-systems/game-systems.queries";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import { GameListItemView } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { listUserLocations } from "~/features/profile/profile.queries";
import type { CountryLocationGroup } from "~/features/profile/profile.types";
import type { AuthUser } from "~/lib/auth/types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

const HERO_IMAGE_URL = "/images/hero-tabletop-board-game-small-group-optimized.png";

const CITY_STORAGE_KEY = "roundup:selected-city";

type CitySelection = {
  city: string;
  country: string;
};

type HomeLoaderData = {
  featuredGames: GameListItem[];
  popularSystems: PopularGameSystem[];
  upcomingEvents: EventWithDetails[];
  locationGroups: CountryLocationGroup[];
};

export const Route = createFileRoute("/")({
  loader: async (): Promise<HomeLoaderData> => {
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
      getUpcomingEvents({ data: { limit: 6 } }).catch((error) => {
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
  component: Index,
});

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function encodeSelection(selection: CitySelection): string {
  return `${encodeURIComponent(selection.country)}::${encodeURIComponent(selection.city)}`;
}

function decodeSelection(value: string): CitySelection | null {
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

function deriveInitialCity(
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

function buildFallbackSelection(groups: CountryLocationGroup[]): CitySelection | null {
  for (const group of groups) {
    const firstCity = group.cities[0];
    if (firstCity) {
      return { city: firstCity.city, country: group.country };
    }
  }

  return null;
}

function guessCityFromTimezone(groups: CountryLocationGroup[]): CitySelection | null {
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

function cityOptionExists(
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

function filterGamesBySelection(
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

  const source = matches.length > 0 ? matches : games;
  return source.slice(0, 3);
}

function filterEventsBySelection(
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

  const source = matches.length > 0 ? matches : events;
  return source.slice(0, 3);
}

function Index() {
  const { featuredGames, popularSystems, upcomingEvents, locationGroups } =
    Route.useLoaderData() as HomeLoaderData;
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
      const stored = window.localStorage.getItem(CITY_STORAGE_KEY);
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
        window.localStorage.setItem(CITY_STORAGE_KEY, JSON.stringify(selectedCity));
      } else {
        window.localStorage.removeItem(CITY_STORAGE_KEY);
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
    <PublicLayout>
      <HeroSection
        title="Welcome to Roundup Games"
        subtitle="Connect with tabletop and board game enthusiasts, organize sessions, and keep long-running campaigns on track."
        backgroundImage={HERO_IMAGE_URL}
        ctaText="Explore games"
        ctaLink="/search"
      />

      {upcomingEvents.length > 0 ? (
        <section className="border-border/60 bg-muted/20 dark:bg-muted/10 dark:border-border/40 border-y py-10 transition-colors sm:py-14 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold sm:text-3xl">Upcoming public events</h2>
              <Link
                to="/events"
                className={cn(
                  buttonVariants({ size: "sm", variant: "ghost" }),
                  "rounded-full px-5",
                )}
              >
                View all events
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-border/60 bg-background dark:border-border/40 dark:bg-background border-b py-10 transition-colors sm:py-14 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
                Find a local table
              </p>
              <h2 className="text-3xl font-bold sm:text-4xl">
                Discover board game nights near {activeSelectionLabel}
              </h2>
              <p className="text-foreground/80 dark:text-muted-foreground text-sm sm:text-base">
                We surface cities directly from player profiles so you can quickly join
                communities that are already meeting up.
              </p>
            </div>
            <div className="w-full max-w-md">
              <label className="sr-only" htmlFor="home-city">
                Select your city
              </label>
              <div className="relative">
                <select
                  id="home-city"
                  className="border-border bg-card/80 focus:border-primary focus:ring-primary/30 w-full appearance-none rounded-full border px-5 py-3 pr-10 text-sm font-medium shadow-sm transition focus:ring-2 focus:outline-none"
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
                <div className="text-muted-foreground pointer-events-none absolute inset-y-0 right-4 flex items-center">
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
              <p className="text-muted-foreground/80 mt-2 text-xs">
                We guess your city from your profile, saved preferences, or timezone when
                available.
              </p>
            </div>
          </div>

          {suggestionChips.length > 0 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
              <span className="text-muted-foreground/80">Popular cities:</span>
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
                  className="bg-card hover:bg-muted text-muted-foreground/90 hover:text-foreground rounded-full border px-3 py-1 transition"
                >
                  {suggestion.city}, {suggestion.country}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr,1fr] xl:grid-cols-[5fr,7fr]">
            <div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Events near {activeSelectionLabel}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Approved public events sourced directly from community organizers.
                </p>
              </div>
              {localEvents.length === 0 ? (
                <div className="border-border/60 bg-card/50 mt-6 rounded-3xl border border-dashed px-6 py-10 text-center">
                  <p className="text-muted-foreground text-base font-medium">
                    No events scheduled for this city yet.
                  </p>
                  <p className="text-muted-foreground/80 mt-2 text-sm">
                    Switch to another city or check back soon as organizers publish their
                    calendars.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {localEvents.map((event) => (
                    <EventCard key={`local-${event.id}`} event={event} />
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold">
                  Games hosted near {activeSelectionLabel}
                </h3>
                <p className="text-muted-foreground text-sm">
                  Player-run sessions and campaign nights that still have seats open.
                </p>
              </div>
              {localGames.length === 0 ? (
                <div className="border-border/60 bg-card/50 mt-6 rounded-3xl border border-dashed px-6 py-10 text-center">
                  <p className="text-muted-foreground text-base font-medium">
                    No featured games in this area yet.
                  </p>
                  <p className="text-muted-foreground/80 mt-2 text-sm">
                    Try another location or browse the full catalogue to find an online
                    group.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-6 md:hidden">
                    <List>
                      {localGames.map((game) => (
                        <GameListItemView key={game.id} game={game} />
                      ))}
                    </List>
                  </div>
                  <div className="mt-6 hidden gap-8 md:grid md:grid-cols-2 xl:grid-cols-3">
                    {localGames.map((game) => (
                      <article
                        key={game.id}
                        className="border-border/70 bg-card/80 hover:border-primary/50 flex h-full flex-col justify-between gap-4 rounded-3xl border p-6 text-left shadow-sm transition"
                      >
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold">{game.name}</h3>
                          {game.description ? (
                            <p className="text-muted-foreground line-clamp-3 text-sm">
                              {game.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="text-muted-foreground space-y-2 text-sm">
                          <p className="flex items-start gap-2">
                            <span aria-hidden>📍</span>
                            <span className="flex-1">{game.location.address}</span>
                          </p>
                          <p className="flex items-start gap-2">
                            <span aria-hidden>🗓️</span>
                            <span className="flex-1">
                              {formatDateAndTime(game.dateTime)}
                            </span>
                          </p>
                        </div>
                        <Link
                          to="/game/$gameId"
                          params={{ gameId: game.id }}
                          className={cn(
                            buttonVariants({ size: "sm", variant: "outline" }),
                            "mt-2 self-start rounded-full",
                          )}
                        >
                          View details
                        </Link>
                      </article>
                    ))}
                  </div>
                </>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/search"
                  className={cn(buttonVariants({ size: "lg" }), "rounded-full px-8")}
                >
                  Browse all games
                </Link>
                <Link
                  to="/events"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" }),
                    "rounded-full px-8",
                  )}
                >
                  Browse all events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 transition-colors sm:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h2 className="font-heading text-3xl sm:text-4xl">Popular game systems</h2>
              <p className="text-muted-foreground max-w-xl text-sm sm:text-base">
                Sessions most frequently booked by the community over the past few weeks.
              </p>
            </div>
            <Link
              to="/systems"
              className={cn(
                buttonVariants({ size: "sm", variant: "ghost" }),
                "self-start rounded-full px-5",
              )}
            >
              Browse all systems
            </Link>
          </div>

          {popularSystems.length === 0 ? (
            <p className="text-muted-foreground/80 mt-10 text-center text-sm">
              We’ll highlight popular systems once more sessions are scheduled.
            </p>
          ) : (
            <div className="mt-10 overflow-x-auto pb-4">
              <div className="flex gap-6 pb-2">
                {popularSystems.map((system) => (
                  <Link
                    key={system.id}
                    to="/systems/$slug"
                    params={{ slug: system.slug }}
                    className="focus-visible:ring-offset-background group border-border/70 bg-card/80 hover:border-primary/50 hover:bg-card/90 w-64 flex-shrink-0 rounded-3xl border px-3 pt-3 pb-4 shadow-sm transition sm:w-72 sm:px-4 sm:pt-4 sm:pb-5"
                  >
                    <div className="bg-muted h-40 w-full overflow-hidden rounded-2xl">
                      {system.heroUrl ? (
                        <img
                          src={system.heroUrl}
                          alt={`${system.name} cover art`}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="text-muted-foreground flex h-full w-full items-center justify-center px-4 text-center text-sm">
                          Hero art pending moderation
                        </div>
                      )}
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-lg font-semibold">{system.name}</h3>
                        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                          {system.gameCount} sessions
                        </span>
                      </div>
                      {system.summary ? (
                        <p className="text-muted-foreground/90 line-clamp-3 text-sm">
                          {system.summary}
                        </p>
                      ) : (
                        <p className="text-muted-foreground/70 text-sm">
                          Description coming soon.
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border-border/60 bg-muted/30 dark:border-border/40 dark:bg-muted/20 border-t py-16 transition-colors sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-heading mb-12 text-3xl md:text-4xl">How it works</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {["Find a local game", "Join a session", "Play in person"].map(
              (title, index) => {
                const descriptions = [
                  "Search for tabletop RPGs, board game meetups, and events happening near you.",
                  "Connect with Game Masters and fellow players. RSVP or book your spot directly.",
                  "Enjoy immersive gaming experiences and build a local gaming community.",
                ];

                return (
                  <div
                    key={title}
                    className="border-border/60 bg-card/60 flex flex-col items-center rounded-3xl border p-6 text-center shadow-sm"
                  >
                    <div className="bg-primary/15 text-primary mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                      {index + 1}
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                    <p className="text-muted-foreground text-sm">{descriptions[index]}</p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden py-16 text-center sm:py-20">
        <div className="from-primary/80 via-primary to-primary/80 absolute inset-0 -z-10 bg-gradient-to-r" />
        <div className="container mx-auto px-4">
          <div className="text-primary-foreground mx-auto max-w-2xl space-y-6">
            <h2 className="font-heading text-3xl md:text-4xl">
              Ready to host your own game?
            </h2>
            <p className="text-lg sm:text-xl">
              Share your passion! Become a Game Master or host a board game meetup in your
              area.
            </p>
            <Link
              to="/auth/signup"
              className={cn(
                buttonVariants({ size: "lg", variant: "secondary" }),
                "rounded-full px-8",
              )}
            >
              Become a host
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
