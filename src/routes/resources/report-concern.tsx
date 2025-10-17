import { createFileRoute } from "@tanstack/react-router";
import React from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import {
  AlertCircle,
  CheckCircle2,
  PenSquareIcon,
  UsersIcon,
} from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const reportStepsIcons = [AlertCircle, PenSquareIcon, UsersIcon];

const channelCardsData = [
  {
    key: "urgent_safety",
    actionHref: "tel:+18557686387",
  },
  {
    key: "conduct_violation",
    actionHref: "mailto:conduct@roundup.games",
  },
  {
    key: "data_issue",
    actionHref: "mailto:security@roundup.games",
  },
  {
    key: "accessibility_request",
    actionHref: "mailto:accessibility@roundup.games",
  },
];

const supportResourcesData = [
  {
    title: "Mental health warmline",
    description: "Peer support for stress, burnout, and processing tough sessions.",
    linkLabel: "Call 1-888-555-2222",
    linkHref: "tel:+18885552222",
  },
  {
    title: "Restorative circle facilitators",
    description:
      "Independent practitioners trained in trauma-informed, community-led healing.",
    linkLabel: "Request referral",
    linkHref: "mailto:care@roundup.games?subject=Restorative%20support",
  },
  {
    title: "Digital safety clinic",
    description:
      "Security volunteers who help secure devices and accounts after incidents.",
    linkLabel: "Book an appointment",
    linkHref: "https://cal.com/roundupgames/security-clinic",
  },
];

export const Route = createFileRoute("/resources/report-concern")({
  component: ReportConcernPage,
});

function ReportConcernPage() {
  const { t } = useResourcesTranslation();

  return (
    <PublicLayout>
      <HeroSection
        eyebrow={t("report_concern.hero.eyebrow")}
        title={t("report_concern.hero.title")}
        subtitle={t("report_concern.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("report_concern.hero.cta_text")}
        ctaLink="#reporting-steps"
        secondaryCta={{
          text: t("report_concern.hero.secondary_cta"),
          link: "/resources/safety-policies",
        }}
      />

      <section
        id="reporting-steps"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("report_concern.reporting_steps.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("report_concern.reporting_steps.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("report_concern.reporting_steps.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(t("report_concern.reporting_steps.steps")) ? (
              (
                t("report_concern.reporting_steps.steps") as unknown as Array<{
                  title: string;
                  description: string;
                }>
              ).map((step, index) => (
                <Card key={step.title} className={cardSurfaceClass}>
                  <CardHeader className="flex items-start gap-4">
                    <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                      {React.createElement(reportStepsIcons[index], {
                        className: "size-6",
                      })}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                        {step.title}
                      </CardTitle>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                {t("report_concern.loading.reporting_steps")}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("report_concern.channels.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("report_concern.channels.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("report_concern.channels.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {channelCardsData.map((channelData) => {
              const channel = t(
                `report_concern.channels.${channelData.key}`,
              ) as unknown as {
                title: string;
                description: string;
                contact: string;
                action_label: string;
                notes: string;
              };
              return (
                <Card key={channelData.key} className={mutedCardSurfaceClass}>
                  <CardHeader className="space-y-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {channel.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {t("report_concern.channels.contact_label")}: {channel.contact}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{channel.description}</p>
                    <Button asChild>
                      <a href={channelData.actionHref}>{channel.action_label}</a>
                    </Button>
                    <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                      {channel.notes}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("report_concern.what_to_expect.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("report_concern.what_to_expect.title")}
            </h2>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {Array.isArray(t("report_concern.what_to_expect.expectations"))
                ? (
                    t("report_concern.what_to_expect.expectations") as unknown as string[]
                  ).map((expectation, index) => (
                    <li key={`expectation-${index}-${expectation.slice(0, 20)}`}>
                      • {expectation}
                    </li>
                  ))
                : null}
            </ul>
          </div>
          <div className={cardSurfaceClass + " space-y-4"}>
            <div className="flex items-start gap-4">
              <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("report_concern.what_to_expect.live_support.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("report_concern.what_to_expect.live_support.description")}
                </p>
                <Button asChild variant="outline" className="justify-center sm:w-fit">
                  <a href="https://cal.com/roundupgames/community-care">
                    {t("report_concern.what_to_expect.live_support.action_label")}
                  </a>
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <p>{t("report_concern.what_to_expect.anonymous_note")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("report_concern.support_resources.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            {t("report_concern.support_resources.description")}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.isArray(t("report_concern.support_resources.resources")) ? (
              (
                t("report_concern.support_resources.resources") as unknown as Array<{
                  title: string;
                  description: string;
                  action_label: string;
                }>
              ).map((resource, index) => (
                <Card key={resource.title} className={mutedCardSurfaceClass}>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                      {resource.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    <p>{resource.description}</p>
                    <Button asChild variant="outline" className="justify-center">
                      <a href={supportResourcesData[index].linkHref}>
                        {resource.action_label}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500">
                {t("report_concern.loading.support_resources")}
              </div>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
