import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { ArrowLeftIcon } from "~/components/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { getCampaign } from "~/features/campaigns/campaigns.queries";
import type { CampaignWithDetails } from "~/features/campaigns/campaigns.types";
import { GameForm } from "~/features/games/components/GameForm";
import {
  createGame,
  createGameSessionForCampaign,
} from "~/features/games/games.mutations";
import {
  createGameInputSchema,
  gameFormSchema,
  updateGameInputSchema,
} from "~/features/games/games.schemas";
import type { GameWithDetails } from "~/features/games/games.types";
import type { OperationResult } from "~/shared/types/common";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/shared/ui/card";

const createGameSearchSchema = z.object({
  campaignId: z.string().optional(),
});

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
  const queryClient = useQueryClient();

  const {
    data: campaignData,
    isPending: isCampaignDataPending,
    isSuccess: isCampaignDataSuccess,
  } = useQuery<OperationResult<CampaignWithDetails | null>>({
    queryKey: ["campaign", campaignId],
    queryFn: () => getCampaign({ data: { id: campaignId! } }),
    enabled: !!campaignId,
    refetchOnMount: "always",
  });

  // Proactively refresh possible stale/empty cache when arriving via navigation
  useEffect(() => {
    if (campaignId) {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
    }
  }, [campaignId, queryClient]);

  // Create a key that changes when all data is loaded
  const formKey = useMemo(() => {
    if (!campaignId) return "no-campaign";
    if (isCampaignDataSuccess && campaignData?.success && campaignData.data) {
      return `loaded-${campaignId}`;
    }
    return `loading-${campaignId}`;
  }, [campaignId, isCampaignDataSuccess, campaignData]);

  const initialValues = useMemo<Partial<z.infer<typeof gameFormSchema>>>(() => {
    if (!campaignId) {
      return {};
    }

    if (isCampaignDataSuccess && campaignData?.success && campaignData.data) {
      const campaign = campaignData.data;
      const gameSystem = campaign.gameSystem ?? null;

      return {
        gameSystemId: campaign.gameSystemId,
        expectedDuration:
          campaign.sessionDuration ??
          (gameSystem && gameSystem.averagePlayTime !== null
            ? gameSystem.averagePlayTime
            : undefined),
        price: campaign.pricePerSession ?? undefined,
        language: campaign.language,
        location: campaign.location,
        minimumRequirements: {
          minPlayers:
            campaign.minimumRequirements?.minPlayers ??
            (gameSystem && gameSystem.minPlayers !== null
              ? gameSystem.minPlayers
              : undefined),
          maxPlayers:
            campaign.minimumRequirements?.maxPlayers ??
            (gameSystem && gameSystem.maxPlayers !== null
              ? gameSystem.maxPlayers
              : undefined),
          languageLevel: campaign.minimumRequirements?.languageLevel,
          playerRadiusKm: campaign.minimumRequirements?.playerRadiusKm,
        },
        visibility: campaign.visibility,
        safetyRules: campaign.safetyRules,
      };
    }

    // Return empty object while data is loading
    return {};
  }, [isCampaignDataSuccess, campaignData, campaignId]);

  const createGameMutation = useMutation<
    OperationResult<GameWithDetails>,
    Error,
    { data: z.infer<typeof createGameInputSchema> }
  >({
    mutationFn: async (args) => {
      if (campaignId) {
        return await createGameSessionForCampaign({
          data: args.data as z.infer<typeof createGameInputSchema>,
        });
      }
      return await createGame({ data: args.data });
    },
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

  const initialValues =
    campaignData?.success && campaignData.data
      ? {
          gameSystemId: campaignData.data.gameSystemId,
          expectedDuration: campaignData.data.sessionDuration,
          visibility: campaignData.data.visibility,
          language: campaignData.data.language,
          price: campaignData.data.pricePerSession ?? undefined,
          minimumRequirements: campaignData.data.minimumRequirements,
          safetyRules: campaignData.data.safetyRules,
        }
      : {};

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
          <CardTitle className="text-foreground">Create a New Game</CardTitle>
          <CardDescription>
            Set up your game session and start inviting players
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaignId && campaignData?.success && campaignData.data && (
            <div className="mb-4">
              <label htmlFor="campaign">Campaign</label>
              <Select value={campaignId} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={campaignId}>{campaignData.data.name}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

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
              {campaignId && isCampaignDataSuccess && campaignData?.success && (
                <div className="mb-4">
                  <label htmlFor="campaign">Campaign</label>
                  <Select value={campaignId} disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignData.data && (
                        <SelectItem value={campaignId}>
                          {campaignData.data.name}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Only render the form when campaign context is ready or when not creating from a campaign */}
              {(!campaignId ||
                (isCampaignDataSuccess &&
                  campaignData?.success &&
                  campaignData.data)) && (
                <GameForm
                  key={formKey}
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
                    isCampaignDataSuccess && campaignData?.success && campaignData.data
                      ? campaignData.data.gameSystem?.name || ""
                      : ""
                  }
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
