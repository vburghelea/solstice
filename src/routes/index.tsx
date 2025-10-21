import { createFileRoute } from "@tanstack/react-router";
import { startTransition, useEffect, useMemo, useState } from "react";

import { EventCard } from "~/components/ui/event-card";
import { HeroSection } from "~/components/ui/hero-section";
import { LocalizedButtonLink, LocalizedLink } from "~/components/ui/LocalizedLink";
import { getUpcomingEvents } from "~/features/events/events.queries";
import type { EventWithDetails } from "~/features/events/events.types";
import { listPopularSystems } from "~/features/game-systems/game-systems.queries";
import type { PopularGameSystem } from "~/features/game-systems/game-systems.types";
import {
  GameShowcaseCard,
  type GameLinkConfig,
} from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { VisitorShell } from "~/features/layouts/visitor-shell";
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
import { useCommonTranslation, useHomeTranslation } from "~/hooks/useTypedTranslation";
import type { AuthUser } from "~/lib/auth/types";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

type VisitorLoaderData = {
  featuredGames: GameListItem[];
  popularSystems: PopularGameSystem[];
  upcomingEvents: EventWithDetails[];
  locationGroups: CountryLocationGroup[];
};

export const Route = createFileRoute("/")({
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
// Note: These constants will be populated with translation keys in the component
// They remain empty here as they need access to the translation function

const VISITOR_HERO_IMAGE = createResponsiveCloudinaryImage("heroTournamentCards", {
  transformation: {
    width: 1920,
    height: 1080,
    crop: "fill",
    gravity: "auto",
  },
  widths: [480, 768, 1024, 1440, 1920],
  sizes: "100vw",
});

const SECTION_SURFACE =
  "rounded-3xl bg-secondary shadow-sm ring-1 ring-inset ring-[color:color-mix(in_oklab,var(--primary-soft)_18%,transparent)] dark:bg-card/70 dark:ring-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)]";

const explorerPanelSurface =
  "rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors dark:bg-card/80 md:p-8";

function VisitorExperience() {
  const { featuredGames, popularSystems, upcomingEvents, locationGroups } =
    Route.useLoaderData() as VisitorLoaderData;
  const { user } = Route.useRouteContext() as { user: AuthUser };

  const { t: ht } = useHomeTranslation();
  const { t: ct } = useCommonTranslation();

  // Translation-aware constants
  const DISCOVERY_THEMES = [
    {
      title: ht("explorer_guide.themes.curated_spotlights.title"),
      description: ht("explorer_guide.themes.curated_spotlights.description"),
    },
    {
      title: ht("explorer_guide.themes.effortless_planning.title"),
      description: ht("explorer_guide.themes.effortless_planning.description"),
    },
    {
      title: ht("explorer_guide.themes.trust_first_design.title"),
      description: ht("explorer_guide.themes.trust_first_design.description"),
    },
  ];

  const STORY_CHAPTERS = [
    ht("explorer_guide.chapters.0"),
    ht("explorer_guide.chapters.1"),
    ht("explorer_guide.chapters.2"),
  ];

  const TRUST_PROMISES = [
    {
      title: ht("confidence_signals.safety_tools.title"),
      description: ht("confidence_signals.safety_tools.description"),
    },
    {
      title: ht("confidence_signals.meet_facilitator.title"),
      description: ht("confidence_signals.meet_facilitator.description"),
    },
    {
      title: ht("confidence_signals.welcoming_spaces.title"),
      description: ht("confidence_signals.welcoming_spaces.description"),
    },
  ];

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
    : ht("upcoming_events.default_area");

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
    <VisitorShell>
      <div className="token-stack-3xl space-y-4">
        <HeroSection
          eyebrow={ht("hero.eyebrow")}
          title={ht("hero.title")}
          subtitle={ht("hero.subtitle")}
          backgroundImageSet={VISITOR_HERO_IMAGE}
          ctaText={ht("hero.cta_text")}
          ctaLink="/auth/signup"
          secondaryCta={{ text: ht("hero.secondary_cta"), link: "/auth/login" }}
        />

        <section className={cn("token-stack-2xl space-y-4 p-6 md:p-10", SECTION_SURFACE)}>
          <div
            className={cn(
              "token-stack-lg relative overflow-hidden",
              explorerPanelSurface,
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,227,208,0.75),_rgba(255,255,255,0.95))] opacity-95 dark:hidden" />
            <div className="token-gap-xl relative flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="token-stack-md max-w-2xl">
                <p className="text-eyebrow text-primary-soft">
                  {ht("explorer_guide.eyebrow")}
                </p>
                <div className="token-stack-sm">
                  <h2 className="text-heading-md text-foreground">
                    {ht("explorer_guide.title")}
                  </h2>
                  <p className="text-body-md text-muted-strong">
                    {ht("explorer_guide.subtitle")}
                  </p>
                </div>
                <List className="token-stack-sm">
                  {DISCOVERY_THEMES.map((theme) => (
                    <List.Item
                      key={theme.title}
                      className="token-gap-xs flex items-start"
                    >
                      <span
                        aria-hidden
                        className="bg-primary-soft/40 text-primary-strong dark:bg-primary/35 dark:text-primary-foreground mt-1 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
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
                  {ht("explorer_guide.city_focus_label")}
                </label>
                <div className="relative">
                  <select
                    id="visitor-city"
                    className="border-border focus:border-primary focus:ring-primary/30 bg-card text-body-sm text-foreground dark:bg-card/80 w-full appearance-none rounded-full border px-5 py-3 pr-12 font-medium shadow-sm transition focus:ring-2 focus:outline-none"
                    value={locationSelectValue}
                    onChange={(event) => {
                      setSelectedCity(decodeSelection(event.target.value));
                    }}
                    disabled={!hasLocationOptions}
                  >
                    <option value="">
                      {hasLocationOptions
                        ? ht("explorer_guide.browse_all_locations")
                        : ht("explorer_guide.location_data_coming_soon")}
                    </option>
                    {selectedCity && !selectionInOptions ? (
                      <option value={locationSelectValue}>
                        {selectedCity.city}, {selectedCity.country} (
                        {ht("explorer_guide.from_your_profile")})
                      </option>
                    ) : null}
                    {locationGroups.map((group) => (
                      <optgroup
                        key={group.country}
                        label={ct("location.country_players", {
                          country: group.country,
                          count: group.totalUsers,
                        })}
                      >
                        {group.cities.map((city) => {
                          const value = encodeSelection({
                            city: city.city,
                            country: group.country,
                          });
                          return (
                            <option key={value} value={value}>
                              {city.city} (
                              {ct("location.players_count", { count: city.userCount })})
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <div className="text-muted-strong dark:text-muted-foreground pointer-events-none absolute inset-y-0 right-5 flex items-center">
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
                  {ht("explorer_guide.location_suggestion")}
                </p>
                {suggestionChips.length > 0 ? (
                  <div className="token-gap-xs flex flex-wrap items-center">
                    <span className="text-body-xs text-muted-strong">
                      {ht("explorer_guide.popular_cities")}
                    </span>
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
                        className="text-body-xs text-muted-strong hover:text-foreground border-border bg-card hover:border-primary/80 dark:bg-card/80 dark:text-muted-foreground rounded-full border px-3 py-1 transition"
                      >
                        {suggestion.city}, {suggestion.country}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={cn("token-gap-lg space-y-4", explorerPanelSurface)}>
            <div className="token-stack-sm max-w-xl">
              <h3 className="text-heading-sm text-foreground">
                {ht("explorer_guide.how_it_flows.title")}
              </h3>
              <p className="text-body-sm text-muted-strong">
                {ht("explorer_guide.how_it_flows.subtitle")}
              </p>
            </div>
            <ol className="token-gap-md grid gap-5 md:grid-cols-3">
              {STORY_CHAPTERS.map((chapter, index) => (
                <li
                  key={chapter}
                  className="token-stack-sm border-border bg-card dark:bg-card/70 rounded-xl border p-4 shadow-sm transition-colors"
                >
                  <span className="bg-primary-soft text-primary-strong text-body-sm inline-flex h-9 w-9 items-center justify-center rounded-full font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-body-sm text-muted-strong dark:text-muted-foreground">
                    {chapter}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className={cn("token-stack-xl space-y-4 p-6 md:p-10", SECTION_SURFACE)}>
          <div className="token-stack-xs">
            <p className="text-eyebrow text-primary-soft">
              {ht("confidence_signals.eyebrow")}
            </p>
            <h2 className="text-heading-sm text-foreground">
              {ht("confidence_signals.title")}
            </h2>
            <p className="text-body-sm text-muted-strong">
              {ht("confidence_signals.subtitle")}
            </p>
          </div>
          <div className="token-gap-md grid gap-5 md:grid-cols-3">
            {TRUST_PROMISES.map((signal) => (
              <div
                key={signal.title}
                className={cn("token-stack-sm p-5", explorerPanelSurface)}
              >
                <p className="text-body-sm text-foreground font-semibold">
                  {signal.title}
                </p>
                <p className="text-body-sm text-muted-strong">{signal.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={cn("token-stack-xl space-y-4 p-6 md:p-10", SECTION_SURFACE)}>
          <div className="token-gap-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="token-stack-xs">
              <p className="text-eyebrow text-primary-soft">
                {ht("upcoming_events.eyebrow")}
              </p>
              <h2 className="text-heading-sm text-foreground">
                {ht("upcoming_events.title_prefix")} {activeSelectionLabel}
              </h2>
              <p className="text-body-sm text-muted-strong">
                {ht("upcoming_events.subtitle")}
              </p>
            </div>
            <LocalizedButtonLink
              to="/events"
              translationKey="links.event_management.browse_events"
              translationNamespace="navigation"
              variant="outline"
              size="sm"
              className="rounded-full"
            >
              {ht("upcoming_events.browse_full_calendar")}
            </LocalizedButtonLink>
          </div>

          {localEvents.length === 0 ? (
            <div className="token-stack-sm items-center rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_28%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/85 p-8 text-center">
              <p className="text-body-md text-muted-strong">
                {ht("upcoming_events.no_events_title")}
              </p>
              <p className="text-body-sm text-muted-strong">
                {ht("upcoming_events.no_events_subtitle")}
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

        <section className={cn("token-stack-xl space-y-4 p-6 md:p-10", SECTION_SURFACE)}>
          <div className="token-gap-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="token-stack-xs">
              <p className="text-eyebrow text-primary-soft">
                {ht("story_sessions.eyebrow")}
              </p>
              <h2 className="text-heading-sm text-foreground">
                {ht("story_sessions.title")}
              </h2>
              <p className="text-body-sm text-muted-strong">
                {ht("story_sessions.subtitle")}
              </p>
            </div>
            <LocalizedButtonLink
              to="/search"
              translationKey="links.actions.search"
              translationNamespace="navigation"
              variant="ghost"
              size="sm"
              className="rounded-full"
            >
              {ht("story_sessions.search_all_games")}
            </LocalizedButtonLink>
          </div>

          {localGames.length === 0 ? (
            <div className="token-stack-sm items-center rounded-xl border border-[color:color-mix(in_oklab,var(--primary-soft)_28%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_10%,white)]/85 p-8 text-center">
              <p className="text-body-md text-muted-strong">
                {ht("story_sessions.no_sessions_title")}
              </p>
              <p className="text-body-sm text-muted-strong">
                {ht("story_sessions.no_sessions_subtitle")}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {localGames.map((game) => {
                const visitLink: GameLinkConfig = {
                  to: "/game/$gameId",
                  params: { gameId: game.id },
                };

                return (
                  <GameShowcaseCard
                    key={`visitor-game-${game.id}`}
                    game={game}
                    className="h-full"
                    link={visitLink}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className={cn("token-stack-lg space-y-4 p-6 md:p-10", SECTION_SURFACE)}>
          <div className="token-stack-xs">
            <p className="text-eyebrow text-primary-soft">
              {ht("trending_systems.eyebrow")}
            </p>
            <h2 className="text-heading-sm text-foreground">
              {ht("trending_systems.title")}
            </h2>
            <p className="text-body-sm text-muted-strong">
              {ht("trending_systems.subtitle")}
            </p>
          </div>
          {systemHighlights.length === 0 ? (
            <p className="text-body-sm text-muted-strong">
              {ht("trending_systems.no_systems")}
            </p>
          ) : (
            <div className="no-scrollbar flex gap-4 overflow-x-auto pb-2">
              {systemHighlights.map((system) => (
                <LocalizedLink
                  key={system.id}
                  to="/systems/$slug"
                  params={{ slug: system.slug }}
                  ariaLabelTranslationKey="links.accessibility.link_aria_label.game_system_details"
                  translationNamespace="navigation"
                  className={`focus-visible:ring-primary focus-visible:ring-offset-background min-w-[16rem] transition hover:border-[color:color-mix(in_oklab,var(--primary-soft)_50%,transparent)] hover:shadow-md focus-visible:ring-2 focus-visible:outline-none ${explorerPanelSurface}`}
                >
                  <div className="token-stack-sm">
                    <div className="aspect-video overflow-hidden rounded-lg">
                      {system.heroUrl ? (
                        <img
                          src={system.heroUrl}
                          alt={ct("image.cover_art_alt", { name: system.name })}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="bg-muted text-muted-strong text-body-xs flex h-full w-full items-center justify-center">
                          {ht("trending_systems.hero_art_pending")}
                        </div>
                      )}
                    </div>
                    <div className="token-stack-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-body-sm text-foreground font-semibold">
                          {system.name}
                        </p>
                        <span className="text-body-2xs text-muted-strong tracking-wide uppercase">
                          {ht("trending_systems.sessions_count", {
                            count: system.gameCount,
                          })}
                        </span>
                      </div>
                      <p className="text-body-xs text-muted-strong line-clamp-3">
                        {system.summary ?? ht("trending_systems.description_coming_soon")}
                      </p>
                    </div>
                  </div>
                </LocalizedLink>
              ))}
            </div>
          )}
        </section>

        <section
          className={cn(
            "token-stack-xl from-primary-soft/28 space-y-4 bg-gradient-to-br via-[color:color-mix(in_oklab,var(--primary-soft)_14%,white)] to-amber-50/80 p-8 text-center dark:bg-gray-900/70 dark:text-gray-200",
            SECTION_SURFACE,
          )}
        >
          <div className="token-stack-sm">
            <h2 className="text-heading-sm text-foreground">
              {ht("ready_to_go_deeper.title")}
            </h2>
            <p className="text-body-md text-muted-strong">
              {ht("ready_to_go_deeper.subtitle")}
            </p>
          </div>
          <div className="token-gap-sm flex flex-wrap items-center justify-center">
            <LocalizedButtonLink
              to="/auth/signup"
              translationKey="links.actions.signup"
              translationNamespace="navigation"
              size="lg"
              className="rounded-full px-8"
            >
              {ht("ready_to_go_deeper.start_profile")}
            </LocalizedButtonLink>
            <LocalizedButtonLink
              to="/auth/login"
              translationKey="links.actions.login"
              translationNamespace="navigation"
              variant="ghost"
              size="lg"
              className="rounded-full px-8"
            >
              {ht("ready_to_go_deeper.have_account")}
            </LocalizedButtonLink>
          </div>
        </section>
      </div>
    </VisitorShell>
  );
}
