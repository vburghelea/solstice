import {
  Calendar,
  ChevronRight,
  Clock,
  Globe2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { LanguageTag } from "~/components/LanguageTag";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SafeLink as Link } from "~/components/ui/SafeLink";
import type { GameListItem } from "~/features/games/games.types";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { buildPlayersRange, formatExpectedDuration } from "~/shared/lib/game-formatting";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

type MetaIcon = ComponentType<{ className?: string }>;

interface GameListItemViewProps {
  game: GameListItem;
}

export function GameListItemView({ game }: GameListItemViewProps) {
  return (
    <List.Item className="px-0 py-0 sm:px-0">
      <GameShowcaseCard game={game} layout="list" />
    </List.Item>
  );
}

interface GameShowcaseCardProps {
  game: GameListItem;
  layout?: "grid" | "list";
  className?: string;
}

export function GameShowcaseCard({
  game,
  layout = "grid",
  className,
}: GameShowcaseCardProps) {
  const formattedDate = formatDateAndTime(game.dateTime);
  const price = game.price ? `€${game.price.toFixed(2)}` : "Free";
  const heroUrl = game.heroImageUrl;
  const categories = (game.gameSystem?.categories ?? []).filter(Boolean).slice(0, 3);

  const minPlayers =
    game.minimumRequirements?.minPlayers ?? game.gameSystem?.minPlayers ?? null;
  const maxPlayers =
    game.minimumRequirements?.maxPlayers ?? game.gameSystem?.maxPlayers ?? null;

  const playersLabelParts: string[] = [];
  if (typeof game.participantCount === "number") {
    playersLabelParts.push(`${game.participantCount} joined`);
  }
  const playersRange = buildPlayersRange(minPlayers, maxPlayers, { fallback: null });
  if (playersRange) {
    playersLabelParts.push(playersRange);
  }
  const playersLabel = playersLabelParts.join(" • ");

  const expectedDuration = formatExpectedDuration(game.expectedDuration);
  const durationLabel = expectedDuration
    ? `${expectedDuration} session`
    : formatSystemDuration(game.gameSystem?.averagePlayTime ?? null);

  const metaItems: Array<{ icon: MetaIcon; label: ReactNode }> = [];

  const addMeta = (icon: MetaIcon, label: ReactNode) => {
    if (label == null) return;
    if (typeof label === "string" && label.trim().length === 0) return;
    metaItems.push({ icon, label });
  };

  addMeta(Calendar as MetaIcon, formattedDate);
  addMeta(MapPin as MetaIcon, game.location?.address ?? null);
  addMeta(Users as MetaIcon, playersLabel || null);
  addMeta(Clock as MetaIcon, durationLabel);

  const languageTag = <LanguageTag language={game.language} className="text-[0.65rem]" />;
  addMeta(Globe2 as MetaIcon, languageTag);

  return (
    <article
      className={cn(
        "border-border/60 bg-card hover:border-primary/60 relative flex h-full flex-col overflow-hidden rounded-3xl border shadow-sm transition-colors hover:shadow-md",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          layout === "list" ? "aspect-[16/9]" : "aspect-[4/3] sm:aspect-video",
        )}
      >
        {heroUrl ? (
          <img
            src={heroUrl}
            alt={`${game.gameSystem?.name ?? game.name} hero artwork`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(146,102,204,0.55),_rgba(19,18,30,0.95))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4">
          <Badge className="bg-white/20 text-xs font-semibold tracking-wide text-white uppercase">
            {game.gameSystem?.name ?? "Original system"}
          </Badge>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant="secondary"
                  className="bg-white/15 text-[0.65rem] font-medium text-white"
                >
                  {category}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-foreground text-lg font-semibold sm:text-xl">
                <Link
                  to="/game/$gameId"
                  params={{ gameId: game.id }}
                  className="flex items-center"
                >
                  {game.name}
                </Link>
              </h3>
              {game.description ? (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm">
                  {game.description}
                </p>
              ) : null}
            </div>
            <Badge variant="outline" className="shrink-0 text-xs font-medium">
              {price}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {metaItems.map((item) => {
            const Icon = item.icon;
            const iconName = Icon.name || "meta";
            const metaKey = `${iconName}-${item.label}`;
            return (
              <div key={metaKey} className="flex items-start gap-2">
                <Icon className="text-primary mt-0.5 size-4" />
                <span
                  className={cn(
                    "flex-1 leading-snug",
                    typeof item.label === "string"
                      ? "text-muted-foreground"
                      : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
              </div>
            );
          })}
          {game.campaignId ? (
            <div className="flex items-start gap-2">
              <Sparkles className="text-primary mt-0.5 size-4" />
              <span className="text-muted-foreground flex-1 leading-snug">
                Part of an ongoing campaign
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-muted-foreground text-sm">
            Hosted by {game.owner?.name ?? game.owner?.email ?? "a community GM"}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 rounded-full"
          >
            <Link
              to="/game/$gameId"
              params={{ gameId: game.id }}
              className="flex items-center"
            >
              View details
              <ChevronRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function formatSystemDuration(minutes: number | null): string | null {
  if (!minutes || Number.isNaN(minutes)) {
    return null;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder) {
      return `~${hours}h ${remainder}m adventure`;
    }
    return `~${hours}h adventure`;
  }

  return `~${minutes}m adventure`;
}
