import { Calendar, CheckCircle, XCircle } from "lucide-react";
import { LanguageTag } from "~/components/LanguageTag";
import { ProfileLink } from "~/components/ProfileLink";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { RoleBadge } from "~/components/ui/RoleBadge";
import type { gameStatusEnum } from "~/db/schema/games.schema";
import type { GameListItem } from "~/features/games/games.types";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

type LinkPrimitive = string | number | boolean;

export type GameCardLinkConfig = {
  readonly to: string;
  readonly params?: Record<string, LinkPrimitive>;
  readonly search?: Record<string, LinkPrimitive>;
  readonly from?: string;
  readonly label?: string;
  readonly translationKey?: string;
  readonly translationNamespace?: string;
};

interface GameCardProps {
  readonly game: GameListItem;
  readonly isOwner?: boolean;
  readonly onUpdateStatus?: (variables: {
    data: { gameId: string; status: (typeof gameStatusEnum.enumValues)[number] };
  }) => void;
  readonly viewLink?: GameCardLinkConfig;
}

export function GameCard({
  game,
  isOwner = false,
  onUpdateStatus,
  viewLink,
}: GameCardProps) {
  const { t } = useGamesTranslation();
  const formattedDateTime = formatDateAndTime(game.dateTime);

  const canCancel = game.status !== "completed" && game.status !== "canceled";
  const isActionable =
    isOwner && game.status !== "completed" && game.status !== "canceled";

  const resolvedLink: GameCardLinkConfig = {
    to: viewLink?.to ?? "/player/games/$gameId",
    params: viewLink?.params ?? { gameId: game.id },
    ...(viewLink?.from ? { from: viewLink.from } : {}),
    ...(viewLink?.label ? { label: viewLink.label } : {}),
    translationKey: viewLink?.translationKey ?? "links.game_management.view_game_details",
    translationNamespace: viewLink?.translationNamespace ?? "navigation",
    ...(viewLink?.search
      ? {
          search: Object.fromEntries(
            Object.entries(viewLink.search).filter(([, value]) => value !== undefined),
          ) as Record<string, LinkPrimitive>,
        }
      : {}),
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex-1 text-xl">{game.name}</CardTitle>
          {game.userRole && (
            <RoleBadge
              role={game.userRole.role}
              {...(game.userRole.status ? { status: game.userRole.status } : {})}
              className="shrink-0"
            />
          )}
        </div>
        <div className="text-muted-foreground mt-1 flex items-center text-sm">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{formattedDateTime}</span>
        </div>
        {game.description && (
          <CardDescription className="mt-2 line-clamp-2">
            {game.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {game.owner && (
            <div className="flex items-center gap-2">
              <Avatar
                name={game.owner.name}
                email={game.owner.email}
                srcUploaded={game.owner.uploadedAvatarPath ?? null}
                srcProvider={game.owner.image ?? null}
                userId={game.owner.id}
                className="h-6 w-6"
              />
              <ProfileLink
                userId={game.owner.id}
                username={game.owner.name || game.owner.email}
                className="font-medium"
              />
              <span className="text-muted-foreground">•</span>
              <ThumbsScore value={game.owner.gmRating ?? null} />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.game_system")}</span>
            <span className="font-medium">
              {game.gameSystem?.name || t("status.not_available")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.language")}</span>
            <LanguageTag language={game.language} className="text-[0.7rem]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.players")}</span>
            <span className="font-medium">
              {game.minimumRequirements?.minPlayers || "?"} -{" "}
              {game.minimumRequirements?.maxPlayers || "?"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.visibility")}</span>
            {game.visibility === "protected" ? (
              <Badge variant="secondary">{t("status.connections_teammates")}</Badge>
            ) : (
              <span className="font-medium capitalize">{game.visibility}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("labels.participants")}</span>
            <span className="font-medium">{game.participantCount}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <LocalizedButtonLink
            to={resolvedLink.to}
            params={resolvedLink.params}
            search={resolvedLink.search}
            translationKey={resolvedLink.translationKey}
            translationNamespace={resolvedLink.translationNamespace}
            {...(resolvedLink.label ? { fallbackText: resolvedLink.label } : {})}
            variant="outline"
            size="sm"
            className="flex-1"
          />
        </div>
      </CardContent>
      {isActionable && onUpdateStatus && (
        <div className="p-4 pt-0">
          <div className="flex flex-col gap-2">
            {game.status !== "completed" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-2"
                onClick={() =>
                  onUpdateStatus({ data: { gameId: game.id, status: "completed" } })
                }
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("buttons.mark_completed")}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-2"
                onClick={() => {
                  if (window.confirm(t("confirmation.cancel_session"))) {
                    onUpdateStatus({ data: { gameId: game.id, status: "canceled" } });
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {t("buttons.cancel_session")}
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
