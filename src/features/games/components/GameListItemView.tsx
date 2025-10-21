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
import { LocalizedButtonLink, LocalizedLink } from "~/components/ui/LocalizedLink";
import type { GameListItem } from "~/features/games/games.types";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import { formatDateAndTime } from "~/shared/lib/datetime";
import { buildPlayersRange, formatExpectedDuration } from "~/shared/lib/game-formatting";
import { cn } from "~/shared/lib/utils";
import { List } from "~/shared/ui/list";

type MetaIcon = ComponentType<{ className?: string }>;

type LinkPrimitive = string | number | boolean;

export type GameLinkConfig = {
  to: string;
  params?: Record<string, LinkPrimitive>;
  search?: Record<string, LinkPrimitive | undefined>;
  from?: string;
};

interface GameListItemViewProps {
  game: GameListItem;
  link?: GameLinkConfig | undefined;
}

export function GameListItemView({ game, link }: GameListItemViewProps) {
  return (
    <List.Item className="px-0 py-0 sm:px-0">
      <GameShowcaseCard game={game} layout="list" link={link} />
    </List.Item>
  );
}

interface GameShowcaseCardProps {
  game: GameListItem;
  layout?: "grid" | "list";
  className?: string;
  link?: GameLinkConfig | undefined;
}

export function GameShowcaseCard({
  game,
  layout = "grid",
  className,
  link,
}: GameShowcaseCardProps) {
  const { t } = useGamesTranslation();
  const formattedDate = formatDateAndTime(game.dateTime);
  const price = game.price ? `€${game.price.toFixed(2)}` : t("list_item.free");
  const heroUrl = game.heroImageUrl;
  const categories = (game.gameSystem?.categories ?? []).filter(Boolean).slice(0, 3);

  const minPlayers =
    game.minimumRequirements?.minPlayers ?? game.gameSystem?.minPlayers ?? null;
  const maxPlayers =
    game.minimumRequirements?.maxPlayers ?? game.gameSystem?.maxPlayers ?? null;

  const playersLabelParts: string[] = [];
  if (typeof game.participantCount === "number") {
    playersLabelParts.push(t("list_item.joined_count", { count: game.participantCount }));
  }
  const playersRange = buildPlayersRange(minPlayers, maxPlayers, { fallback: null });
  if (playersRange) {
    playersLabelParts.push(playersRange);
  }
  const playersLabel = playersLabelParts.join(" • ");

  const expectedDuration = formatExpectedDuration(game.expectedDuration);
  const durationLabel = expectedDuration
    ? t("list_item.session_duration", { duration: expectedDuration })
    : formatSystemDuration(game.gameSystem?.averagePlayTime ?? null, t);

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

  const resolvedLink: GameLinkConfig = link ?? {
    to: "/game/$gameId",
    params: { gameId: game.id },
  };

  return (
    <article
      className={cn(
        "bg-secondary text-secondary-foreground relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:color-mix(in_oklab,var(--primary-soft)_32%,transparent)] shadow-sm transition-all hover:border-[color:color-mix(in_oklab,var(--primary-soft)_52%,transparent)] hover:shadow-lg dark:border-gray-700 dark:bg-gray-900/70",
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
            {game.gameSystem?.name ?? t("list_item.original_system")}
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
              <h3 className="text-foreground text-lg font-semibold sm:text-xl dark:text-gray-50">
                <LocalizedLink
                  to={resolvedLink.to}
                  {...(resolvedLink.params ? { params: resolvedLink.params } : {})}
                  {...(resolvedLink.search
                    ? {
                        search: Object.fromEntries(
                          Object.entries(resolvedLink.search)
                            .filter(([, v]) => v !== undefined)
                            .map(([k, v]) => [k, v as string | number | boolean]),
                        ),
                      }
                    : {})}
                  {...(resolvedLink.from ? { from: resolvedLink.from } : {})}
                  className="flex items-center"
                  translationKey="system_management.view_system_details"
                  translationNamespace="navigation"
                  fallbackText={game.name}
                >
                  {game.name}
                </LocalizedLink>
              </h3>
              {game.description ? (
                <p className="text-muted-foreground mt-2 line-clamp-3 text-sm dark:text-gray-300">
                  {game.description}
                </p>
              ) : null}
            </div>
            <Badge
              variant="outline"
              className="dark:border-primary/40 dark:bg-primary/15 dark:text-primary-100 shrink-0 text-xs font-medium"
            >
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
                      ? "text-muted-foreground dark:text-gray-300"
                      : "text-foreground dark:text-gray-50",
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
              <span className="text-muted-foreground flex-1 leading-snug dark:text-gray-300">
                {t("list_item.campaign_part")}
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="text-muted-foreground text-sm dark:text-gray-300">
            {game.owner?.name || game.owner?.email
              ? t("list_item.hosted_by", { name: game.owner?.name ?? game.owner?.email })
              : t("list_item.hosted_by_community")}
          </span>
          <LocalizedButtonLink
            to={resolvedLink.to}
            {...(resolvedLink.params ? { params: resolvedLink.params } : {})}
            {...(resolvedLink.search
              ? {
                  search: Object.fromEntries(
                    Object.entries(resolvedLink.search)
                      .filter(([, v]) => v !== undefined)
                      .map(([k, v]) => [k, v as string | number | boolean]),
                  ),
                }
              : {})}
            {...(resolvedLink.from ? { from: resolvedLink.from } : {})}
            variant="outline"
            size="sm"
            className="dark:border-primary/40 dark:text-primary-100 dark:hover:bg-primary/20 flex shrink-0 items-center gap-1.5 rounded-full"
            translationKey="system_management.view_system_details"
            translationNamespace="navigation"
            fallbackText={t("list_item.view_details")}
            ariaLabelTranslationKey="system_management.view_system_details"
          >
            {t("list_item.view_details")}
            <ChevronRight className="ml-1 size-4" />
          </LocalizedButtonLink>
        </div>
      </div>
    </article>
  );
}

function formatSystemDuration(
  minutes: number | null,
  t: (key: string, params?: Record<string, unknown>) => string,
): string | null {
  if (!minutes || Number.isNaN(minutes)) {
    return null;
  }

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (remainder) {
      return t("list_item.duration_formats.hours_minutes", { hours, minutes: remainder });
    }
    return t("list_item.duration_formats.hours_only", { hours });
  }

  return t("list_item.duration_formats.minutes_only", { minutes });
}
