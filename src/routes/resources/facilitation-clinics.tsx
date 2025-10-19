import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

export const Route = createFileRoute("/resources/facilitation-clinics")({
  component: FacilitationClinicsPage,
});

function FacilitationClinicsPage() {
  const { t } = useResourcesTranslation();
  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("facilitation_clinics.hero.eyebrow")}
        title={t("facilitation_clinics.hero.title")}
        subtitle={t("facilitation_clinics.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("facilitation_clinics.hero.cta_text")}
        ctaLink="#clinic-library"
        secondaryCta={{
          text: t("facilitation_clinics.hero.secondary_cta"),
          link: "mailto:training@roundup.games?subject=Facilitation%20coaching",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("facilitation_clinics.format.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("facilitation_clinics.format.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("facilitation_clinics.format.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.isArray(t("facilitation_clinics.modules")) ? (
              (
                t("facilitation_clinics.modules") as unknown as Array<{
                  title: string;
                  duration: string;
                  focus: string;
                  resources: string[];
                }>
              ).map((module) => (
                <Card key={module.title} className={cardSurfaceClass}>
                  <CardHeader className="space-y-3">
                    <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                      <CalendarIcon className="size-6" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {module.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t("facilitation_clinics.runtime_label")} {module.duration}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{module.focus}</p>
                    <ul className="space-y-2">
                      {module.resources.map((resource) => (
                        <li key={resource}>• {resource}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">
                {t("facilitation_clinics.loading_clinics")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        id="clinic-library"
        className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("facilitation_clinics.streaming_access.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("facilitation_clinics.streaming_access.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("facilitation_clinics.streaming_access.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("facilitation_clinics.streaming_access.request_access.title")}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {t("facilitation_clinics.streaming_access.request_access.description")}
              </p>
              <Button asChild className="sm:w-fit">
                <a href="mailto:training@roundup.games?subject=Facilitation%20clinic%20access">
                  {t("facilitation_clinics.streaming_access.request_access.button")}
                </a>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("facilitation_clinics.discussion_guide.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("facilitation_clinics.discussion_guide.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-clinic-discussion-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("facilitation_clinics.discussion_guide.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("facilitation_clinics.certification_credits.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("facilitation_clinics.certification_credits.description")}</p>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    •{" "}
                    {t(
                      "facilitation_clinics.certification_credits.credits.hours_per_clinic",
                    )}
                    <br />•{" "}
                    {t(
                      "facilitation_clinics.certification_credits.credits.digital_badge",
                    )}
                    <br />•{" "}
                    {t(
                      "facilitation_clinics.certification_credits.credits.counts_toward",
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("facilitation_clinics.downloads.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("facilitation_clinics.downloads.opening_rituals.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("facilitation_clinics.downloads.opening_rituals.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-opening-rituals.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("facilitation_clinics.downloads.opening_rituals.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("facilitation_clinics.downloads.safety_tools.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("facilitation_clinics.downloads.safety_tools.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-safety-tools.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("facilitation_clinics.downloads.safety_tools.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("facilitation_clinics.downloads.spotlight_scheduler.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  {t("facilitation_clinics.downloads.spotlight_scheduler.description")}
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-spotlight-scheduler.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("facilitation_clinics.downloads.spotlight_scheduler.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("facilitation_clinics.accessibility.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("facilitation_clinics.accessibility.description")}
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:accessibility@roundup.games?subject=Clinic%20accessibility">
                  {t("facilitation_clinics.accessibility.button")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
