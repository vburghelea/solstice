import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, CreditCard, ScrollText, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

// Translation-aware constants will be populated in the component

export const Route = createFileRoute("/resources/toolkit")({
  component: CommunityStarterToolkitPage,
});

function CommunityStarterToolkitPage() {
  const { t } = useResourcesTranslation();

  // Translation-aware constants
  const readinessBlocks = [
    {
      title: t("toolkit.readiness_blocks.founding_documents.title"),
      description: t("toolkit.readiness_blocks.founding_documents.description"),
      icon: ScrollText,
    },
    {
      title: t("toolkit.readiness_blocks.financial_runway.title"),
      description: t("toolkit.readiness_blocks.financial_runway.description"),
      icon: CreditCard,
    },
    {
      title: t("toolkit.readiness_blocks.people_operations.title"),
      description: t("toolkit.readiness_blocks.people_operations.description"),
      icon: UsersIcon,
    },
    {
      title: t("toolkit.readiness_blocks.quality_standards.title"),
      description: t("toolkit.readiness_blocks.quality_standards.description"),
      icon: CheckCircle2,
    },
  ];

  const phases = [
    {
      title: t("toolkit.phases.weeks_1_2.title"),
      items: Array.isArray(t("toolkit.phases.weeks_1_2.items"))
        ? (t("toolkit.phases.weeks_1_2.items") as unknown as string[])
        : ["Loading items..."],
    },
    {
      title: t("toolkit.phases.weeks_3_4.title"),
      items: Array.isArray(t("toolkit.phases.weeks_3_4.items"))
        ? (t("toolkit.phases.weeks_3_4.items") as unknown as string[])
        : ["Loading items..."],
    },
    {
      title: t("toolkit.phases.weeks_5_6.title"),
      items: Array.isArray(t("toolkit.phases.weeks_5_6.items"))
        ? (t("toolkit.phases.weeks_5_6.items") as unknown as string[])
        : ["Loading items..."],
    },
  ];

  return (
    <PublicLayout>
      <HeroSection
        eyebrow={t("toolkit.hero.eyebrow")}
        title={t("toolkit.hero.title")}
        subtitle={t("toolkit.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("toolkit.hero.cta_text")}
        ctaLink="#download"
        secondaryCta={{
          text: t("toolkit.hero.secondary_cta"),
          link: "mailto:development@roundup.games?subject=Community%20starter%20support",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("toolkit.whats_inside.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("toolkit.whats_inside.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("toolkit.whats_inside.description")}
            </p>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("toolkit.core_documents.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                {Array.isArray(t("toolkit.core_documents.items")) ? (
                  (t("toolkit.core_documents.items") as unknown as string[]).map(
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    (item, index) => <li key={`core-doc-${index}`}>• {item}</li>,
                  )
                ) : (
                  <li key="loading-core-docs">Loading core documents...</li>
                )}
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("toolkit.planning_tools.title")}
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                {Array.isArray(t("toolkit.planning_tools.items")) ? (
                  (t("toolkit.planning_tools.items") as unknown as string[]).map(
                    // eslint-disable-next-line @eslint-react/no-array-index-key
                    (item, index) => <li key={`planning-tool-${index}`}>• {item}</li>,
                  )
                ) : (
                  <li key="loading-planning-tools">Loading planning tools...</li>
                )}
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {readinessBlocks.map((block) => (
              <Card
                key={block.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur transition-colors dark:border-gray-700 dark:bg-gray-900/70"
              >
                <CardHeader className="flex items-center gap-4 sm:flex-row">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <block.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    {block.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("toolkit.how_to_use.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("toolkit.how_to_use.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("toolkit.how_to_use.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.isArray(phases) ? (
              phases.map((phase) => (
                <Card
                  key={phase.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70"
                >
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      {phase.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                      {Array.isArray(phase.items) ? (
                        phase.items.map((item, index) => (
                          // eslint-disable-next-line @eslint-react/no-array-index-key
                          <li key={`${phase.title}-item-${index}`}>• {item}</li>
                        ))
                      ) : (
                        <li key={`${phase.title}-loading`}>Loading items...</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                {t("toolkit.loading.toolkit_phases")}
              </div>
            )}
          </div>
        </div>
      </section>
      <section
        id="download"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("toolkit.downloads.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            {t("toolkit.downloads.description")}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("toolkit.downloads.formats.zip.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("toolkit.downloads.formats.zip.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-toolkit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("toolkit.downloads.formats.zip.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("toolkit.downloads.formats.docx.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("toolkit.downloads.formats.docx.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.docx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("toolkit.downloads.formats.docx.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("toolkit.downloads.formats.sheets.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("toolkit.downloads.formats.sheets.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-budget-template.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("toolkit.downloads.formats.sheets.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
            {t("toolkit.downloads.support.description", {
              email: (
                <a
                  className="text-brand-red font-semibold hover:underline"
                  href="mailto:development@roundup.games?subject=Toolkit%20support"
                >
                  {t("toolkit.downloads.support.email")}
                </a>
              ),
            })}
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
