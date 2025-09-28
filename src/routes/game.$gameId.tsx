import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type React from "react";
import { useState } from "react";
import { LanguageTag } from "~/components/LanguageTag";
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
import { ChevronsUpDownIcon, Info, LinkIcon, MapPinIcon } from "~/components/ui/icons";
import { Separator } from "~/components/ui/separator";
import { StickyActionBar } from "~/components/ui/sticky-action-bar";
import { useAuth } from "~/features/auth/hooks/useAuth";
import { getSystemBySlug } from "~/features/game-systems/game-systems.queries";
import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";
import { applyToGame } from "~/features/games/games.mutations";
import { getGame } from "~/features/games/games.queries";
import type { GameApplication, GameWithDetails } from "~/features/games/games.types";
import { PublicLayout } from "~/features/layouts/public-layout";
import { SafetyRulesView } from "~/shared/components/SafetyRulesView";
import { formatDateAndTime } from "~/shared/lib/datetime";
import type { OperationResult } from "~/shared/types/common";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";

type GameDetailLoaderData = {
  gameDetails: GameWithDetails | null;
  systemDetails: GameSystemDetail | null;
};

export const Route = createFileRoute("/game/$gameId")({
  loader: async ({ params }) => {
    const result: OperationResult<GameWithDetails | null> = await getGame({
      data: { id: params.gameId },
    });

    if (result.success && result.data) {
      if (result.data.visibility === "public" && result.data.status === "scheduled") {
        let systemDetails: GameSystemDetail | null = null;
        const slug = result.data.gameSystem?.slug;
        if (slug) {
          try {
            systemDetails = await getSystemBySlug({ data: { slug } });
          } catch (error) {
            console.error("Failed to enrich game with system details", error);
          }
        }

        return { gameDetails: result.data, systemDetails } satisfies GameDetailLoaderData;
      }

      return { gameDetails: null, systemDetails: null } satisfies GameDetailLoaderData;
    }

    console.error(
      "Failed to fetch game details:",
      result.success ? "Unknown error" : result.errors,
    );
    return { gameDetails: null, systemDetails: null } satisfies GameDetailLoaderData;
  },
  component: GameDetailPage,
});

function GameDetailPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { gameDetails, systemDetails } = Route.useLoaderData() as GameDetailLoaderData;
  const [isSystemAboutOpen, setIsSystemAboutOpen] = useState(false);

  const applyMutation = useMutation<
    OperationResult<GameApplication>,
    Error,
    { data: { gameId: string; message?: string } }
  >({
    mutationFn: (variables) => applyToGame(variables),
    onSuccess: (res) => {
      if (res.success) {
        console.info("Application submitted");
      }
    },
  });

  if (!gameDetails) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading mb-8 text-4xl">Game Not Found</h1>
          <p className="text-muted-foreground">
            The game you are looking for does not exist or has been removed.
          </p>
        </div>
      </PublicLayout>
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
  const heroStyle = systemDetails?.heroUrl
    ? {
        backgroundImage: `linear-gradient(to top, rgba(10,10,10,0.65), rgba(10,10,10,0.2)), url('${systemDetails.heroUrl}')`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;
  const systemSummary = systemDetails?.description ?? systemDetails?.summary ?? null;
  const systemLinks = systemDetails ? buildSystemExternalLinks(systemDetails) : [];
  const gallery = systemDetails?.gallery ?? [];

  return (
    <PublicLayout>
      <div className="pb-28 lg:pb-16">
        <section
          className="bg-background relative h-[340px] overflow-hidden sm:h-[420px]"
          style={heroStyle}
        >
          {!systemDetails?.heroUrl ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(90,46,141,0.6),_rgba(17,17,17,0.95))]" />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/10" />
          <div className="relative z-10 flex h-full items-end pb-12">
            <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl space-y-4 text-white">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/15 text-xs font-medium tracking-wide text-white uppercase">
                    Public session
                  </Badge>
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl">
                  {gameDetails.name}
                </h1>
                <p className="text-sm text-white/85 sm:text-base">{heroSubtitle}</p>
                {canApply ? (
                  isAuthenticated ? (
                    <Button
                      className="hidden sm:inline-flex"
                      onClick={() =>
                        applyMutation.mutate({ data: { gameId: gameDetails.id } })
                      }
                      disabled={applyMutation.isPending}
                    >
                      {applyMutation.isPending ? "Applying..." : "Apply to join"}
                    </Button>
                  ) : (
                    <Button
                      className="hidden sm:inline-flex"
                      onClick={() =>
                        navigate({
                          to: "/auth/login",
                          search: { redirect: `/game/${gameDetails.id}` },
                        })
                      }
                    >
                      Sign in to apply
                    </Button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-8 pb-10">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[2fr_1fr] lg:px-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About this session</CardTitle>
                  <CardDescription>
                    Get a feel for the table vibe before you request a seat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gameDetails.description ? (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {gameDetails.description}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      The game organizer hasn't shared additional details yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Session logistics</CardTitle>
                  <CardDescription>
                    Everything you need to know before joining.
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                      value={
                        seatsAvailable != null ? `${seatsAvailable} open` : "Contact GM"
                      }
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                  <CardDescription>
                    Precise meeting details are shared once your seat is confirmed.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPinIcon className="text-muted-foreground mt-1 h-4 w-4" />
                    <div>
                      <p className="text-foreground font-medium">
                        {gameDetails.location.address}
                      </p>
                      <SafeAddressLink address={gameDetails.location.address} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {gallery.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Art & inspiration</CardTitle>
                    <CardDescription>
                      Approved imagery curated for {systemDetails?.name ?? "this system"}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {gallery.slice(0, 4).map((asset) => (
                        <figure
                          key={asset.id}
                          className="bg-muted/40 overflow-hidden rounded-xl border"
                        >
                          <img
                            src={asset.secureUrl}
                            alt={`${systemDetails?.name ?? "Game system"} artwork`}
                            loading="lazy"
                            className="h-48 w-full object-cover"
                          />
                          {asset.license ? (
                            <figcaption className="text-muted-foreground px-3 py-2 text-xs">
                              Licensed: {asset.license}
                              {asset.licenseUrl ? (
                                <>
                                  {" "}
                                  ·{" "}
                                  <a
                                    href={asset.licenseUrl}
                                    className="underline"
                                    target="_blank"
                                    rel="noreferrer"
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
                  </CardContent>
                </Card>
              ) : null}

              <Card>
                <CardHeader>
                  <CardTitle>Safety & table rules</CardTitle>
                  <CardDescription>
                    Tools and expectations shared by the game organizer.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SafetyRulesView safetyRules={gameDetails.safetyRules} />
                </CardContent>
              </Card>

              {systemDetails ? (
                <Card>
                  <CardHeader className="space-y-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle>About {systemDetails.name}</CardTitle>
                        <CardDescription>
                          Pulled from the Roundup Games system library.
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSystemAboutOpen((prev) => !prev)}
                        aria-expanded={isSystemAboutOpen}
                        aria-controls="system-about-content"
                        className="mt-1 h-auto gap-2 px-3 py-1 text-xs font-semibold tracking-wide uppercase"
                      >
                        {isSystemAboutOpen ? "Hide" : "Show"} details
                        <ChevronsUpDownIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  {isSystemAboutOpen ? (
                    <CardContent id="system-about-content" className="space-y-4">
                      {systemSummary ? (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {systemSummary}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">
                          We're still gathering lore for this system—check back soon.
                        </p>
                      )}
                      {(systemDetails.categories.length > 0 ||
                        systemDetails.mechanics.length > 0) && (
                        <div className="space-y-4">
                          {systemDetails.categories.length > 0 ? (
                            <div className="space-y-2">
                              <h4 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                                Categories
                              </h4>
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
                            <div className="space-y-2">
                              <h4 className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
                                Mechanics
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {systemDetails.mechanics.map((mechanic) => (
                                  <Badge
                                    key={`mechanic-${mechanic.id}`}
                                    variant="outline"
                                  >
                                    {mechanic.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </CardContent>
                  ) : null}
                </Card>
              ) : null}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Game Organizer</CardTitle>
                  <CardDescription>Meet your host for the adventure.</CardDescription>
                </CardHeader>
                <CardContent>
                  {gameDetails.owner ? (
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={gameDetails.owner.name}
                        email={gameDetails.owner.email}
                        src={gameDetails.owner.image ?? null}
                        srcUploaded={gameDetails.owner.uploadedAvatarPath ?? null}
                        className="size-12"
                      />
                      <div className="space-y-1">
                        <p className="text-foreground text-base font-semibold">
                          {gameDetails.owner.name ?? gameDetails.owner.email}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {gameDetails.owner.gmRating
                            ? `Community rating: ${gameDetails.owner.gmRating.toFixed(1)}/5`
                            : "New to the Roundup Games community"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      We'll share the game organizer's details once the schedule is
                      confirmed.
                    </p>
                  )}
                </CardContent>
              </Card>

              {systemDetails ? (
                <Card>
                  <CardHeader>
                    <CardTitle>System quick facts</CardTitle>
                    <CardDescription>
                      Snapshot of {systemDetails.name} for new players.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
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
                                <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Recommended minimum age for players based on content
                                themes and mechanics.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      />
                    ) : null}

                    {systemDetails.complexityRating ? (
                      <QuickFact
                        label="Complexity"
                        value={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1">
                                {systemDetails.complexityRating}/5
                                <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                1-5 scale where 1 is simple/beginner-friendly and 5 is
                                complex/expert-level.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        }
                      />
                    ) : null}

                    {systemDetails.externalRefs ? <Separator /> : null}
                    {systemLinks.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                          External references
                        </h4>
                        <ul className="space-y-2">
                          {systemLinks.map((link) => (
                            <li key={link.label}>
                              <a
                                href={link.href}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                              >
                                <LinkIcon className="h-4 w-4" /> {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <Separator />
                    <Link
                      to="/systems/$slug"
                      params={{ slug: systemDetails.slug }}
                      className="text-primary text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      More details &raquo;
                    </Link>
                  </CardContent>
                </Card>
              ) : null}
            </aside>
          </div>
        </section>

        {canApply ? (
          <StickyActionBar>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-foreground text-sm font-semibold">{priceLabel}</p>
                <p className="text-muted-foreground text-xs">
                  {playersRange}
                  {seatsAvailable != null ? ` • ${seatsAvailable} seats left` : ""}
                </p>
              </div>
              {isAuthenticated ? (
                <Button
                  onClick={() =>
                    applyMutation.mutate({ data: { gameId: gameDetails.id } })
                  }
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? "Applying..." : "Apply to join"}
                </Button>
              ) : (
                <Button
                  onClick={() =>
                    navigate({
                      to: "/auth/login",
                      search: { redirect: `/game/${gameDetails.id}` },
                    })
                  }
                >
                  Sign in to apply
                </Button>
              )}
            </div>
          </StickyActionBar>
        ) : null}
      </div>
    </PublicLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || (typeof value === "string" && value.trim().length === 0)) {
    return null;
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs tracking-wide uppercase">{label}</p>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}

interface QuickFactProps {
  label: string;
  value: React.ReactNode;
}

function QuickFact({ label, value }: QuickFactProps) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SafeAddressLink({ address }: { address: string }) {
  const href = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary text-xs font-medium underline-offset-4 hover:underline"
    >
      Open in Google Maps
    </a>
  );
}

function formatPrice(price: number | null | undefined) {
  if (price == null) {
    return "Free";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function buildPlayersRange(
  minPlayers: number | null | undefined,
  maxPlayers: number | null | undefined,
) {
  if (minPlayers && maxPlayers) {
    return `${minPlayers}-${maxPlayers} players`;
  }
  if (minPlayers) {
    return `${minPlayers}+ players`;
  }
  if (maxPlayers) {
    return `Up to ${maxPlayers} players`;
  }
  return "Player count TBD";
}

function formatExpectedDuration(duration: number | null | undefined) {
  if (duration == null) return null;
  const totalMinutes = Math.round(duration * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}m`;
}

function buildSystemExternalLinks(system: GameSystemDetail) {
  const refs = [] as Array<{ href: string; label: string }>;
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
