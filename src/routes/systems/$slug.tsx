import { createFileRoute, notFound } from "@tanstack/react-router";
import { SafeLink as Link } from "~/components/ui/SafeLink";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  ArrowLeftIcon,
  CalendarIcon,
  Info,
  LinkIcon,
  UsersIcon,
} from "~/components/ui/icons";
import { Separator } from "~/components/ui/separator";
import { SystemHero } from "~/features/game-systems/components/system-hero";
import { getSystemBySlug } from "~/features/game-systems/game-systems.queries";
import type { GameSystemDetail } from "~/features/game-systems/game-systems.types";
import { formatPlayerCountLabel } from "~/features/game-systems/lib/player-count";
import { PublicLayout } from "~/features/layouts/public-layout";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/shared/ui/tooltip";

const detailSurfaceClass =
  "rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8";

export const Route = createFileRoute("/systems/$slug")({
  loader: async ({ params }) => {
    const system = await getSystemBySlug({ data: { slug: params.slug } });
    if (!system) {
      throw notFound();
    }
    return { system } satisfies { system: GameSystemDetail };
  },
  component: SystemDetailPage,
});

function SystemDetailPage() {
  const { system } = Route.useLoaderData() as { system: GameSystemDetail };
  const playersLabel = formatPlayerCountLabel(system);
  const description = system.description ?? "We're compiling details for this system.";
  const taxonomyMissing = system.categories.length === 0 && system.mechanics.length === 0;
  const externalLinks = buildExternalLinks(system);

  return (
    <PublicLayout>
      <SystemHero
        name={system.name}
        subtitle={system.publisher?.name ?? "Community curated"}
        heroUrl={system.heroUrl}
      />

      <section className="container mx-auto space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="outline" size="sm">
            <Link to="/systems">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to browse
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <UsersIcon className="mr-1 h-3.5 w-3.5" /> {playersLabel}
            </Badge>
            {system.averagePlayTime ? (
              <Badge variant="outline">Avg. session {system.averagePlayTime} min</Badge>
            ) : null}
            {system.yearReleased ? (
              <Badge variant="outline">
                <CalendarIcon className="mr-1 h-3.5 w-3.5" /> Released{" "}
                {system.yearReleased}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          <article className="space-y-8">
            <section className={`${detailSurfaceClass} space-y-3`}>
              <h2 className="text-2xl font-semibold">Overview</h2>
              <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </section>

            <section className={`${detailSurfaceClass} space-y-4`}>
              <h3 className="text-xl font-semibold">Taxonomy</h3>
              {taxonomyMissing ? (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Taxonomy coming soon</CardTitle>
                    <CardDescription>
                      We're still mapping categories and mechanics for this system. Check
                      back after the next crawler run.
                    </CardDescription>
                  </CardHeader>
                </Card>
              ) : (
                <div className="space-y-4">
                  {system.categories.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                        Categories
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {system.categories.map((category) => (
                          <Badge key={`category-${category.id}`} variant="secondary">
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {system.mechanics.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                        Mechanics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {system.mechanics.map((mechanic) => (
                          <Badge key={`mechanic-${mechanic.id}`} variant="outline">
                            {mechanic.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            <section className={`${detailSurfaceClass} space-y-4`}>
              <h3 className="text-xl font-semibold">Gallery</h3>
              {system.gallery.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {system.gallery.map((asset) => (
                    <figure
                      key={asset.id}
                      className="bg-muted/40 overflow-hidden rounded-xl border"
                    >
                      <img
                        src={asset.secureUrl}
                        alt={`${system.name} gallery asset ${asset.id}`}
                        loading="lazy"
                        className="h-56 w-full object-cover"
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
              ) : (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Gallery pending moderation</CardTitle>
                    <CardDescription>
                      Crawlers captured imagery for this system, but it has not been
                      approved yet. Approved assets appear here automatically.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </section>
          </article>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick stats</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-3 text-sm">
                <QuickFact label="Players" value={playersLabel} />
                {system.optimalPlayers ? (
                  <QuickFact
                    label="Optimal table"
                    value={`${system.optimalPlayers} players`}
                  />
                ) : null}
                {system.averagePlayTime ? (
                  <QuickFact
                    label="Average session"
                    value={`${system.averagePlayTime} minutes`}
                  />
                ) : null}
                {system.yearReleased ? (
                  <QuickFact label="First published" value={`${system.yearReleased}`} />
                ) : null}
                {system.ageRating ? (
                  <QuickFact
                    label="Age rating"
                    value={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            {system.ageRating}
                            <Info className="h-3 w-3" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Recommended minimum age for players based on content themes
                            and mechanics.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    }
                  />
                ) : null}

                {system.complexityRating ? (
                  <QuickFact
                    label="Complexity"
                    value={
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-1">
                            {system.complexityRating}/5
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
                <Separator />
                <div>
                  <div className="text-foreground font-medium">Publisher</div>
                  <div>
                    {system.publisher ? (
                      <span>{system.publisher.name}</span>
                    ) : (
                      <span>Pending confirmation</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-foreground font-medium">First published</div>
                  <div>{system.yearReleased ?? "—"}</div>
                </div>
              </CardContent>
            </Card>

            {externalLinks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>External references</CardTitle>
                  <CardDescription>
                    Links collected by our crawlers for fact-checking and enrichment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {externalLinks.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary flex items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" /> {link.label}
                    </a>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>

        <section className={`${detailSurfaceClass} space-y-4`}>
          <h3 className="text-xl font-semibold">FAQ</h3>
          {system.faqs.length > 0 ? (
            <div className="space-y-4">
              {system.faqs.map((faq) => (
                <Card key={faq.id}>
                  <CardHeader>
                    <CardTitle>{faq.question}</CardTitle>
                    <CardDescription className="text-muted-foreground text-base whitespace-pre-wrap">
                      {faq.answer}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>FAQ coming soon</CardTitle>
                <CardDescription>
                  Content editors are drafting the most helpful questions. Have a
                  suggestion? Reach out via the community Discord.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </section>
      </section>
    </PublicLayout>
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

function buildExternalLinks(system: GameSystemDetail) {
  if (!system.externalRefs) return [] as Array<{ href: string; label: string }>;
  const refs: Array<{ href: string; label: string }> = [];
  if (system.externalRefs.startplaying) {
    const value = system.externalRefs.startplaying;
    const href = value.startsWith("http")
      ? value
      : `https://startplaying.games/play/${value.replace(/^\/?(?:play|system)\//, "")}`;
    refs.push({ href, label: "StartPlaying" });
  }
  if (system.externalRefs.bgg) {
    const value = system.externalRefs.bgg;
    const href = value.startsWith("http")
      ? value
      : `https://boardgamegeek.com/boardgame/${value
          .replace(/^\/?boardgame\//, "")
          .replace(/^\/?rpg\//, "")
          .replace(/^\//, "")}`;
    refs.push({ href, label: "BoardGameGeek" });
  }
  if (system.externalRefs.wikipedia) {
    const value = system.externalRefs.wikipedia;
    const href = value.startsWith("http")
      ? value
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(value)}`;
    refs.push({ href, label: "Wikipedia" });
  }
  return refs;
}
