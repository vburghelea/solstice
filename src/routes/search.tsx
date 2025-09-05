import { createFileRoute, Link } from "@tanstack/react-router";
import { GameListItemView } from "~/features/games/components/GameListItemView";
import { listGames } from "~/features/games/games.queries";
import type { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { List } from "~/shared/ui/list";

export const Route = createFileRoute("/search")({
  loader: async () => {
    // Fetch public games from the backend
    const result = await listGames({ data: { filters: { visibility: "public" } } });
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
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading mb-8 text-center text-4xl">All Game Sessions</h1>

        {games.length === 0 ? (
          <p className="text-muted-foreground text-center">No public games found.</p>
        ) : (
          <>
            {/* Mobile: dense list */}
            <div className="md:hidden">
              <List>
                {games.map((game: GameListItem) => (
                  <GameListItemView key={game.id} game={game} />
                ))}
              </List>
            </div>

            {/* Desktop: simple cards */}
            <div className="hidden grid-cols-2 gap-6 md:grid lg:grid-cols-3">
              {games.map((game: GameListItem) => (
                <div key={game.id} className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-2 text-xl font-semibold text-gray-900">
                    {game.name}
                  </div>
                  {game.description ? (
                    <div className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                      {game.description}
                    </div>
                  ) : null}
                  <div className="mt-1 text-sm text-gray-600">
                    📍 {game.location.address}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    🗓️ {new Date(game.dateTime).toLocaleString()}
                  </div>
                  <Link
                    to="/game/$gameId"
                    params={{ gameId: game.id }}
                    className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  );
}
