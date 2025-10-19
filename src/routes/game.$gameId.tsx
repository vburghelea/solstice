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
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useGamesTranslation } from "~/hooks/useTypedTranslation";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { CloudinaryImage } from "~/shared/components/cloudinary-image";
import { HeroBackgroundImage } from "~/shared/components/hero-background-image";
import { InfoItem } from "~/shared/components/info-item";
import { SafeAddressLink } from "~/shared/components/safe-address-link";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";
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

export const Route = createFileRoute("/game/$gameId")({
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
  const { t: gt } = useGamesTranslation();

  const applyMutation = useMutation<
    OperationResult<GameApplication>,
    Error,
    { data: { gameId: string; message?: string } }
  >({
    mutationFn: (variables) => applyToGame(variables),
  });

  if (!gameDetails) {
    return (
      <VisitorShell>
        <div
          className={cn(
            SURFACE_CLASSNAME,
            "token-stack-lg mx-auto max-w-3xl items-center text-center",
          )}
        >
          <h1 className="text-heading-sm text-foreground">
            {gt("game_detail.unavailable.title")}
          </h1>
          <p className="text-body-sm text-muted-strong">
            {gt("game_detail.unavailable.message")}
          </p>
          <div className="token-gap-sm flex flex-wrap items-center justify-center">
            <Link
              to="/search"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              {gt("game_detail.unavailable.browse_games")}
            </Link>
            <Link
              to="/"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-full",
              )}
            >
              {gt("game_detail.unavailable.visit_homepage")}
            </Link>
          </div>
        </div>
      </VisitorShell>
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

  const systemSummary = systemDetails?.description ?? systemDetails?.summary ?? null;
  const systemLinks = systemDetails ? buildSystemExternalLinks(systemDetails, gt) : [];
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
          ? gt("game_detail.sections.session_logistics.minutes", {
              count: systemDetails.averagePlayTime,
            })
          : gt("game_detail.sections.session_logistics.gm_will_confirm")),
    },
    {
      icon: Globe2,
      label: <LanguageTag language={gameDetails.language} className="text-[0.65rem]" />,
    },
  ] as const;

  const heroBackgroundImage = systemDetails?.heroUrl
    ? createResponsiveCloudinaryImage(systemDetails.heroUrl, {
        transformation: {
          width: 1600,
          height: 900,
          crop: "fill",
          gravity: "auto",
        },
        widths: [640, 960, 1280, 1600],
        sizes: "100vw",
      })
    : null;

  const heroBackgroundOverlayClass = heroBackgroundImage
    ? "bg-gradient-to-t from-black/85 via-black/50 to-black/20"
    : "bg-[radial-gradient(circle_at_top,_rgba(146,102,204,0.55),_rgba(19,18,30,0.95))]";

  const heroBackgroundAlt = systemDetails?.name
    ? `${systemDetails.name} hero artwork`
    : "";

  return (
    <VisitorShell>
      <div className="token-stack-2xl space-y-4">
        <section
          className={cn(
            "relative overflow-hidden rounded-[32px] border border-[color:color-mix(in_oklab,var(--primary-soft)_36%,transparent)]",
            heroBackgroundImage
              ? undefined
              : "bg-[radial-gradient(circle_at_top,_rgba(90,46,141,0.6),_rgba(17,17,17,0.95))]",
          )}
        >
          {heroBackgroundImage ? (
            <HeroBackgroundImage
              image={heroBackgroundImage}
              alt={heroBackgroundAlt}
              loading="eager"
            />
          ) : null}
          <div
            aria-hidden
            className={cn("absolute inset-0 -z-10", heroBackgroundOverlayClass)}
          />
          <div className="relative z-10 flex min-h-[260px] flex-col justify-end gap-6 p-8 text-white sm:p-12">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/15 text-xs font-semibold tracking-wide text-white uppercase">
                {gt("game_detail.badges.public_session")}
              </Badge>
              {gameDetails.campaignId ? (
                <Badge className="bg-white/15 text-xs font-semibold tracking-wide text-white uppercase">
                  {gt("game_detail.badges.ongoing_campaign")}
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
                    {gt("game_detail.hosted_by")}
                  </p>
                  <p className="text-body-lg font-semibold text-white">
                    {gameDetails.owner?.name ??
                      gameDetails.owner?.email ??
                      gt("game_detail.community_gm")}
                  </p>
                  <p className="text-body-xs text-white/75">
                    {gameDetails.owner?.gmRating
                      ? gt("game_detail.community_rating", {
                          rating: gameDetails.owner.gmRating.toFixed(1),
                        })
                      : gt("game_detail.new_to_community")}
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
                    {applyMutation.isPending
                      ? gt("game_detail.applying")
                      : gt("game_detail.request_seat")}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    className="rounded-full px-8"
                    onClick={() =>
                      navigate({
                        to: "/auth/login",
                        search: { redirect: `/game/${gameDetails.id}` },
                      })
                    }
                  >
                    {gt("game_detail.sign_in_to_apply")}
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
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.table_briefing.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.table_briefing.title")}
                </h2>
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.table_briefing.subtitle")}
                </p>
              </header>
              <div className="text-body-sm text-muted-strong whitespace-pre-wrap">
                {gameDetails.description ??
                  gt("game_detail.sections.table_briefing.no_details")}
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
                      ? gt("game_detail.sections.table_briefing.ongoing_campaign")
                      : gt("game_detail.sections.table_briefing.one_shot")}
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
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.session_logistics.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.session_logistics.title")}
                </h2>
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.session_logistics.subtitle")}
                </p>
              </header>
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.date_time")}
                  value={formatDateAndTime(gameDetails.dateTime)}
                />
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.language")}
                  value={<LanguageTag language={gameDetails.language} />}
                />
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.price")}
                  value={priceLabel}
                />
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.players")}
                  value={playersRange}
                />
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.seats_available")}
                  value={
                    seatsAvailable != null
                      ? gt("game_detail.sections.session_logistics.seats_open", {
                          count: seatsAvailable,
                        })
                      : gt("game_detail.sections.session_logistics.contact_gm")
                  }
                />
                <InfoItem
                  label={gt("game_detail.sections.session_logistics.duration")}
                  value={
                    expectedDuration ??
                    (systemDetails?.averagePlayTime
                      ? gt("game_detail.sections.session_logistics.minutes", {
                          count: systemDetails.averagePlayTime,
                        })
                      : gt("game_detail.sections.session_logistics.gm_will_confirm"))
                  }
                />
              </div>
              <div className="token-stack-2xs border-primary/20 bg-primary/5 text-body-sm text-muted-strong rounded-2xl border p-4 transition-colors dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                {gt("game_detail.sections.session_logistics.meeting_details_notice")}
              </div>
            </section>

            <section
              className={cn(
                SURFACE_CLASSNAME,
                "token-stack-md bg-secondary p-6 sm:p-8 dark:bg-gray-900/70",
              )}
            >
              <header className="token-stack-2xs">
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.venue_details.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.venue_details.title")}
                </h2>
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.venue_details.subtitle")}
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
                  <p className="text-eyebrow text-primary-soft">
                    {gt("game_detail.sections.art_inspiration.eyebrow")}
                  </p>
                  <h2 className="text-heading-xs text-foreground">
                    {gt("game_detail.sections.art_inspiration.title")}
                  </h2>
                  <p className="text-body-sm text-muted-strong">
                    {gt("game_detail.sections.art_inspiration.subtitle", {
                      systemName:
                        systemDetails?.name ??
                        gt("game_detail.sections.art_inspiration.this_system"),
                    })}
                  </p>
                </header>
                <div className="grid gap-4 sm:grid-cols-2">
                  {gallery.slice(0, 4).map((asset) => (
                    <figure
                      key={asset.id}
                      className="border-border/40 bg-muted/30 overflow-hidden rounded-2xl border transition-colors dark:border-gray-700 dark:bg-gray-900/60"
                    >
                      <CloudinaryImage
                        imageUrl={asset.secureUrl}
                        transform={{ width: 800, height: 400 }}
                        alt={gt("game_detail.sections.art_inspiration.artwork_alt", {
                          systemName:
                            systemDetails?.name ??
                            gt("game_detail.sections.art_inspiration.game_system"),
                        })}
                        className="h-48 w-full object-cover"
                      />
                      {asset.license ? (
                        <figcaption className="text-body-2xs text-muted-strong px-4 py-2">
                          {gt("game_detail.sections.art_inspiration.licensed", {
                            license: asset.license,
                          })}
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
                                {gt("game_detail.sections.art_inspiration.view_details")}
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
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.safety_tools.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.safety_tools.title")}
                </h2>
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.safety_tools.subtitle")}
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
                    <p className="text-eyebrow text-primary-soft">
                      {gt("game_detail.sections.system_spotlight.eyebrow")}
                    </p>
                    <h2 className="text-heading-xs text-foreground">
                      {gt("game_detail.sections.system_spotlight.title", {
                        systemName: systemDetails.name,
                      })}
                    </h2>
                    <p className="text-body-sm text-muted-strong">
                      {gt("game_detail.sections.system_spotlight.subtitle")}
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
                    {isSystemAboutOpen
                      ? gt("game_detail.sections.system_spotlight.hide_details")
                      : gt("game_detail.sections.system_spotlight.show_details")}
                  </Button>
                </header>
                {isSystemAboutOpen ? (
                  <div id="system-about-content" className="token-stack-sm">
                    <p className="text-body-sm text-muted-strong whitespace-pre-wrap">
                      {systemSummary ??
                        gt("game_detail.sections.system_spotlight.no_summary")}
                    </p>
                    {(systemDetails.categories.length > 0 ||
                      systemDetails.mechanics.length > 0) && (
                      <div className="grid gap-6 sm:grid-cols-2">
                        {systemDetails.categories.length > 0 ? (
                          <div className="token-stack-3xs">
                            <h3 className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
                              {gt("game_detail.sections.system_spotlight.categories")}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {systemDetails.categories.map((category) => (
                                <Badge
                                  key={`category-${category.id}`}
                                  variant="secondary"
                                >
                                  {category.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {systemDetails.mechanics.length > 0 ? (
                          <div className="token-stack-3xs">
                            <h3 className="text-body-xs text-muted-strong tracking-[0.3em] uppercase">
                              {gt("game_detail.sections.system_spotlight.mechanics")}
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
                          {gt(
                            "game_detail.sections.system_spotlight.external_references",
                          )}
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
                        to="/systems/$slug"
                        params={{ slug: systemDetails.slug }}
                        className="text-primary text-body-sm font-semibold underline-offset-4 hover:underline"
                      >
                        {gt("game_detail.sections.system_spotlight.explore_full_profile")}
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
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.host_snapshot.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.host_snapshot.title")}
                </h2>
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.host_snapshot.subtitle")}
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
                        ? gt("game_detail.community_rating", {
                            rating: gameDetails.owner.gmRating.toFixed(1),
                          })
                        : gt("game_detail.new_to_community")}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.host_snapshot.organizer_details_soon")}
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
                  <p className="text-eyebrow text-primary-soft">
                    {gt("game_detail.sections.system_facts.eyebrow")}
                  </p>
                  <h2 className="text-heading-xs text-foreground">
                    {gt("game_detail.sections.system_facts.title")}
                  </h2>
                </header>
                <div className="token-stack-3xs text-body-sm text-muted-strong">
                  <QuickFact
                    label={gt("game_detail.sections.system_facts.players")}
                    value={buildPlayersRange(
                      systemDetails.minPlayers,
                      systemDetails.maxPlayers,
                    )}
                  />
                  {systemDetails.optimalPlayers ? (
                    <QuickFact
                      label={gt("game_detail.sections.system_facts.optimal_table")}
                      value={gt("game_detail.sections.system_facts.players_suffix", {
                        count: systemDetails.optimalPlayers,
                      })}
                    />
                  ) : null}
                  {systemDetails.averagePlayTime ? (
                    <QuickFact
                      label={gt("game_detail.sections.system_facts.average_session")}
                      value={`${systemDetails.averagePlayTime} ${gt("game_detail.sections.session_logistics.minutes", { count: systemDetails.averagePlayTime })}`}
                    />
                  ) : null}
                  {systemDetails.yearReleased ? (
                    <QuickFact
                      label={gt("game_detail.sections.system_facts.first_published")}
                      value={`${systemDetails.yearReleased}`}
                    />
                  ) : null}
                  {systemDetails.ageRating ? (
                    <QuickFact
                      label={gt("game_detail.sections.system_facts.age_rating")}
                      value={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              {systemDetails.ageRating}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-[220px] text-sm">
                              {gt("game_detail.sections.system_facts.age_rating_tooltip")}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    />
                  ) : null}
                  {systemDetails.complexityRating ? (
                    <QuickFact
                      label={gt("game_detail.sections.system_facts.complexity")}
                      value={systemDetails.complexityRating}
                    />
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
                <p className="text-eyebrow text-primary-soft">
                  {gt("game_detail.sections.reserve_seat.eyebrow")}
                </p>
                <h2 className="text-heading-xs text-foreground">
                  {gt("game_detail.sections.reserve_seat.title")}
                </h2>
              </header>
              <div className="token-stack-2xs text-body-sm text-muted-strong">
                <p>
                  {gt("game_detail.sections.reserve_seat.cost_per_player")}{" "}
                  <span className="text-foreground font-semibold">{priceLabel}</span>
                </p>
                <p>
                  {playersRange}
                  {seatsAvailable != null
                    ? ` • ${gt("game_detail.sections.session_logistics.seats_open", { count: seatsAvailable })}`
                    : ""}
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
                    {applyMutation.isPending
                      ? gt("game_detail.applying")
                      : gt("game_detail.sections.reserve_seat.apply_to_join")}
                  </Button>
                ) : (
                  <Button
                    className="rounded-full"
                    onClick={() =>
                      navigate({
                        to: "/auth/login",
                        search: { redirect: `/game/${gameDetails.id}` },
                      })
                    }
                  >
                    {gt("game_detail.sign_in_to_apply")}
                  </Button>
                )
              ) : (
                <p className="text-body-sm text-muted-strong">
                  {gt("game_detail.sections.reserve_seat.applications_closed")}
                </p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </VisitorShell>
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

function buildSystemExternalLinks(system: GameSystemDetail, t: (key: string) => string) {
  const refs: Array<{ href: string; label: string }> = [];
  const externalRefs = system.externalRefs;
  if (!externalRefs) return refs;

  if (externalRefs.startplaying) {
    const value = externalRefs.startplaying;
    const href = value.startsWith("http")
      ? value
      : `https://startplaying.games/play/${value.replace(/^\/?(?:play|system)\//, "")}`;
    refs.push({ href, label: t("external_refs.startplaying") });
  }

  if (externalRefs.bgg) {
    const value = externalRefs.bgg;
    const href = value.startsWith("http")
      ? value
      : `https://boardgamegeek.com/boardgame/${value
          .replace(/^\/?boardgame\//, "")
          .replace(/^\/?rpg\//, "")
          .replace(/^\//, "")}`;
    refs.push({ href, label: t("external_refs.boardgamegeek") });
  }

  if (externalRefs.wikipedia) {
    const value = externalRefs.wikipedia;
    const href = value.startsWith("http")
      ? value
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(value)}`;
    refs.push({ href, label: t("external_refs.wikipedia") });
  }

  return refs;
}
