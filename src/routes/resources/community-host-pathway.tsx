import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, UsersIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const playbookDownloads = {
  opening_night: {
    href: "https://cdn.roundup.games/community-host-opening-night.pdf",
  },
  volunteer_matrix: {
    href: "https://cdn.roundup.games/community-host-volunteer-matrix.xlsx",
  },
  retention_kit: {
    href: "https://cdn.roundup.games/community-host-retention-kit.zip",
  },
};

export const Route = createFileRoute("/resources/community-host-pathway")({
  component: CommunityHostPathwayPage,
});

function CommunityHostPathwayPage() {
  const { t } = useResourcesTranslation();

  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("community_host_pathway.hero.eyebrow")}
        title={t("community_host_pathway.hero.title")}
        subtitle={t("community_host_pathway.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("community_host_pathway.hero.cta_text")}
        ctaLink="#apply"
        secondaryCta={{
          text: t("community_host_pathway.hero.secondary_cta"),
          link: "mailto:events@roundup.games?subject=Host%20booking",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("community_host_pathway.curriculum.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("community_host_pathway.curriculum.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("community_host_pathway.curriculum.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.isArray(t("community_host_pathway.curriculum.tracks")) ? (
              (
                t("community_host_pathway.curriculum.tracks") as unknown as Array<{
                  title: string;
                  focus: string;
                  highlights: string[];
                }>
              ).map((track) => (
                <Card key={track.title} className={cardSurfaceClass}>
                  <CardHeader className="space-y-3">
                    <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                      <UsersIcon className="size-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {track.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{track.focus}</p>
                    <ul className="space-y-2">
                      {track.highlights.map((highlight) => (
                        <li key={highlight}>• {highlight}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                {t("community_host_pathway.loading.curriculum_tracks")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("community_host_pathway.practicum.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("community_host_pathway.practicum.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("community_host_pathway.practicum.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("community_host_pathway.practicum.checklist_title")}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {Array.isArray(t("community_host_pathway.practicum.checklist_items"))
                  ? (
                      t(
                        "community_host_pathway.practicum.checklist_items",
                      ) as unknown as string[]
                    ).map((item, index) => (
                      // eslint-disable-next-line @eslint-react/no-array-index-key
                      <li key={`checklist-item-${index}-${item.slice(0, 20)}`}>
                        • {item}
                      </li>
                    ))
                  : null}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("community_host_pathway.practicum.toolkit_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("community_host_pathway.practicum.toolkit_description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-host-toolkit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("community_host_pathway.practicum.toolkit_button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("community_host_pathway.practicum.certifications_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("community_host_pathway.practicum.certifications_description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("community_host_pathway.playbooks.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Object.entries(playbookDownloads).map(([key, download]) => {
              const playbook = t(
                `community_host_pathway.playbooks.${key}`,
              ) as unknown as { title: string; description: string; button: string };
              return (
                <Card key={key} className={cardSurfaceClass}>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      {playbook.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{playbook.description}</p>
                    <Button asChild variant="outline" className="justify-center">
                      <a href={download.href} target="_blank" rel="noopener noreferrer">
                        {playbook.button}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section id="apply" className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("community_host_pathway.application.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("community_host_pathway.application.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("community_host_pathway.application.description")}
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {Array.isArray(t("community_host_pathway.application.process_items"))
                ? (
                    t(
                      "community_host_pathway.application.process_items",
                    ) as unknown as string[]
                  ).map((item, index) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <li key={`process-item-${index}-${item.slice(0, 20)}`}>• {item}</li>
                  ))
                : null}
            </ul>
            <Button asChild className="sm:w-fit">
              <a href="https://cal.com/roundupgames/host-intake">
                {t("community_host_pathway.application.action_button")}
              </a>
            </Button>
          </div>
          <div className={mutedCardSurfaceClass + " space-y-3"}>
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              {t("community_host_pathway.application.maintenance_title")}
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              {Array.isArray(t("community_host_pathway.application.maintenance_items"))
                ? (
                    t(
                      "community_host_pathway.application.maintenance_items",
                    ) as unknown as string[]
                  ).map((item, index) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <li key={`maintenance-item-${index}-${item.slice(0, 20)}`}>
                      • {item}
                    </li>
                  ))
                : null}
            </ul>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              {t("community_host_pathway.application.contact_prompt")}{" "}
              <a
                className="text-brand-red font-semibold hover:underline"
                href="mailto:events@roundup.games?subject=Community%20host%20pathway"
              >
                {t("community_host_pathway.application.contact_email")}
              </a>
              .
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-brand-red pt-1">
                  <CheckCircle2 className="size-5" />
                </div>
                <p>{t("community_host_pathway.application.graduate_benefits")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
