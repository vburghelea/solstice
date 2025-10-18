import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, CreditCard, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const operationsPhaseIcons = [CreditCard, CalendarIcon, UsersIcon];

const downloadUrls = {
  automation_pack: "https://cdn.roundup.games/event-ops-automation-pack.zip",
  vendor_kit: "https://cdn.roundup.games/event-ops-vendor-kit.pdf",
  operations_bundle: "https://cdn.roundup.games/event-operations-kit.zip",
  run_of_show: "https://cdn.roundup.games/event-ops-run-of-show.xlsx",
  compliance_binder: "https://cdn.roundup.games/event-ops-compliance-binder.pdf",
  discord: "https://discord.gg/roundup-operations",
};

export const Route = createFileRoute("/resources/event-operations-kit")({
  component: EventOperationsKitPage,
});

function EventOperationsKitPage() {
  const { t } = useResourcesTranslation();

  return (
    <PublicLayout>
      <HeroSection
        eyebrow={t("event_operations_kit.hero.eyebrow")}
        title={t("event_operations_kit.hero.title")}
        subtitle={t("event_operations_kit.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("event_operations_kit.hero.cta_text")}
        ctaLink="#downloads"
        secondaryCta={{
          text: t("event_operations_kit.hero.secondary_cta"),
          link: "mailto:events@roundup.games?subject=Operations%20support",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("event_operations_kit.operating_system.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("event_operations_kit.operating_system.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("event_operations_kit.operating_system.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {Array.isArray(t("event_operations_kit.operating_system.phases")) ? (
              (
                t("event_operations_kit.operating_system.phases") as unknown as Array<{
                  title: string;
                  description: string;
                  bullets: string[];
                }>
              ).map((phase, index) => (
                <Card key={phase.title} className={cardSurfaceClass}>
                  <CardHeader className="space-y-3">
                    <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                      {React.createElement(operationsPhaseIcons[index], {
                        className: "size-6",
                      })}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {phase.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{phase.description}</p>
                    <ul className="space-y-2">
                      {phase.bullets.map((bullet) => (
                        <li key={bullet}>• {bullet}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Fallback loading state or empty state
              <div className="col-span-full text-center text-gray-500">
                {t("event_operations_kit.loading.phases")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("event_operations_kit.liveops.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("event_operations_kit.liveops.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("event_operations_kit.liveops.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("event_operations_kit.liveops.widgets_title")}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {Array.isArray(t("event_operations_kit.liveops.widgets"))
                  ? (
                      t("event_operations_kit.liveops.widgets") as unknown as string[]
                    ).map((widget, index) => (
                      // eslint-disable-next-line @eslint-react/no-array-index-key
                      <li key={`widget-${index}-${widget.slice(0, 20)}`}>• {widget}</li>
                    ))
                  : null}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("event_operations_kit.liveops.automations_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("event_operations_kit.liveops.automations_description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href={downloadUrls.automation_pack}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("event_operations_kit.liveops.automations_button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("event_operations_kit.liveops.vendor_title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("event_operations_kit.liveops.vendor_description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href={downloadUrls.vendor_kit}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("event_operations_kit.liveops.vendor_button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="downloads"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("event_operations_kit.downloads.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(["operations_bundle", "run_of_show", "compliance_binder"] as const).map(
              (downloadKey) => {
                const download = t(
                  `event_operations_kit.downloads.${downloadKey}`,
                ) as unknown as { title: string; description: string; button: string };
                return (
                  <Card key={downloadKey} className={cardSurfaceClass}>
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                        {download.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                      <p>{download.description}</p>
                      <Button asChild variant="outline" className="justify-center">
                        <a
                          href={downloadUrls[downloadKey]}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {download.button}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("event_operations_kit.downloads.support_title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("event_operations_kit.downloads.support_description")}
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:events@roundup.games?subject=Custom%20event%20ops">
                  {t("event_operations_kit.downloads.support_button")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("event_operations_kit.community.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            {t("event_operations_kit.community.description")}
          </p>
          <Button asChild className="sm:w-fit">
            <a href={downloadUrls.discord} target="_blank" rel="noopener noreferrer">
              {t("event_operations_kit.community.action_button")}
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
