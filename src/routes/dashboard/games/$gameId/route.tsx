import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { getGame } from "~/features/games/games.queries";

export const Route = createFileRoute("/dashboard/games/$gameId")({
  loader: async ({ params }) => {
    const result = await getGame({ data: { id: params.gameId } });
    if (!result.success || !result.data) {
      toast.error("Failed to load game details.");
      throw new Error("Game not found");
    }
    return { game: result.data };
  },
  component: () => (
    <div className="flex gap-2 p-2">
      {/* This is a layout route for individual game management */}
    </div>
  ),
});
