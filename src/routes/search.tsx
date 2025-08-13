import { createFileRoute } from "@tanstack/react-router";
import { listGames } from "~/features/games/games.queries";
import { GameListItem } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";

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
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {games.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center">
              No public games found.
            </p>
          ) : (
            games.map(
              (
                game: GameListItem, // Use GameListItem type
              ) => (
                <div
                  key={game.id}
                  className="rounded-lg bg-white p-6 text-left shadow-md"
                >
                  <h3 className="mb-2 text-xl font-semibold">{game.name}</h3>
                  <p className="text-muted-foreground mb-4">{game.description}</p>
                  <p className="text-sm text-gray-600">📍 {game.location.address}</p>
                  <p className="text-sm text-gray-600">
                    🗓️ {new Date(game.dateTime).toLocaleString()}
                  </p>
                  <a
                    href={`/game/${game.id}`}
                    className="mt-4 inline-block text-blue-600 hover:underline"
                  >
                    View Details
                  </a>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
