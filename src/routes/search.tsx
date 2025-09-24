import { createFileRoute, Link } from "@tanstack/react-router";
import { GameListItemView } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { cn } from "~/shared/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/search")({
  loader: async () => {
    // Fetch public games from the backend
    const result = await listGames({
      data: { filters: { visibility: "public", status: "scheduled" } },
    });
    if (result.success) {
      return { games: result.data };
    } else {
      console.error("Failed to fetch games:", result.errors);
      return { games: [] }; // Return empty array on error
    }
  },
  component: SearchPage,
});

function SearchPage() {
  const { games } = Route.useLoaderData();

  return (
    <PublicLayout>
      <div className="bg-background text-foreground">
        <section className="border-border/60 bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-12 sm:py-16">
            <div className="mx-auto max-w-2xl space-y-3 text-center">
              <h1 className="font-heading text-4xl sm:text-5xl">All game sessions</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Plan your next tabletop adventure with public games hosted near you.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4">
            {games.length === 0 ? (
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
                <div className="md:hidden">
                  <List>
                    {games.map((game: GameListItem) => (
                      <GameListItemView key={game.id} game={game} />
                    ))}
                  </List>
                </div>

                <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
                  {games.map((game: GameListItem) => (
                    <article
                      key={game.id}
                      className="border-border/70 bg-card/80 hover:border-primary/50 flex h-full flex-col justify-between gap-4 rounded-3xl border p-6 shadow-sm transition"
                    >
                      <div className="space-y-3">
                        <h2 className="text-xl font-semibold">{game.name}</h2>
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
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
