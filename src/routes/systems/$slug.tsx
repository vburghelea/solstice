import { createFileRoute, notFound } from "@tanstack/react-router";
import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";

import { Badge } from "~/components/ui/badge";
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
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useGameSystemsTranslation } from "~/hooks/useTypedTranslation";
import { CloudinaryImage } from "~/shared/components/cloudinary-image";
import { useCloudinaryImage } from "~/shared/hooks/useCloudinaryImage";
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
  const { t } = useGameSystemsTranslation();
  const { system } = Route.useLoaderData() as { system: GameSystemDetail };
  const playersLabel = formatPlayerCountLabel(system);
  const description = system.description ?? t("detail.description_missing");
  const taxonomyMissing = system.categories.length === 0 && system.mechanics.length === 0;
  const externalLinks = buildExternalLinks(system, t);
  const heroBackground = useCloudinaryImage(system.heroUrl, {
    width: 1920,
    height: 1080,
  });

  return (
    <VisitorShell>
      <div className="relative isolate overflow-hidden">
        {heroBackground.src ? (
          <>
            <div
              className="pointer-events-none absolute inset-0 -z-20 bg-cover bg-no-repeat"
              style={{
                backgroundImage: `url('${heroBackground.src}')`,
                backgroundPosition: "center top",
                backgroundSize: "contain",
              }}
              aria-hidden="true"
            />
            <div className="from-background/30 via-background/85 to-background pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b" />
          </>
        ) : (
          <div className="from-primary-soft/20 via-background to-background pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b" />
        )}

        <div className="relative">
          <SystemHero
            name={system.name}
            subtitle={system.publisher?.name ?? t("status.community_curated")}
            heroUrl={system.heroUrl}
            renderBackground={false}
          />
        </div>

        <section className="container mx-auto space-y-10 px-4 pt-6 pb-10 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LocalizedButtonLink
              to="/systems"
              variant="outline"
              size="sm"
              translationKey="system_management.back_to_systems"
              translationNamespace="navigation"
              fallbackText={t("detail.back_to_browse")}
            >
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> {t("detail.back_to_browse")}
            </LocalizedButtonLink>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <UsersIcon className="mr-1 h-3.5 w-3.5" /> {playersLabel}
              </Badge>
              {system.averagePlayTime ? (
                <Badge variant="outline">
                  {t("detail.avg_session", { min: system.averagePlayTime })}
                </Badge>
              ) : null}
              {system.yearReleased ? (
                <Badge variant="outline">
                  <CalendarIcon className="mr-1 h-3.5 w-3.5" />{" "}
                  {t("detail.released", { year: system.yearReleased })}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
            <article className="space-y-8">
              <section className={`${detailSurfaceClass} space-y-3`}>
                <h2 className="text-2xl font-semibold">{t("detail.overview")}</h2>
                <p className="text-muted-foreground text-base leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </section>

              <section className={`${detailSurfaceClass} space-y-4`}>
                <h3 className="text-xl font-semibold">{t("detail.taxonomy")}</h3>
                {taxonomyMissing ? (
                  <Card className="border-dashed">
                    <CardHeader>
                      <CardTitle>{t("detail.taxonomy_coming_soon")}</CardTitle>
                      <CardDescription>
                        {t("detail.taxonomy_description")}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {system.categories.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                          {t("detail.categories")}
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
                          {t("detail.mechanics")}
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
                <h3 className="text-xl font-semibold">{t("detail.gallery")}</h3>
                {system.gallery.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {system.gallery.map((asset) => (
                      <figure
                        key={asset.id}
                        className="bg-muted/40 overflow-hidden rounded-xl border"
                      >
                        <CloudinaryImage
                          imageUrl={asset.secureUrl}
                          transform={{ width: 900, height: 600 }}
                          alt={t("detail.gallery_alt", {
                            systemName: system.name,
                            id: asset.id,
                          })}
                          className="h-56 w-full object-cover"
                        />
                        {asset.license ? (
                          <figcaption className="text-muted-foreground px-3 py-2 text-xs">
                            {t("detail.licensed", { license: asset.license })}
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
                                  {t("detail.view_details")}
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
                      <CardTitle>{t("detail.gallery_pending")}</CardTitle>
                      <CardDescription>{t("detail.gallery_description")}</CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </section>
            </article>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("detail.quick_stats")}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-3 text-sm">
                  <QuickFact label={t("detail.players")} value={playersLabel} />
                  {system.optimalPlayers ? (
                    <QuickFact
                      label={t("detail.optimal_table")}
                      value={t("detail.optimal_players", {
                        count: system.optimalPlayers,
                      })}
                    />
                  ) : null}
                  {system.averagePlayTime ? (
                    <QuickFact
                      label={t("detail.average_session")}
                      value={`${system.averagePlayTime} ${t("detail.minutes")}`}
                    />
                  ) : null}
                  {system.yearReleased ? (
                    <QuickFact
                      label={t("detail.first_published")}
                      value={`${system.yearReleased}`}
                    />
                  ) : null}
                  {system.ageRating ? (
                    <QuickFact
                      label={t("detail.age_rating")}
                      value={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              {system.ageRating}
                              <Info className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("detail.age_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    />
                  ) : null}

                  {system.complexityRating ? (
                    <QuickFact
                      label={t("detail.complexity")}
                      value={
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1">
                              {system.complexityRating}/5
                              <Info className="h-3 w-3" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t("detail.complexity_tooltip")}</p>
                          </TooltipContent>
                        </Tooltip>
                      }
                    />
                  ) : null}
                  <Separator />
                  <div>
                    <div className="text-foreground font-medium">
                      {t("detail.publisher")}
                    </div>
                    <div>
                      {system.publisher ? (
                        <span>{system.publisher.name}</span>
                      ) : (
                        <span>{t("detail.pending_confirmation")}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-foreground font-medium">
                      {t("detail.first_published")}
                    </div>
                    <div>{system.yearReleased ?? "—"}</div>
                  </div>
                </CardContent>
              </Card>

              {externalLinks.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("detail.external_references")}</CardTitle>
                    <CardDescription>{t("detail.external_description")}</CardDescription>
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
            <h3 className="text-xl font-semibold">{t("detail.faq")}</h3>
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
                  <CardTitle>{t("detail.faq_coming_soon")}</CardTitle>
                  <CardDescription>{t("detail.faq_description")}</CardDescription>
                </CardHeader>
              </Card>
            )}
          </section>
        </section>
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
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function buildExternalLinks(system: GameSystemDetail, t: (key: string) => string) {
  if (!system.externalRefs) return [] as Array<{ href: string; label: string }>;
  const refs: Array<{ href: string; label: string }> = [];
  if (system.externalRefs.startplaying) {
    const value = system.externalRefs.startplaying;
    const href = value.startsWith("http")
      ? value
      : `https://startplaying.games/play/${value.replace(/^\/?(?:play|system)\//, "")}`;
    refs.push({ href, label: t("references.startplaying") });
  }
  if (system.externalRefs.bgg) {
    const value = system.externalRefs.bgg;
    const href = value.startsWith("http")
      ? value
      : `https://boardgamegeek.com/boardgame/${value
          .replace(/^\/?boardgame\//, "")
          .replace(/^\/?rpg\//, "")
          .replace(/^\//, "")}`;
    refs.push({ href, label: t("references.boardgamegeek") });
  }
  if (system.externalRefs.wikipedia) {
    const value = system.externalRefs.wikipedia;
    const href = value.startsWith("http")
      ? value
      : `https://en.wikipedia.org/wiki/${encodeURIComponent(value)}`;
    refs.push({ href, label: t("references.wikipedia") });
  }
  return refs;
}
