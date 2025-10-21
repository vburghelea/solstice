import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import {
  GameListItemView,
  GameShowcaseCard,
  type GameLinkConfig,
} from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { getCurrentUserProfileSafe } from "~/features/profile/profile.safe-queries";
import { useCommonTranslation, useGamesTranslation } from "~/hooks/useTypedTranslation";
import { QuickFiltersBar } from "~/shared/components/quick-filters-bar";
import { normalizeText } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

type PlayerFilterContext = {
  city: string | null;
  country: string | null;
  languages: string[];
  favoriteSystems: { id: number; name: string }[];
  themes: string[];
};

type SearchLoaderData = {
  games: GameListItem[];
  playerFilters: PlayerFilterContext | null;
};

type QuickFilterKey = "city" | "favorites" | "language" | "themes";

interface QuickFilterDefinition {
  key: QuickFilterKey;
  label: string;
  predicate: (game: GameListItem) => boolean;
}

export const Route = createFileRoute("/search")({
  loader: async () => {
    const [gamesOutcome, profileOutcome] = await Promise.allSettled([
      listGames({
        data: { filters: { visibility: "public", status: "scheduled" } },
      }),
      getCurrentUserProfileSafe(),
    ]);

    let games: GameListItem[] = [];
    if (gamesOutcome.status === "fulfilled") {
      if (gamesOutcome.value.success) {
        games = gamesOutcome.value.data;
      } else {
        console.error("Failed to fetch games:", gamesOutcome.value.errors);
      }
    } else {
      console.error("Failed to fetch games:", gamesOutcome.reason);
    }

    let playerFilters: PlayerFilterContext | null = null;
    if (profileOutcome.status === "fulfilled" && profileOutcome.value) {
      const profile = profileOutcome.value;
      playerFilters = {
        city: profile.city ?? null,
        country: profile.country ?? null,
        languages: profile.languages ?? [],
        favoriteSystems: profile.gameSystemPreferences?.favorite ?? [],
        themes: profile.preferredGameThemes ?? [],
      };
    }

    return { games, playerFilters } satisfies SearchLoaderData;
  },
  component: SearchPage,
});

function SearchPage() {
  const { games, playerFilters } = Route.useLoaderData() as SearchLoaderData;
  const [activeFilters, setActiveFilters] = useState<QuickFilterKey[]>([]);
  const { t: gt } = useGamesTranslation();
  const { t: ct } = useCommonTranslation();

  const availableFilters = useMemo<QuickFilterDefinition[]>(() => {
    if (!playerFilters) {
      return [];
    }

    const filters: QuickFilterDefinition[] = [];

    if (playerFilters.city) {
      const cityNormalized = normalizeText(playerFilters.city);
      const countryNormalized = playerFilters.country
        ? normalizeText(playerFilters.country)
        : null;

      filters.push({
        key: "city",
        label: gt("quick_filters.in_city", { city: playerFilters.city }),
        predicate: (game) => {
          const address = game.location?.address ?? "";
          const normalizedAddress = normalizeText(address);
          if (cityNormalized && normalizedAddress.includes(cityNormalized)) {
            return true;
          }
          if (countryNormalized && normalizedAddress.includes(countryNormalized)) {
            return true;
          }
          return false;
        },
      });
    }

    if (playerFilters.favoriteSystems.length > 0) {
      const favoriteIds = new Set(
        playerFilters.favoriteSystems.map((system) => system.id),
      );
      filters.push({
        key: "favorites",
        label: gt("quick_filters.my_favorite_systems"),
        predicate: (game) => {
          const systemId = game.gameSystem?.id;
          return typeof systemId === "number" && favoriteIds.has(systemId);
        },
      });
    }

    if (playerFilters.languages.length > 0) {
      const languages = playerFilters.languages.map(normalizeText);
      filters.push({
        key: "language",
        label: gt("quick_filters.in_my_language"),
        predicate: (game) => {
          if (!game.language) {
            return false;
          }
          const language = normalizeText(game.language);
          return languages.some(
            (preferred) => language.includes(preferred) || preferred.includes(language),
          );
        },
      });
    }

    if (playerFilters.themes.length > 0) {
      const themes = playerFilters.themes.map(normalizeText);
      filters.push({
        key: "themes",
        label: gt("quick_filters.my_themes"),
        predicate: (game) => {
          const categories = (game.gameSystem?.categories ?? []).map(normalizeText);
          if (categories.length === 0) {
            return false;
          }
          return categories.some((category) =>
            themes.some((theme) => category.includes(theme) || theme.includes(category)),
          );
        },
      });
    }

    return filters;
  }, [playerFilters, gt]);

  const filterMap = useMemo(() => {
    return new Map(availableFilters.map((filter) => [filter.key, filter.predicate]));
  }, [availableFilters]);

  const filteredGames = useMemo(() => {
    if (activeFilters.length === 0) {
      return games;
    }

    const predicates = activeFilters
      .map((key) => filterMap.get(key))
      .filter(
        (predicate): predicate is (game: GameListItem) => boolean =>
          typeof predicate === "function",
      );

    if (predicates.length === 0) {
      return games;
    }

    return games.filter((game) => predicates.every((predicate) => predicate(game)));
  }, [games, activeFilters, filterMap]);

  const toggleFilter = useCallback(
    (key: QuickFilterKey) => {
      setActiveFilters((prev) =>
        prev.includes(key) ? prev.filter((filter) => filter !== key) : [...prev, key],
      );
    },
    [setActiveFilters],
  );

  const clearFilters = useCallback(() => setActiveFilters([]), [setActiveFilters]);

  const quickFilterButtons = useMemo(
    () =>
      availableFilters.map((filter) => ({
        id: filter.key,
        label: filter.label,
        active: activeFilters.includes(filter.key),
        onToggle: () => toggleFilter(filter.key),
      })),
    [activeFilters, availableFilters, toggleFilter],
  );

  const showQuickFilters = quickFilterButtons.length > 0;
  const hasGames = games.length > 0;
  const hasFilteredGames = filteredGames.length > 0;

  return (
    <VisitorShell>
      <div className="bg-secondary text-foreground dark:bg-gray-950">
        <section className="border-border/60 bg-secondary border-b dark:border-gray-800 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <h1 className="font-heading text-4xl sm:text-5xl">{gt("search.title")}</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {gt("search.subtitle")}
              </p>
            </div>
          </div>
        </section>

        {showQuickFilters ? (
          <section className="border-border/60 bg-secondary border-b py-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="container mx-auto px-4">
              <QuickFiltersBar
                filters={quickFilterButtons}
                {...(activeFilters.length > 0 ? { onClear: clearFilters } : {})}
              />
            </div>
          </section>
        ) : null}

        <section className="bg-secondary py-12 sm:py-16 dark:bg-gray-950">
          <div className="container mx-auto px-4">
            {!hasGames ? (
              <div className="border-border/70 bg-card/50 mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl border border-dashed px-8 py-12 text-center transition-colors dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                <p className="text-muted-foreground text-base font-medium">
                  {gt("search.no_games.title")}
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  {gt("search.no_games.subtitle")}
                </p>
                <LocalizedButtonLink
                  to="/auth/signup"
                  translationKey="links.actions.signup"
                  translationNamespace="navigation"
                  size="sm"
                  variant="outline"
                  className="mt-2 rounded-full"
                >
                  {gt("search.no_games.become_host")}
                </LocalizedButtonLink>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    {ct("showing_results", {
                      count: filteredGames.length,
                      itemType:
                        filteredGames.length === 1
                          ? gt("search.session")
                          : gt("search.sessions"),
                    })}
                    {activeFilters.length > 0
                      ? ` ${gt("search.with_quick_filters")}`
                      : ""}
                  </p>
                  {activeFilters.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-primary dark:text-primary-200 text-sm font-medium hover:underline"
                    >
                      {ct("common.clear_all")}
                    </button>
                  ) : null}
                </div>

                {!hasFilteredGames ? (
                  <div className="border-border/70 bg-card/60 mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-3xl border border-dashed px-8 py-12 text-center transition-colors dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                    <p className="text-muted-foreground text-base font-medium">
                      {gt("search.no_filtered_sessions.title")}
                    </p>
                    <p className="text-muted-foreground/80 text-sm">
                      {gt("search.no_filtered_sessions.subtitle")}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="md:hidden">
                      <List>
                        {filteredGames.map((game) => {
                          const visitLink: GameLinkConfig = {
                            to: "/game/$gameId",
                            params: { gameId: game.id },
                          };

                          return (
                            <GameListItemView
                              key={game.id}
                              game={game}
                              link={visitLink}
                            />
                          );
                        })}
                      </List>
                    </div>

                    <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
                      {filteredGames.map((game) => {
                        const visitLink: GameLinkConfig = {
                          to: "/game/$gameId",
                          params: { gameId: game.id },
                        };

                        return (
                          <GameShowcaseCard key={game.id} game={game} link={visitLink} />
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </VisitorShell>
  );
}
