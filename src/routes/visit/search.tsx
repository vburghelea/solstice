import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { buttonVariants } from "~/components/ui/button";
import {
  GameListItemView,
  GameShowcaseCard,
  type GameLinkConfig,
} from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { getUserProfile } from "~/features/profile/profile.queries";
import { cn } from "~/shared/lib/utils";
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

export const Route = createFileRoute("/visit/search")({
  loader: async () => {
    const [gamesOutcome, profileOutcome] = await Promise.allSettled([
      listGames({
        data: { filters: { visibility: "public", status: "scheduled" } },
      }),
      getUserProfile(),
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
    if (
      profileOutcome.status === "fulfilled" &&
      profileOutcome.value.success &&
      profileOutcome.value.data
    ) {
      const profile = profileOutcome.value.data;
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

  const availableFilters = useMemo<QuickFilterDefinition[]>(() => {
    if (!playerFilters) {
      return [];
    }

    const normalize = (value: string) => value.trim().toLowerCase();
    const filters: QuickFilterDefinition[] = [];

    if (playerFilters.city) {
      const cityNormalized = normalize(playerFilters.city);
      const countryNormalized = playerFilters.country
        ? normalize(playerFilters.country)
        : null;

      filters.push({
        key: "city",
        label: `In ${playerFilters.city}`,
        predicate: (game) => {
          const address = game.location?.address ?? "";
          const normalizedAddress = normalize(address);
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
        label: "My favorite systems",
        predicate: (game) => {
          const systemId = game.gameSystem?.id;
          return typeof systemId === "number" && favoriteIds.has(systemId);
        },
      });
    }

    if (playerFilters.languages.length > 0) {
      const languages = playerFilters.languages.map(normalize);
      filters.push({
        key: "language",
        label: "In my language",
        predicate: (game) => {
          if (!game.language) {
            return false;
          }
          const language = normalize(game.language);
          return languages.some(
            (preferred) => language.includes(preferred) || preferred.includes(language),
          );
        },
      });
    }

    if (playerFilters.themes.length > 0) {
      const themes = playerFilters.themes.map(normalize);
      filters.push({
        key: "themes",
        label: "My themes",
        predicate: (game) => {
          const categories = (game.gameSystem?.categories ?? []).map(normalize);
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
  }, [playerFilters]);

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

  const showQuickFilters = availableFilters.length > 0;
  const hasGames = games.length > 0;
  const hasFilteredGames = filteredGames.length > 0;

  const toggleFilter = (key: QuickFilterKey) => {
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((filter) => filter !== key) : [...prev, key],
    );
  };

  const clearFilters = () => setActiveFilters([]);

  return (
    <PublicLayout>
      <div className="bg-secondary text-foreground">
        <section className="border-border/60 bg-secondary border-b">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <h1 className="font-heading text-4xl sm:text-5xl">All game sessions</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Plan your next tabletop adventure with public games hosted near you.
              </p>
            </div>
          </div>
        </section>

        {showQuickFilters ? (
          <section className="border-border/60 bg-secondary border-b py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm font-medium">
                  Quick filters:
                </span>
                {availableFilters.map((filter) => {
                  const isActive = activeFilters.includes(filter.key);
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => toggleFilter(filter.key)}
                      className={cn(
                        "border px-3 py-1 text-sm font-medium transition",
                        "rounded-full",
                        isActive
                          ? "border-primary bg-primary/10 text-primary"
                          : "bg-muted/60 text-foreground hover:border-primary/50 border-transparent",
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
                {activeFilters.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-secondary py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {!hasGames ? (
              <div className="border-border/70 bg-card/50 mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl border border-dashed px-8 py-12 text-center">
                <p className="text-muted-foreground text-base font-medium">
                  No public games found right now.
                </p>
                <p className="text-muted-foreground/80 text-sm">
                  Check back later or create an account to host the first session in your
                  area.
                </p>
                <Link
                  to="/auth/signup"
                  className={cn(
                    buttonVariants({ size: "sm", variant: "outline" }),
                    "mt-2 rounded-full",
                  )}
                >
                  Become a host
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-muted-foreground text-sm">
                    Showing
                    <span className="text-foreground ml-1 font-semibold">
                      {filteredGames.length}
                    </span>{" "}
                    {filteredGames.length === 1 ? "session" : "sessions"}
                    {activeFilters.length > 0 ? " with your quick filters" : ""}
                  </p>
                  {activeFilters.length > 0 ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      Clear all
                    </button>
                  ) : null}
                </div>

                {!hasFilteredGames ? (
                  <div className="border-border/70 bg-card/60 mx-auto flex max-w-2xl flex-col items-center gap-3 rounded-3xl border border-dashed px-8 py-12 text-center">
                    <p className="text-muted-foreground text-base font-medium">
                      No sessions match your quick filters yet.
                    </p>
                    <p className="text-muted-foreground/80 text-sm">
                      Try adjusting or clearing filters to browse the full catalogue.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="md:hidden">
                      <List>
                        {filteredGames.map((game) => {
                          const visitLink: GameLinkConfig = {
                            to: "/visit/game/$gameId",
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
                          to: "/visit/game/$gameId",
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
    </PublicLayout>
  );
}
