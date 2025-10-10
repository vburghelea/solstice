import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Calendar, Clock, Globe2, MapPin, Sparkles, Users } from "lucide-react";
import { useState } from "react";

import { LanguageTag } from "~/components/LanguageTag";
import { Avatar } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import { useAuth } from "~/features/auth/hooks/useAuth";
import { getSystemBySlug } from "~/features/game-systems/game-systems.queries";
import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";
import { applyToGame } from "~/features/games/games.mutations";
import { getGame } from "~/features/games/games.queries";
import type { GameApplication, GameWithDetails } from "~/features/games/games.types";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { InfoItem } from "~/shared/components/info-item";
import { SafeAddressLink } from "~/shared/components/safe-address-link";
import { formatDateAndTime } from "~/shared/lib/datetime";
import {
  buildPlayersRange,
  formatExpectedDuration,
  formatPrice,
} from "~/shared/lib/game-formatting";
import { cn } from "~/shared/lib/utils";
import type { OperationResult } from "~/shared/types/common";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";

const SURFACE_CLASSNAME =
  "rounded-3xl border border-[color:color-mix(in_oklab,var(--primary-soft)_28%,transparent)] bg-[color:color-mix(in_oklab,var(--primary-soft)_12%,white)]/95 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

interface LoaderData {
  gameDetails: GameWithDetails | null;
  systemDetails: GameSystemDetail | null;
}

export const Route = createFileRoute("/visit/game/$gameId")({
  loader: async ({ params }) => {
    const result: OperationResult<GameWithDetails | null> = await getGame({
      data: { id: params.gameId },
    });

    if (result.success && result.data) {
      const game = result.data;

      if (game.visibility === "public" && game.status === "scheduled") {
        let systemDetails: GameSystemDetail | null = null;
        const slug = game.gameSystem?.slug;

        if (slug) {
          try {
            systemDetails = await getSystemBySlug({ data: { slug } });
          } catch (error) {
            console.error("Failed to fetch system details", error);
          }
        }

        return { gameDetails: game, systemDetails } satisfies LoaderData;
      }

      return { gameDetails: null, systemDetails: null } satisfies LoaderData;
    }

    console.error(
      "Failed to fetch game details:",
      result.success ? "Unknown error" : result.errors,
    );

    return { gameDetails: null, systemDetails: null } satisfies LoaderData;
  },
  component: VisitGameDetailPage,
});

function VisitGameDetailPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { gameDetails, systemDetails } = Route.useLoaderData() as LoaderData;
  const [isSystemAboutOpen, setIsSystemAboutOpen] = useState(false);

  const applyMutation = useMutation<
    OperationResult<GameApplication>,
    Error,
    { data: { gameId: string; message?: string } }
  >({
    mutationFn: (variables) => applyToGame(variables),
  });

  if (!gameDetails) {
    return (
      <div
        className={cn(
          SURFACE_CLASSNAME,
          "token-stack-lg mx-auto max-w-3xl items-center text-center",
        )}
      >
        <h1 className="text-heading-sm text-foreground">Session unavailable</h1>
        <p className="text-body-sm text-muted-strong">
          The game you were looking for is no longer accepting players or may have been
          removed.
        </p>
        <div className="token-gap-sm flex flex-wrap items-center justify-center">
          <Link
            to="/visit/search"
            className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
          >
            Browse all games
          </Link>
          <Link
            to="/visit"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-full",
            )}
          >
            Visit homepage
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = gameDetails.owner?.id && user?.id === gameDetails.owner.id;
  const isOpenForApplications = gameDetails.status === "scheduled";
  const isConfirmedParticipant = Boolean(
    user &&
      gameDetails.participants.some(
        (participant) =>
          participant.userId === user.id && participant.status === "approved",
      ),
  );
  const canApply =
    isOpenForApplications &&
    !isOwner &&
    gameDetails.visibility === "public" &&
    !isConfirmedParticipant;

  const approvedParticipants = gameDetails.participants.filter(
    (participant) => participant.status === "approved" && participant.role !== "owner",
  );
  const maxPlayers = gameDetails.minimumRequirements?.maxPlayers ?? null;
  const seatsAvailable =
    typeof maxPlayers === "number"
      ? Math.max(maxPlayers - approvedParticipants.length, 0)
      : null;
  const playersRange = buildPlayersRange(
    gameDetails.minimumRequirements?.minPlayers,
    gameDetails.minimumRequirements?.maxPlayers,
  );
  const expectedDuration = formatExpectedDuration(gameDetails.expectedDuration);
  const priceLabel = formatPrice(gameDetails.price);
  const heroSubtitle = [
    formatDateAndTime(gameDetails.dateTime),
    gameDetails.location.address,
    gameDetails.gameSystem?.name,
  ]
    .filter(Boolean)
    .join(" • ");

  const heroBackground =
    systemDetails?.heroUrl ??
    "radial-gradient(circle at top, rgba(146,102,204,0.55), rgba(19,18,30,0.95))";

  const systemSummary = systemDetails?.description ?? systemDetails?.summary ?? null;
  const systemLinks = systemDetails ? buildSystemExternalLinks(systemDetails) : [];
  const gallery = systemDetails?.gallery ?? [];

  const metaItems = [
    { icon: Calendar, label: formatDateAndTime(gameDetails.dateTime) },
    { icon: MapPin, label: gameDetails.location.address },
    { icon: Users, label: playersRange },
    {
      icon: Clock,
      label:
        expectedDuration ??
        (systemDetails?.averagePlayTime
          ? `${systemDetails.averagePlayTime} minutes`
          : "GM will confirm"),
    },
    {
      icon: Globe2,
      label: <LanguageTag language={gameDetails.language} className="text-[0.65rem]" />,
    },
  ] as const;

  const heroStyle = heroBackground.startsWith("radial")
    ? {
        backgroundImage: heroBackground,
      }
    : {
        backgroundImage: `linear-gradient(to top, rgba(10,10,10,0.7), rgba(10,10,10,0.2)), url('${heroBackground}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };

  return (
    <div className="token-stack-2xl space-y-4">
      <section
        className={cn(
          "relative overflow-hidden rounded-[32px] border border-[color:color-mix(in_oklab,var(--primary-soft)_36%,transparent)]",
          "bg-[radial-gradient(circle_at_top,_rgba(90,46,141,0.6),_rgba(17,17,17,0.95))]",
        )}
        style={heroStyle}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />
        <div className="relative z-10 flex min-h-[260px] flex-col justify-end gap-6 p-8 text-white sm:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-white/15 text-xs font-semibold tracking-wide text-white uppercase">
              Public session
            </Badge>
            {gameDetails.campaignId ? (
              <Badge className="bg-white/15 text-xs font-semibold tracking-wide text-white uppercase">
                Ongoing campaign
              </Badge>
            ) : null}
          </div>
          <div className="token-stack-2xs max-w-3xl">
            <h1 className="text-heading-md text-balance text-white sm:text-[2.75rem]">
              {gameDetails.name}
            </h1>
            <p className="text-body-sm text-white/85 sm:text-base">{heroSubtitle}</p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                name={gameDetails.owner?.name ?? null}
                email={gameDetails.owner?.email ?? null}
                src={gameDetails.owner?.image ?? null}
                srcUploaded={gameDetails.owner?.uploadedAvatarPath ?? null}
                className="size-14 border-2 border-white/40"
              />
              <div className="token-stack-3xs text-left">
                <p className="text-body-sm tracking-[0.25em] text-white/75 uppercase">
                  Hosted by
                </p>
                <p className="text-body-lg font-semibold text-white">
                  {gameDetails.owner?.name ?? gameDetails.owner?.email ?? "Community GM"}
                </p>
                <p className="text-body-xs text-white/75">
                  {gameDetails.owner?.gmRating
                    ? `Community rating: ${gameDetails.owner.gmRating.toFixed(1)}/5`
                    : "New to the Roundup Games community"}
                </p>
              </div>
            </div>
            {canApply ? (
              isAuthenticated ? (
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  disabled={applyMutation.isPending}
                  onClick={() =>
                    applyMutation.mutate({ data: { gameId: gameDetails.id } })
                  }
                >
                  {applyMutation.isPending ? "Applying..." : "Request a seat"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="rounded-full px-8"
                  onClick={() =>
                    navigate({
                      to: "/auth/login",
                      search: { redirect: `/visit/game/${gameDetails.id}` },
                    })
                  }
                >
                  Sign in to apply
                </Button>
              )
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_minmax(0,1fr)]">
        <div className="token-stack-xl gap-6 space-y-4">
          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-4 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-2xs">
              <p className="text-eyebrow text-primary-soft">Table briefing</p>
              <h2 className="text-heading-xs text-foreground">About this session</h2>
              <p className="text-body-sm text-muted-strong">
                Get a feel for the table vibe before you request a seat.
              </p>
            </header>
            <div className="text-body-sm text-muted-strong whitespace-pre-wrap">
              {gameDetails.description ??
                "The game organizer hasn't shared additional details yet."}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {metaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={Icon.name} className="flex items-start gap-3">
                    <Icon className="text-primary mt-1 size-5" />
                    <span className="text-body-sm text-muted-strong leading-snug">
                      {item.label}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-start gap-3">
                <Sparkles className="text-primary mt-1 size-5" />
                <span className="text-body-sm text-muted-strong leading-snug">
                  {gameDetails.campaignId
                    ? "Part of an ongoing campaign"
                    : "One-shot friendly for curious players"}
                </span>
              </div>
            </div>
          </section>

          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-2xs">
              <p className="text-eyebrow text-primary-soft">Session logistics</p>
              <h2 className="text-heading-xs text-foreground">Arrival checklist</h2>
              <p className="text-body-sm text-muted-strong">
                Everything you need to know before joining the table.
              </p>
            </header>
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoItem
                label="Date & time"
                value={formatDateAndTime(gameDetails.dateTime)}
              />
              <InfoItem
                label="Language"
                value={<LanguageTag language={gameDetails.language} />}
              />
              <InfoItem label="Price" value={priceLabel} />
              <InfoItem label="Players" value={playersRange} />
              <InfoItem
                label="Seats available"
                value={seatsAvailable != null ? `${seatsAvailable} open` : "Contact GM"}
              />
              <InfoItem
                label="Duration"
                value={
                  expectedDuration ??
                  (systemDetails?.averagePlayTime
                    ? `${systemDetails.averagePlayTime} min`
                    : "GM will confirm")
                }
              />
            </div>
            <div className="token-stack-2xs border-primary/20 bg-primary/5 text-body-sm text-muted-strong rounded-2xl border p-4 transition-colors dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              Precise meeting details are shared once your seat is confirmed.
            </div>
          </section>

          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-2xs">
              <p className="text-eyebrow text-primary-soft">Where we’re meeting</p>
              <h2 className="text-heading-xs text-foreground">Venue details</h2>
              <p className="text-body-sm text-muted-strong">
                We share exact instructions with approved players.
              </p>
            </header>
            <div className="text-body-sm text-muted-strong flex items-start gap-3">
              <MapPin className="text-primary mt-1 size-5" />
              <div className="token-stack-3xs">
                <p className="text-body-sm text-foreground font-semibold">
                  {gameDetails.location.address}
                </p>
                <SafeAddressLink address={gameDetails.location.address} />
              </div>
            </div>
          </section>

          {gallery.length > 0 ? (
            <section
              className={cn(
                SURFACE_CLASSNAME,
                "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
              )}
            >
              <header className="token-stack-2xs">
                <p className="text-eyebrow text-primary-soft">Art & inspiration</p>
                <h2 className="text-heading-xs text-foreground">Visual mood board</h2>
                <p className="text-body-sm text-muted-strong">
                  Approved imagery curated for {systemDetails?.name ?? "this system"}.
                </p>
              </header>
              <div className="grid gap-4 sm:grid-cols-2">
                {gallery.slice(0, 4).map((asset) => (
                  <figure
                    key={asset.id}
                    className="border-border/40 bg-muted/30 overflow-hidden rounded-2xl border transition-colors dark:border-gray-700 dark:bg-gray-900/60"
                  >
                    <img
                      src={asset.secureUrl}
                      alt={`${systemDetails?.name ?? "Game system"} artwork`}
                      loading="lazy"
                      className="h-48 w-full object-cover"
                    />
                    {asset.license ? (
                      <figcaption className="text-body-2xs text-muted-strong px-4 py-2">
                        Licensed: {asset.license}
                        {asset.licenseUrl ? (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={asset.licenseUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="underline"
                            >
                              View details
                            </a>
                          </>
                        ) : null}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-2xs">
              <p className="text-eyebrow text-primary-soft">Safety tools</p>
              <h2 className="text-heading-xs text-foreground">Table expectations</h2>
              <p className="text-body-sm text-muted-strong">
                Tools and boundaries shared by the game organizer.
              </p>
            </header>
            <SafetyRulesView safetyRules={gameDetails.safetyRules} />
          </section>

          {systemDetails ? (
            <section
              className={cn(
                SURFACE_CLASSNAME,
                "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
              )}
            >
              <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="token-stack-2xs">
                  <p className="text-eyebrow text-primary-soft">System spotlight</p>
                  <h2 className="text-heading-xs text-foreground">
                    About {systemDetails.name}
                  </h2>
                  <p className="text-body-sm text-muted-strong">
                    Pulled from the Roundup Games system library.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSystemAboutOpen((prev) => !prev)}
                  aria-expanded={isSystemAboutOpen}
                  aria-controls="system-about-content"
                  className="rounded-full px-4"
                >
                  {isSystemAboutOpen ? "Hide details" : "Show details"}
                </Button>
              </header>
              {isSystemAboutOpen ? (
                <div id="system-about-content" className="token-stack-sm">
                  <p className="text-body-sm text-muted-strong whitespace-pre-wrap">
                    {systemSummary ??
                      "We're still gathering lore for this system—check back soon."}
                  </p>
                  {(systemDetails.categories.length > 0 ||
                    systemDetails.mechanics.length > 0) && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {systemDetails.categories.length > 0 ? (
                        <div className="token-stack-3xs">
                          <h3 className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {systemDetails.categories.map((category) => (
                              <Badge key={`category-${category.id}`} variant="secondary">
                                {category.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {systemDetails.mechanics.length > 0 ? (
                        <div className="token-stack-3xs">
                          <h3 className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
                            Mechanics
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {systemDetails.mechanics.map((mechanic) => (
                              <Badge key={`mechanic-${mechanic.id}`} variant="outline">
                                {mechanic.name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                  {systemLinks.length > 0 ? (
                    <div className="token-stack-3xs">
                      <h3 className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
                        External references
                      </h3>
                      <ul className="token-stack-3xs">
                        {systemLinks.map((link) => (
                          <li key={link.label}>
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary text-body-sm font-semibold underline-offset-4 hover:underline"
                            >
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <div>
                    <Link
                      to="/visit/systems/$slug"
                      params={{ slug: systemDetails.slug }}
                      className="text-primary text-body-sm font-semibold underline-offset-4 hover:underline"
                    >
                      Explore the full system profile &raquo;
                    </Link>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="token-stack-lg gap-6">
          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-7 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-3xs">
              <p className="text-eyebrow text-primary-soft">Host snapshot</p>
              <h2 className="text-heading-xs text-foreground">Game organizer</h2>
              <p className="text-body-sm text-muted-strong">
                Meet your storyteller before you arrive.
              </p>
            </header>
            {gameDetails.owner ? (
              <div className="flex items-center gap-4">
                <Avatar
                  name={gameDetails.owner.name ?? null}
                  email={gameDetails.owner.email ?? null}
                  src={gameDetails.owner.image ?? null}
                  srcUploaded={gameDetails.owner.uploadedAvatarPath ?? null}
                  className="size-14"
                />
                <div className="token-stack-3xs">
                  <p className="text-body-md text-foreground font-semibold">
                    {gameDetails.owner.name ?? gameDetails.owner.email}
                  </p>
                  <p className="text-body-sm text-muted-strong">
                    {gameDetails.owner.gmRating
                      ? `Community rating: ${gameDetails.owner.gmRating.toFixed(1)}/5`
                      : "New to the Roundup Games community"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-body-sm text-muted-strong">
                We'll share the organizer's details once the schedule is confirmed.
              </p>
            )}
          </section>

          {systemDetails ? (
            <section
              className={cn(
                SURFACE_CLASSNAME,
                "token-stack-md bg-secondary p-6 sm:p-7 dark:bg-gray-900/70",
              )}
            >
              <header className="token-stack-3xs">
                <p className="text-eyebrow text-primary-soft">System quick facts</p>
                <h2 className="text-heading-xs text-foreground">Ruleset overview</h2>
              </header>
              <div className="token-stack-3xs text-body-sm text-muted-strong">
                <QuickFact
                  label="Players"
                  value={buildPlayersRange(
                    systemDetails.minPlayers,
                    systemDetails.maxPlayers,
                  )}
                />
                {systemDetails.optimalPlayers ? (
                  <QuickFact
                    label="Optimal table"
                    value={`${systemDetails.optimalPlayers} players`}
                  />
                ) : null}
                {systemDetails.averagePlayTime ? (
                  <QuickFact
                    label="Average session"
                    value={`${systemDetails.averagePlayTime} minutes`}
                  />
                ) : null}
                {systemDetails.yearReleased ? (
                  <QuickFact
                    label="First published"
                    value={`${systemDetails.yearReleased}`}
                  />
                ) : null}
                {systemDetails.ageRating ? (
                  <QuickFact
                    label="Age rating"
                    value={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            {systemDetails.ageRating}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[220px] text-sm">
                            Recommended minimum age based on content themes and mechanics.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    }
                  />
                ) : null}
                {systemDetails.complexityRating ? (
                  <QuickFact label="Complexity" value={systemDetails.complexityRating} />
                ) : null}
              </div>
            </section>
          ) : null}

          <section
            className={cn(
              SURFACE_CLASSNAME,
              "token-stack-md bg-secondary p-6 sm:p-7 dark:bg-gray-900/70",
            )}
          >
            <header className="token-stack-3xs">
              <p className="text-eyebrow text-primary-soft">Ready to join?</p>
              <h2 className="text-heading-xs text-foreground">Reserve your seat</h2>
            </header>
            <div className="token-stack-2xs text-body-sm text-muted-strong">
              <p>
                Cost per player:{" "}
                <span className="text-foreground font-semibold">{priceLabel}</span>
              </p>
              <p>
                {playersRange}
                {seatsAvailable != null ? ` • ${seatsAvailable} seats left` : ""}
              </p>
            </div>
            {canApply ? (
              isAuthenticated ? (
                <Button
                  className="rounded-full"
                  disabled={applyMutation.isPending}
                  onClick={() =>
                    applyMutation.mutate({ data: { gameId: gameDetails.id } })
                  }
                >
                  {applyMutation.isPending ? "Applying..." : "Apply to join"}
                </Button>
              ) : (
                <Button
                  className="rounded-full"
                  onClick={() =>
                    navigate({
                      to: "/auth/login",
                      search: { redirect: `/visit/game/${gameDetails.id}` },
                    })
                  }
                >
                  Sign in to apply
                </Button>
              )
            ) : (
              <p className="text-body-sm text-muted-strong">
                Applications for this session are currently closed.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

interface QuickFactProps {
  label: string;
  value: React.ReactNode;
}

function QuickFact({ label, value }: QuickFactProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
        {label}
      </span>
      <span className="text-body-sm text-foreground font-semibold">{value}</span>
    </div>
  );
}

function buildSystemExternalLinks(system: GameSystemDetail) {
  const refs: Array<{ href: string; label: string }> = [];
  const externalRefs = system.externalRefs;
  if (!externalRefs) return refs;

  if (externalRefs.startplaying) {
    const value = externalRefs.startplaying;
    const href = value.startsWith("http")
      ? value
      : `https://startplaying.games/play/${value.replace(/^\/?(?:play|system)\//, "")}`;
    refs.push({ href, label: "StartPlaying" });
  }

  if (externalRefs.bgg) {
    const value = externalRefs.bgg;
    const href = value.startsWith("http")
      ? value
      : `https://boardgamegeek.com/boardgame/${value
          .replace(/^\/?boardgame\//, "")
          .replace(/^\/?rpg\//, "")
          .replace(/^\//, "")}`;
    refs.push({ href, label: "BoardGameGeek" });
  }

  if (externalRefs.wikipedia) {
    const value = externalRefs.wikipedia;
    const href = value.startsWith("http")
      ? value
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(value)}`;
    refs.push({ href, label: "Wikipedia" });
  }

  return refs;
}
