import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { GameForm } from "~/features/games/components/GameForm";
import { createGame } from "~/features/games/games.mutations";
import { createGameInputSchema } from "~/features/games/games.schemas";

export const Route = createFileRoute("/dashboard/games/create")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const navigate = useNavigate();

  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Game created successfully!");
        navigate({ to: `/dashboard/games/${data.data?.id}` });
      } else {
        toast.error(`Failed to create game: ${data.errors?.[0]?.message}`);
      }
    },
    onError: (error) => {
      toast.error(`Failed to create game: ${error.message}`);
    },
  });

  if (createGameMutation.isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Create New Game</h1>
      <GameForm
        onSubmit={async (values) => {
          await createGameMutation.mutateAsync({
            data: values as z.infer<typeof createGameInputSchema>,
          });
        }}
        isSubmitting={createGameMutation.isPending}
      />
    </div>
  );
}
