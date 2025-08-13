import { createFileRoute } from "@tanstack/react-router";
import { getGame } from "~/features/games/games.queries";
import { PublicLayout } from "~/features/layouts/public-layout";

export const Route = createFileRoute("/game/$gameId")({
  loader: async ({ params }) => {
    const result = await getGame({ data: { id: params.gameId } });
    if (result.success && result.data) {
      return { gameDetails: result.data };
    } else {
      console.error(
        "Failed to fetch game details:",
        result.success ? "Unknown error" : result.errors,
      );
      // Handle case where game is not found, e.g., redirect or show error
      return { gameDetails: null };
    }
  },
  component: GameDetailPage,
});

function GameDetailPage() {
  const { gameDetails } = Route.useLoaderData();

  if (!gameDetails) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading mb-8 text-4xl">Game Not Found</h1>
          <p className="text-muted-foreground">
            The game you are looking for does not exist or has been removed.
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="font-heading mb-8 text-center text-4xl">{gameDetails.name}</h1>
        <div className="rounded-lg bg-white p-8 text-gray-800 shadow-md">
          {" "}
          {/* Added text-gray-800 */}
          <p className="mb-4 text-lg">{gameDetails.description}</p>
          <p className="text-md mb-2">
            <strong>Location:</strong> {gameDetails.location.address}
          </p>
          <p className="text-md mb-2">
            <strong>Date:</strong> {new Date(gameDetails.dateTime).toLocaleString()}
          </p>
          <p className="text-md mb-2">
            <strong>Game System:</strong> {gameDetails.gameSystem?.name || "N/A"}
          </p>
          <p className="text-md mb-2">
            <strong>Game Master:</strong> {gameDetails.owner?.name || "N/A"}
          </p>
          <p className="text-md mb-2">
            <strong>Players:</strong> {gameDetails.minimumRequirements?.minPlayers || "?"}{" "}
            - {gameDetails.minimumRequirements?.maxPlayers || "?"}
          </p>
          <p className="text-md mb-2">
            <strong>Difficulty:</strong>{" "}
            {gameDetails.minimumRequirements?.languageLevel || "N/A"}
          </p>{" "}
          {/* Using languageLevel as a proxy for difficulty for now */}
          <p className="text-md mb-2">
            <strong>Price:</strong> {gameDetails.price ? `€${gameDetails.price}` : "Free"}
          </p>
          <p className="text-md mb-2">
            <strong>Language:</strong> {gameDetails.language}
          </p>
          <p className="text-md mb-2">
            <strong>Visibility:</strong> {gameDetails.visibility}
          </p>
          {/* Add more details as needed */}
        </div>
      </div>
    </PublicLayout>
  );
}
