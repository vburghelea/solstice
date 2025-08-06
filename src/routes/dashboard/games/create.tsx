import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ArrowLeftIcon } from "~/components/ui/icons";
import { GameForm } from "~/features/games/components/GameForm";
import { createGame } from "~/features/games/games.mutations";
import { createGameInputSchema } from "~/features/games/games.schemas";

export const Route = createFileRoute("/dashboard/games/create")({
  component: CreateGamePage,
});

function CreateGamePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const createGameMutation = useMutation({
    mutationFn: createGame,
    onSuccess: (data) => {
      if (data.success) {
        navigate({ to: `/dashboard/games/${data.data?.id}` });
      } else {
        setServerError(data.errors?.[0]?.message || "Failed to create game");
      }
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create game");
    },
  });

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/games">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Games
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create a New Game</CardTitle>
          <CardDescription>
            Set up your game session and start inviting players
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 mb-4 flex items-start gap-3 rounded-lg border p-4">
              <div className="flex-1">
                <p className="font-medium">Error creating game</p>
                <p className="mt-1 text-sm">{serverError}</p>
              </div>
            </div>
          )}

          <GameForm
            onSubmit={async (values) => {
              console.log("Route component onSubmit called with values:", values);
              setServerError(null);

              try {
                console.log("Calling createGameMutation.mutateAsync");
                const result = await createGameMutation.mutateAsync({
                  data: values as z.infer<typeof createGameInputSchema>,
                });
                console.log(
                  "createGameMutation.mutateAsync completed with result:",
                  result,
                );
              } catch (error) {
                console.error("Form submission error:", error);
                setServerError(
                  error instanceof Error ? error.message : "Failed to create game",
                );
              }
            }}
            isSubmitting={createGameMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
