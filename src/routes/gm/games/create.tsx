import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
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
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
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
  const { t } = useGamesTranslation();
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
        // Convert errors to JSON string for GameForm to parse
        if (data.errors && data.errors.length > 0) {
          setServerError(JSON.stringify(data.errors));
        } else {
          setServerError(t("create.failed_to_create_game"));
        }
      }
    },
    onError: (error) => {
      setServerError(error.message || t("create.failed_to_create_game"));
    },
  });

  return (
    <div className="space-y-6">
      {backLinkTo ? (
        <div className="flex items-center justify-between">
          <LocalizedButtonLink
            to={backLinkTo}
            translationKey="links.navigation.back_to_games"
            translationNamespace="navigation"
            variant="ghost"
            size="sm"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            {t("my_games.create.back_to_games")}
          </LocalizedButtonLink>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] xl:grid-cols-[minmax(0,2fr)_minmax(0,20rem)]">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">
              {t("my_games.create.title")}
            </CardTitle>
            <CardDescription>{t("my_games.create.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {campaignId && isCampaignDataPending ? (
              <div className="text-muted-foreground text-center">
                {t("my_games.create.loading_campaign_data")}
              </div>
            ) : (
              <>
                {campaignId && isCampaignDataSuccess && campaignData?.success && (
                  <div className="border-border/60 bg-muted/30 grid gap-2 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-foreground text-sm font-medium">
                        {t("my_games.create.campaign")}
                      </span>
                      <span className="text-muted-foreground text-xs tracking-wide uppercase">
                        {t("my_games.create.context_synced")}
                      </span>
                    </div>
                    <Select value={campaignId} disabled>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t("my_games.create.select_a_campaign")}
                        />
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
                            : t("my_games.create.failed_to_create_game"),
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
                    serverErrors={serverError}
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
  const { t } = useGamesTranslation();

  return (
    <Card className="md:col-span-1">
      <CardHeader>
        <CardTitle>{t("my_games.create.tips.title")}</CardTitle>
        <CardDescription>{t("my_games.create.tips.subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-4 text-sm">
        <div>
          <p className="text-foreground font-medium">
            {t("my_games.create.tips.logistics_first.title")}
          </p>
          <p className="mt-1">{t("my_games.create.tips.logistics_first.description")}</p>
        </div>
        <div>
          <p className="text-foreground font-medium">
            {t("my_games.create.tips.safety_tooling.title")}
          </p>
          <p className="mt-1">{t("my_games.create.tips.safety_tooling.description")}</p>
        </div>
        <div>
          <p className="text-foreground font-medium">
            {t("my_games.create.tips.campaign_context.title")}
          </p>
          <p className="mt-1">{t("my_games.create.tips.campaign_context.description")}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateGamePage() {
  const { campaignId } = Route.useSearch();
  return (
    <GameCreateView
      basePath="/gm/games"
      backLinkTo="/gm/games"
      tips={<GameSessionTipsCard />}
      campaignId={campaignId}
    />
  );
}
