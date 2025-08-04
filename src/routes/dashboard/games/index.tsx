import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { GameList } from "~/features/games/components/GameList";
import { listGames } from "~/features/games/games.queries";
import { Button } from "~/shared/ui/button";

export const Route = createFileRoute("/dashboard/games/")({
  component: MyGamesPage,
  loader: async ({ context }) => {
    const result = await listGames({ data: { filters: { ownerId: context.user?.id } } });
    if (!result.success) {
      toast.error("Failed to load your games.");
      return { games: [] };
    }
    return { games: result.data };
  },
});

function MyGamesPage() {
  const { games: initialGames } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  const { data, isLoading, error } = useQuery({
    queryKey: ["myGames", user?.id],
    queryFn: () => listGames({ data: { filters: { ownerId: user?.id } } }),
    initialData: { success: true, data: initialGames },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (error || (data && !data.success)) {
    return (
      <div className="text-destructive text-center">
        <p>
          Error loading games:{" "}
          {error?.message || (!data?.success && data?.errors?.[0]?.message)}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Games</h1>
        <Link to="/dashboard/games/create">
          <Button>Create New Game</Button>
        </Link>
      </div>

      <GameList games={data.data || []} />
    </div>
  );
}
