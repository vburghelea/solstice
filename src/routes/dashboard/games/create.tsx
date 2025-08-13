import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getCampaign } from "~/features/campaigns/campaigns.queries";
import { GameForm } from "~/features/games/components/GameForm";
import { createGame } from "~/features/games/games.mutations";
import { getGameSystem } from "~/features/games/games.queries";
import {
  createGameInputSchema,
  gameFormSchema,
  updateGameInputSchema,
} from "~/features/games/games.schemas";

const createGameSearchSchema = z.object({
  campaignId: z.string().optional(),
});

export const Route = createFileRoute("/dashboard/games/create")({
  component: CreateGamePage,
  validateSearch: (search) => createGameSearchSchema.parse(search),
});

export function CreateGamePage() {
  const navigate = useNavigate();
  const { campaignId } = useSearch({ from: Route.id });
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    data: campaignData,
    isPending: isCampaignDataPending,
    isSuccess: isCampaignDataSuccess,
  } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: () => getCampaign({ data: { id: campaignId! } }),
    enabled: !!campaignId,
  });

  const gameSystemId =
    campaignData &&
    campaignData.success &&
    campaignData.data &&
    campaignData.data.gameSystemId
      ? campaignData.data.gameSystemId
      : undefined;

  const { data: gameSystemData, isSuccess: isGameSystemDataSuccess } = useQuery({
    queryKey: ["gameSystem", gameSystemId],
    queryFn: () => getGameSystem({ data: { id: gameSystemId! } }),
    enabled: !!gameSystemId,
  });

  // Create a key that changes when all data is loaded
  const formKey = useMemo(() => {
    if (!campaignId) {
      return "no-campaign";
    }

    if (
      isCampaignDataSuccess &&
      campaignData?.success &&
      campaignData.data &&
      (!gameSystemId || (gameSystemId && isGameSystemDataSuccess))
    ) {
      return `all-data-loaded-${campaignId}`;
    }

    return `data-loading-${campaignId}`;
  }, [
    campaignId,
    isCampaignDataSuccess,
    campaignData,
    gameSystemId,
    isGameSystemDataSuccess,
  ]);

  const initialValues = useMemo<Partial<z.infer<typeof gameFormSchema>>>(() => {
    if (!campaignId) {
      return {};
    }

    if (isCampaignDataSuccess && campaignData?.success && campaignData.data) {
      const campaign = campaignData.data;
      // Type assertion to tell TypeScript that campaign is not null
      const gameSystem =
        gameSystemData?.success && gameSystemData.data ? gameSystemData.data : null;

      return {
        gameSystemId: (campaign as NonNullable<typeof campaign>).gameSystemId,
        expectedDuration:
          (campaign as NonNullable<typeof campaign>).sessionDuration ??
          (gameSystem && gameSystem.averagePlayTime !== null
            ? gameSystem.averagePlayTime
            : undefined),
        price: (campaign as NonNullable<typeof campaign>).pricePerSession ?? undefined,
        language: (campaign as NonNullable<typeof campaign>).language,
        location: (campaign as NonNullable<typeof campaign>).location,
        minimumRequirements: {
          minPlayers:
            (campaign as NonNullable<typeof campaign>).minimumRequirements?.minPlayers ??
            (gameSystem && gameSystem.minPlayers !== null
              ? gameSystem.minPlayers
              : undefined),
          maxPlayers:
            (campaign as NonNullable<typeof campaign>).minimumRequirements?.maxPlayers ??
            (gameSystem && gameSystem.maxPlayers !== null
              ? gameSystem.maxPlayers
              : undefined),
          languageLevel: (campaign as NonNullable<typeof campaign>).minimumRequirements
            ?.languageLevel,
          playerRadiusKm: (campaign as NonNullable<typeof campaign>).minimumRequirements
            ?.playerRadiusKm,
        },
        visibility: (campaign as NonNullable<typeof campaign>).visibility,
        safetyRules: (campaign as NonNullable<typeof campaign>).safetyRules,
      };
    }

    // Return empty object while data is loading
    return {};
  }, [isCampaignDataSuccess, campaignData, campaignId, gameSystemData]);

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

          {campaignId && isCampaignDataPending ? (
            <div className="text-muted-foreground mb-4 text-center">
              Loading campaign data...
            </div>
          ) : (
            <>
              {campaignId &&
                isCampaignDataSuccess &&
                campaignData?.success &&
                campaignData.data && (
                  <div className="mb-4">
                    <label htmlFor="campaign">Campaign</label>
                    <Select value={campaignId} disabled>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={campaignId}>
                          {campaignData.data.name}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

              <GameForm
                key={formKey} // Add key to force re-mount when all data is loaded
                onSubmit={async (values) => {
                  setServerError(null);

                  try {
                    await createGameMutation.mutateAsync({
                      data: {
                        ...values,
                        campaignId,
                      } as z.infer<typeof createGameInputSchema>,
                    });
                  } catch (error) {
                    console.error("Form submission error:", error);
                    setServerError(
                      error instanceof Error ? error.message : "Failed to create game",
                    );
                  }
                }}
                isSubmitting={createGameMutation.isPending}
                initialValues={
                  initialValues as Partial<z.infer<typeof updateGameInputSchema>>
                }
                isCampaignGame={!!campaignId}
                gameSystemName={
                  isGameSystemDataSuccess && gameSystemData?.data
                    ? gameSystemData.data.name
                    : ""
                }
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
