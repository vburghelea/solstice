import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, Info, PenSquareIcon, UsersIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

// Translation-aware constants will be populated in the component

export const Route = createFileRoute("/resources/safety-policies")({
  component: SafetyPoliciesPage,
});

function SafetyPoliciesPage() {
  const { t } = useResourcesTranslation();

  // Translation-aware constants
  const policyPillars = [
    {
      title: t("safety_policies.pillars.people_first.title"),
      description: t("safety_policies.pillars.people_first.description"),
      icon: UsersIcon,
    },
    {
      title: t("safety_policies.pillars.consent_driven.title"),
      description: t("safety_policies.pillars.consent_driven.description"),
      icon: CheckCircle2,
    },
    {
      title: t("safety_policies.pillars.data_stewardship.title"),
      description: t("safety_policies.pillars.data_stewardship.description"),
      icon: PenSquareIcon,
    },
  ];

  const lifecycleSections = [
    {
      key: "before",
      data: t("safety_policies.policy_library.lifecycle.before") as unknown as {
        title: string;
        items: string[];
      },
    },
    {
      key: "during",
      data: t("safety_policies.policy_library.lifecycle.during") as unknown as {
        title: string;
        items: string[];
      },
    },
    {
      key: "after",
      data: t("safety_policies.policy_library.lifecycle.after") as unknown as {
        title: string;
        items: string[];
      },
    },
    {
      key: "digital",
      data: t("safety_policies.policy_library.lifecycle.digital") as unknown as {
        title: string;
        items: string[];
      },
    },
  ];

  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("safety_policies.hero.eyebrow")}
        title={t("safety_policies.hero.title")}
        subtitle={t("safety_policies.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("safety_policies.hero.cta_text")}
        ctaLink="#policy-downloads"
        secondaryCta={{
          text: t("safety_policies.hero.secondary_cta"),
          link: "/resources/report-concern",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("safety_policies.approach.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("safety_policies.approach.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("safety_policies.approach.description")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {policyPillars.map((pillar) => (
              <Card key={pillar.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <pillar.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {pillar.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {pillar.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("safety_policies.policy_library.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("safety_policies.policy_library.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("safety_policies.policy_library.description")}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {lifecycleSections.map((section) => (
                <Card key={section.key} className={mutedCardSurfaceClass}>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      {section.data.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    {Array.isArray(section.data.items)
                      ? section.data.items.map((item: string) => (
                          <p key={item}>• {item}</p>
                        ))
                      : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("safety_policies.policy_library.timeline.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("safety_policies.policy_library.timeline.description")}</p>
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                  {Array.isArray(t("safety_policies.policy_library.timeline.schedule"))
                    ? (
                        t(
                          "safety_policies.policy_library.timeline.schedule",
                        ) as unknown as string[]
                      ).map((item, index, arr) => (
                        <span key={item}>
                          • {item}
                          {index < arr.length - 1 && (
                            <>
                              <br />
                            </>
                          )}
                        </span>
                      ))
                    : null}
                </div>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("safety_policies.policy_library.transparency.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("safety_policies.policy_library.transparency.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a href="mailto:safety@roundup.games?subject=Transparency%20reports">
                    {t("safety_policies.policy_library.transparency.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="policy-downloads"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("safety_policies.downloads.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("safety_policies.downloads.formats.handbook.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("safety_policies.downloads.formats.handbook.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-safety-handbook.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("safety_policies.downloads.formats.handbook.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("safety_policies.downloads.formats.data_protection.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  {t("safety_policies.downloads.formats.data_protection.description")}
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/data-protection-addendum.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("safety_policies.downloads.formats.data_protection.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("safety_policies.downloads.formats.accessibility.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("safety_policies.downloads.formats.accessibility.description")}</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/accessibility-playbook.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("safety_policies.downloads.formats.accessibility.button")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("safety_policies.downloads.custom_policies.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("safety_policies.downloads.custom_policies.description")}
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:legal@roundup.games?subject=Venue%20policy%20support">
                  {t("safety_policies.downloads.custom_policies.button")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("safety_policies.questions.title")}
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            {t("safety_policies.questions.description")}
          </p>
          <div className={mutedCardSurfaceClass}>
            <div className="flex items-start gap-4">
              <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                <Info className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("safety_policies.questions.emergency.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("safety_policies.questions.emergency.description")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
