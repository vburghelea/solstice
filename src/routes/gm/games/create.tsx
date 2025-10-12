import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
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
import { SafeLink as Link } from "~/components/ui/SafeLink";
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

export const createGameSearchSchema = z.object({
  campaignId: z.string().optional(),
});

export const Route = createFileRoute("/gm/games/create")({
  component: CreateGamePage,
  validateSearch: (search) => createGameSearchSchema.parse(search),
});

type GameCreateViewProps = {
  readonly basePath: string;
  readonly backLinkTo?: string;
  readonly tips?: ReactNode;
  readonly campaignId?: string | undefined;
};

export function GameCreateView({
  basePath,
  backLinkTo,
  tips,
  campaignId,
}: GameCreateViewProps) {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (campaignId) {
      queryClient.invalidateQueries({ queryKey: ["campaign", campaignId] });
    }
  }, [campaignId, queryClient]);

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
        },
        visibility: campaign.visibility,
        safetyRules: campaign.safetyRules,
      };
    }

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
        void navigate({ to: `${basePath}/${data.data?.id}` } as never);
      } else {
        setServerError(data.errors?.[0]?.message || "Failed to create game");
      }
    },
    onError: (error) => {
      setServerError(error.message || "Failed to create game");
    },
  });

  return (
    <div className="space-y-6">
      {backLinkTo ? (
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to={backLinkTo}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Games
            </Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-[minmax(0,2fr)_minmax(0,20rem)]">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">Create a New Game</CardTitle>
            <CardDescription>
              Set up your game session and start inviting players
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {serverError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 flex items-start gap-3 rounded-lg border p-4">
                <div className="flex-1">
                  <p className="font-medium">Error creating game</p>
                  <p className="mt-1 text-sm">{serverError}</p>
                </div>
              </div>
            )}

            {campaignId && isCampaignDataPending ? (
              <div className="text-muted-foreground text-center">
                Loading campaign data...
              </div>
            ) : (
              <>
                {campaignId && isCampaignDataSuccess && campaignData?.success && (
                  <div className="border-border/60 bg-muted/30 grid gap-2 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-foreground text-sm font-medium">
                        Campaign
                      </span>
                      <span className="text-muted-foreground text-xs tracking-wide uppercase">
                        Context synced
                      </span>
                    </div>
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
                          error instanceof Error
                            ? error.message
                            : "Failed to create game",
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
                    onCancelEdit={() => navigate({ to: basePath } as never)}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {tips ?? null}
      </div>
    </div>
  );
}

export function GameSessionTipsCard() {
  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>Session checklist</CardTitle>
        <CardDescription>
          Keep these cues in mind while finalizing the session briefing.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-4 text-sm">
        <div>
          <p className="text-foreground font-medium">Logistics first</p>
          <p className="mt-1">
            Confirm the time, duration, and player count so the platform can surface the
            session to the right players.
          </p>
        </div>
        <div>
          <p className="text-foreground font-medium">Safety tooling</p>
          <p className="mt-1">
            Use the safety section to document the consent workflow you use at the table
            and any boundaries already discussed with the group.
          </p>
        </div>
        <div>
          <p className="text-foreground font-medium">Campaign context</p>
          <p className="mt-1">
            When spinning a session out of an existing campaign, we reuse the system
            defaults to keep onboarding fast. Adjust anything that’s special for this run.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateGamePage() {
  const { campaignId } = useSearch({ from: Route.id });
  return (
    <GameCreateView
      basePath="/gm/games"
      backLinkTo="/gm/games"
      tips={<GameSessionTipsCard />}
      campaignId={campaignId}
    />
  );
}
