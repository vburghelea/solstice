import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, ScrollText, UsersIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

// Translation-aware constants will be populated in the component

export const Route = createFileRoute("/resources/charter-template")({
  component: CharterTemplatePage,
});

function CharterTemplatePage() {
  const { t } = useResourcesTranslation();

  // Translation-aware constants
  const charterSections = [
    {
      title: t("charter_template.sections.mission_values.title"),
      description: t("charter_template.sections.mission_values.description"),
      icon: ScrollText,
      highlights: t(
        "charter_template.sections.mission_values.highlights",
      ) as unknown as string[],
    },
    {
      title: t("charter_template.sections.membership_governance.title"),
      description: t("charter_template.sections.membership_governance.description"),
      icon: UsersIcon,
      highlights: t(
        "charter_template.sections.membership_governance.highlights",
      ) as unknown as string[],
    },
    {
      title: t("charter_template.sections.programming_safety.title"),
      description: t("charter_template.sections.programming_safety.description"),
      icon: CheckCircle2,
      highlights: t(
        "charter_template.sections.programming_safety.highlights",
      ) as unknown as string[],
    },
  ];

  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("charter_template.hero.eyebrow")}
        title={t("charter_template.hero.title")}
        subtitle={t("charter_template.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("charter_template.hero.cta_text")}
        ctaLink="#charter-downloads"
        secondaryCta={{
          text: t("charter_template.hero.secondary_cta"),
          link: "mailto:development@roundup.games?subject=Charter%20facilitation",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("charter_template.why_works.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("charter_template.why_works.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("charter_template.why_works.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {charterSections.map((section) => (
              <Card key={section.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <section.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{section.description}</p>
                  <ul className="space-y-2">
                    {Array.isArray(section.highlights)
                      ? section.highlights.map((highlight) => (
                          <li key={highlight}>• {highlight}</li>
                        ))
                      : null}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("charter_template.facilitation.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("charter_template.facilitation.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("charter_template.facilitation.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("charter_template.facilitation.workshop_outline.title")}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {Array.isArray(t("charter_template.facilitation.workshop_outline.items"))
                  ? (
                      t(
                        "charter_template.facilitation.workshop_outline.items",
                      ) as unknown as string[]
                    ).map((item) => <li key={item}>• {item}</li>)
                  : null}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("charter_template.facilitation.toolkit.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("charter_template.facilitation.toolkit.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/charter-workshop-kit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("charter_template.facilitation.toolkit.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("charter_template.facilitation.scenario_cards.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("charter_template.facilitation.scenario_cards.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/charter-scenario-cards.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("charter_template.facilitation.scenario_cards.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="charter-downloads"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("charter_template.downloads.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("charter_template.downloads.formats.docx.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("charter_template.downloads.formats.docx.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.docx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("charter_template.downloads.formats.docx.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("charter_template.downloads.formats.pdf.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("charter_template.downloads.formats.pdf.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("charter_template.downloads.formats.pdf.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("charter_template.downloads.formats.markdown.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("charter_template.downloads.formats.markdown.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("charter_template.downloads.formats.markdown.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("charter_template.downloads.custom_clause.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("charter_template.downloads.custom_clause.description")}
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:policy@roundup.games?subject=Custom%20charter%20support">
                  {t("charter_template.downloads.custom_clause.button")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
