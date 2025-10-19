import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, Trophy } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

export const Route = createFileRoute("/resources/game-master-pathway")({
  component: GameMasterPathwayPage,
});

function GameMasterPathwayPage() {
  const { t } = useResourcesTranslation();

  const resources = [
    {
      title: t("game_master_pathway.resources.narrative_workbook.title"),
      description: t("game_master_pathway.resources.narrative_workbook.description"),
      button: t("game_master_pathway.resources.narrative_workbook.button"),
      href: "https://cdn.roundup.games/gm-pathway-narrative-workbook.pdf",
    },
    {
      title: t("game_master_pathway.resources.safety_toolkit.title"),
      description: t("game_master_pathway.resources.safety_toolkit.description"),
      button: t("game_master_pathway.resources.safety_toolkit.button"),
      href: "https://cdn.roundup.games/gm-pathway-safety-toolkit.zip",
    },
    {
      title: t("game_master_pathway.resources.performance_guide.title"),
      description: t("game_master_pathway.resources.performance_guide.description"),
      button: t("game_master_pathway.resources.performance_guide.button"),
      href: "https://cdn.roundup.games/gm-pathway-performance-guide.pdf",
    },
  ];
  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("game_master_pathway.hero.eyebrow")}
        title={t("game_master_pathway.hero.title")}
        subtitle={t("game_master_pathway.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("game_master_pathway.hero.cta_text")}
        ctaLink="#enroll"
        secondaryCta={{
          text: t("game_master_pathway.hero.secondary_cta"),
          link: "/resources/session-plans",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("game_master_pathway.curriculum.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("game_master_pathway.curriculum.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("game_master_pathway.curriculum.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.isArray(t("game_master_pathway.curriculum.milestones")) ? (
              (
                t("game_master_pathway.curriculum.milestones") as unknown as Array<{
                  title: string;
                  duration: string;
                  outcomes: string[];
                }>
              ).map((milestone) => (
                <Card key={milestone.title} className={cardSurfaceClass}>
                  <CardHeader className="space-y-3">
                    <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                      <Trophy className="size-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {milestone.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("game_master_pathway.curriculum.recommended_pace", {
                        duration: milestone.duration,
                      })}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    {milestone.outcomes.map((outcome) => (
                      <p key={outcome}>• {outcome}</p>
                    ))}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                Loading curriculum milestones...
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("game_master_pathway.learning.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("game_master_pathway.learning.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("game_master_pathway.learning.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("game_master_pathway.learning.weekly_rhythm.title")}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {Array.isArray(t("game_master_pathway.learning.weekly_rhythm.schedule"))
                  ? (
                      t(
                        "game_master_pathway.learning.weekly_rhythm.schedule",
                      ) as unknown as string[]
                    ).map((item, index) => (
                      // eslint-disable-next-line @eslint-react/no-array-index-key
                      <li key={`schedule-item-${index}-${item.slice(0, 20)}`}>
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
                  {t("game_master_pathway.learning.portfolio.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("game_master_pathway.learning.portfolio.description")}</p>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("game_master_pathway.learning.alumni.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("game_master_pathway.learning.alumni.description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("game_master_pathway.resources.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {resources.map((resource, index) => (
              <Card
                // eslint-disable-next-line @eslint-react/no-array-index-key
                key={`resource-${index}-${resource.title.slice(0, 20)}`}
                className={cardSurfaceClass}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {resource.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{resource.description}</p>
                  <Button asChild variant="outline" className="justify-center">
                    <a href={resource.href} target="_blank" rel="noopener noreferrer">
                      {resource.button}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="enroll" className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("game_master_pathway.enrollment.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("game_master_pathway.enrollment.title")}
            </h2>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {Array.isArray(t("game_master_pathway.enrollment.cohorts"))
                ? (
                    t("game_master_pathway.enrollment.cohorts") as unknown as string[]
                  ).map((cohort, index) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <li key={`cohort-${index}-${cohort.slice(0, 20)}`}>• {cohort}</li>
                  ))
                : null}
            </ul>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("game_master_pathway.enrollment.tuition")}
            </p>
            <Button asChild className="sm:w-fit">
              <a href="https://cal.com/roundupgames/gm-intake">
                {t("game_master_pathway.enrollment.cta_button")}
              </a>
            </Button>
          </div>
          <div className={mutedCardSurfaceClass + " space-y-3"}>
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              {t("game_master_pathway.enrollment.requirements.title")}
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              {Array.isArray(t("game_master_pathway.enrollment.requirements.items"))
                ? (
                    t(
                      "game_master_pathway.enrollment.requirements.items",
                    ) as unknown as string[]
                  ).map((item, index) => (
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    <li key={`requirement-${index}-${item.slice(0, 20)}`}>• {item}</li>
                  ))
                : null}
            </ul>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              {t("game_master_pathway.enrollment.contact.questions", {
                email: (
                  <a
                    className="text-brand-red font-semibold hover:underline"
                    href="mailto:training@roundup.games?subject=GM%20pathway%20question"
                  >
                    {t("game_master_pathway.enrollment.contact.email")}
                  </a>
                ),
              })}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-brand-red pt-1">
                  <CheckCircle2 className="size-5" />
                </div>
                <p>{t("game_master_pathway.enrollment.graduate_benefits")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
