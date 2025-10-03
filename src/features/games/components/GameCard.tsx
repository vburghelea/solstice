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
import { SafeLink as Link } from "~/components/ui/SafeLink";
import type { gameStatusEnum } from "~/db/schema/games.schema";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { ThumbsScore } from "~/shared/ui/thumbs-score";

type LinkPrimitive = string | number | boolean;

export type GameCardLinkConfig = {
  readonly to: string;
  readonly params?: Record<string, LinkPrimitive>;
  readonly search?: Record<string, LinkPrimitive | undefined>;
  readonly from?: string;
  readonly label?: string;
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
  const formattedDateTime = formatDateAndTime(game.dateTime);

  const canCancel = game.status !== "completed" && game.status !== "canceled";
  const isActionable =
    isOwner && game.status !== "completed" && game.status !== "canceled";

  const resolvedLink: GameCardLinkConfig = {
    to: viewLink?.to ?? "/dashboard/games/$gameId",
    params: viewLink?.params ?? { gameId: game.id },
    from: viewLink?.from ?? "/dashboard/games",
    label: viewLink?.label ?? "View Game",
    ...(viewLink?.search ? { search: viewLink.search } : {}),
  };

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">{game.name}</CardTitle>
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
            <span className="text-muted-foreground">Game System</span>
            <span className="font-medium">{game.gameSystem?.name || "N/A"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Language</span>
            <LanguageTag language={game.language} className="text-[0.7rem]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Players</span>
            <span className="font-medium">
              {game.minimumRequirements?.minPlayers || "?"} -{" "}
              {game.minimumRequirements?.maxPlayers || "?"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Visibility</span>
            {game.visibility === "protected" ? (
              <Badge variant="secondary">Connections &amp; Teammates</Badge>
            ) : (
              <span className="font-medium capitalize">{game.visibility}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Participants</span>
            <span className="font-medium">{game.participantCount}</span>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link
              to={resolvedLink.to}
              {...(resolvedLink.params ? { params: resolvedLink.params } : {})}
              {...(resolvedLink.search ? { search: resolvedLink.search } : {})}
              {...(resolvedLink.from ? { from: resolvedLink.from } : {})}
            >
              {resolvedLink.label ?? "View Game"}
            </Link>
          </Button>
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
                Mark Completed
              </Button>
            )}
            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="flex-2"
                onClick={() => {
                  if (window.confirm("Are you sure you want to cancel this session?")) {
                    onUpdateStatus({ data: { gameId: game.id, status: "canceled" } });
                  }
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel Session
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
