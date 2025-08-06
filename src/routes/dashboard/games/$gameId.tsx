import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Edit2, LoaderCircle, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormSubmitButton } from "~/components/form-fields/FormSubmitButton";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { GameForm } from "~/features/games/components/GameForm";
import { InviteParticipants } from "~/features/games/components/InviteParticipants";
import { ManageApplications } from "~/features/games/components/ManageApplications";
import { updateGame } from "~/features/games/games.mutations";
import { getGame, getGameApplications } from "~/features/games/games.queries";
import type { GameWithDetails } from "~/features/games/games.types";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/dashboard/games/$gameId")({
  loader: async ({ params }) => {
    if (!UUID_REGEX.test(params.gameId)) {
      toast.error("Invalid game ID format.");
      throw new Error("Invalid game ID");
    }

    const result = await getGame({ data: { id: params.gameId } });
    if (!result.success || !result.data) {
      toast.error("Failed to load game details.");
      throw new Error("Game not found");
    }
    return { game: result.data };
  },
  component: GameDetailsPage,
});

function GameDetailsView({ game }: { game: GameWithDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{game.name}</CardTitle>
        <CardDescription>{game.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Game System</p>
            <p>{game.gameSystem.name}</p>
          </div>
          <div>
            <p className="font-semibold">Date & Time</p>
            <p>{new Date(game.dateTime).toLocaleString()}</p>
          </div>
          <div>
            <p className="font-semibold">Expected Duration</p>
            <p>{game.expectedDuration} minutes</p>
          </div>
          <div>
            <p className="font-semibold">Price</p>
            <p>{game.price ? `€${game.price}` : "Free"}</p>
          </div>
          <div>
            <p className="font-semibold">Language</p>
            <p>{game.language}</p>
          </div>
          <div>
            <p className="font-semibold">Visibility</p>
            <p>{game.visibility}</p>
          </div>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Location</p>
          <p>{game.location.address}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Minimum Requirements</p>
          <p>
            Players: {game.minimumRequirements?.minPlayers} -{" "}
            {game.minimumRequirements?.maxPlayers}
          </p>
          <p>Language Level: {game.minimumRequirements?.languageLevel}</p>
        </div>
        <Separator />
        <div>
          <p className="font-semibold">Safety Rules</p>
          <ul>
            {game.safetyRules &&
              Object.entries(game.safetyRules).map(
                ([rule, enabled]) =>
                  enabled && <li key={rule}>{rule.replace(/-/g, " ")}</li>,
              )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function GameDetailsPage() {
  const initialData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const { gameId } = Route.useParams();

  const [isEditing, setIsEditing] = useState(false);

  const { data: gameResult, isLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => getGame({ data: { id: gameId } }),
    initialData: { success: true, data: initialData.game },
  });

  const game = gameResult?.success ? gameResult.data : null;

  const updateGameMutation = useMutation({
    mutationFn: updateGame,
    onSuccess: async (data) => {
      if (data.success) {
        toast.success("Game updated successfully");
        await queryClient.invalidateQueries({ queryKey: ["game", gameId] });
        setIsEditing(false);
      } else {
        toast.error(data.errors?.[0]?.message || "Failed to update game");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred");
    },
  });

  const { data: applicationsData, isLoading: isLoadingApplications } = useQuery({
    queryKey: ["gameApplications", gameId],
    queryFn: () => getGameApplications({ data: { id: gameId } }),
  });

  if (isLoading || isLoadingApplications) {
    return <LoaderCircle className="mx-auto h-8 w-8 animate-spin" />;
  }

  if (!game) {
    return <div>Game not found</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Game Details</CardTitle>
              <CardDescription>
                View and manage the details of this game session.
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Game
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <FormSubmitButton
                  isSubmitting={updateGameMutation.isPending}
                  onClick={() => {}}
                  size="sm"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </FormSubmitButton>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <GameForm
              initialValues={{
                ...game,
                price: game.price ?? undefined,
                minimumRequirements: game.minimumRequirements ?? undefined,
                safetyRules: game.safetyRules ?? undefined,
                dateTime: new Date(game.dateTime).toISOString().slice(0, 16),
              }}
              onSubmit={async (values) => {
                await updateGameMutation.mutateAsync({ data: { ...values, id: gameId } });
              }}
              isSubmitting={updateGameMutation.isPending}
            />
          ) : (
            <GameDetailsView game={game} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <InviteParticipants
          gameId={gameId}
          currentParticipants={game.participants || []}
        />
        <ManageApplications
          gameId={gameId}
          applications={applicationsData?.success ? applicationsData.data : []}
        />
      </div>
    </div>
  );
}
