import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { GameForm } from "~/features/games/components/GameForm";
import { InviteParticipants } from "~/features/games/components/InviteParticipants";
import { ManageApplications } from "~/features/games/components/ManageApplications";
import { updateGame } from "~/features/games/games.mutations";
import { getGameApplications } from "~/features/games/games.queries";
import { updateGameInputSchema } from "~/features/games/games.schemas";
import { GameWithDetails } from "~/features/games/games.types";

export const Route = createFileRoute("/dashboard/games/$gameId/")({
  component: GameDetailsPage,
});

function GameDetailsPage() {
  const loaderData = Route.useLoaderData() as { game: GameWithDetails };
  const initialGame = loaderData?.game;
  const { gameId } = Route.useParams();

  const updateGameMutation = useMutation({
    mutationFn: updateGame,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Game updated successfully!");
      } else {
        toast.error(`Failed to update game: ${data.errors?.[0]?.message}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to update game: ${error.message}`);
    },
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["gameApplications", gameId],
    queryFn: () => getGameApplications({ data: { id: gameId } }),
  });

  if (!initialGame || updateGameMutation.isPending || isLoadingApplications) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-4">
      <h1 className="text-3xl font-bold">
        Manage Game: {initialGame?.gameSystem?.name || ""}
      </h1>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Game Details</h2>
        <GameForm
          initialValues={{
            ...initialGame,
            dateTime: initialGame.dateTime.toISOString().slice(0, 16),
            price: initialGame.price ?? undefined,
            minimumRequirements: initialGame.minimumRequirements ?? undefined,
            safetyRules: initialGame.safetyRules ?? undefined,
          }}
          onSubmit={async (values) => {
            await updateGameMutation.mutateAsync({
              data: values as z.infer<typeof updateGameInputSchema>,
            });
          }}
          isSubmitting={updateGameMutation.isPending}
        />
      </section>

      <section className="space-y-4">
        <InviteParticipants
          gameId={gameId}
          currentParticipants={initialGame.participants || []}
        />
      </section>

      <section className="space-y-4">
        <ManageApplications
          gameId={gameId}
          applications={applicationsData?.success ? applicationsData.data : []}
        />
      </section>
    </div>
  );
}
