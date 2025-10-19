import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { SafeLink } from "~/components/ui/SafeLink";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "~/shared/lib/cloudinary-assets";

// Note: These constants will be populated with translation keys in the component
// They remain empty here as they need access to the translation function

export const Route = createFileRoute("/resources/")({
  component: ResourcesIndexPage,
});

function ResourcesIndexPage() {
  const { t } = useResourcesTranslation();

  // Translation-aware constants
  const resourceSections = [
    {
      id: "club-toolkit",
      title: t("sections.club_toolkit.title"),
      description: t("sections.club_toolkit.description"),
      actions: [
        {
          label: t("sections.club_toolkit.actions.download_toolkit"),
          href: "/resources/toolkit",
        },
        {
          label: t("sections.club_toolkit.actions.view_charter"),
          href: "/resources/charter-template",
        },
      ],
    },
    {
      id: "training",
      title: t("sections.training.title"),
      description: t("sections.training.description"),
      actions: [
        {
          label: t("sections.training.actions.browse_plans"),
          href: "/resources/session-plans",
        },
        {
          label: t("sections.training.actions.watch_clinics"),
          href: "/resources/facilitation-clinics",
        },
      ],
    },
    {
      id: "safe-sport",
      title: t("sections.safe_sport.title"),
      description: t("sections.safe_sport.description"),
      actions: [
        {
          label: t("sections.safe_sport.actions.download_policies"),
          href: "/resources/safety-policies",
        },
        {
          label: t("sections.safe_sport.actions.report_concern"),
          href: "/resources/report-concern",
        },
      ],
    },
  ];

  const certificationTracks = [
    {
      title: t("certification.tracks.gm_pathway.title"),
      description: t("certification.tracks.gm_pathway.description"),
      icon: UsersIcon,
      cta: {
        label: t("certification.tracks.gm_pathway.cta"),
        href: "/resources/game-master-pathway",
      },
    },
    {
      title: t("certification.tracks.host_pathway.title"),
      description: t("certification.tracks.host_pathway.description"),
      icon: Trophy,
      cta: {
        label: t("certification.tracks.host_pathway.cta"),
        href: "/resources/community-host-pathway",
      },
    },
    {
      title: t("certification.tracks.operations_pathway.title"),
      description: t("certification.tracks.operations_pathway.description"),
      icon: CalendarIcon,
      cta: {
        label: t("certification.tracks.operations_pathway.cta"),
        href: "/resources/event-operations-kit",
      },
    },
  ];

  const officeHoursServices = [
    t("consultation.office_hours.services.funding_strategy"),
    t("consultation.office_hours.services.operations_audit"),
    t("consultation.office_hours.services.volunteer_mapping"),
    t("consultation.office_hours.services.conduct_review"),
  ];

  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("hero.cta_text")}
        ctaLink="#club-toolkit"
        secondaryCta={{
          text: t("hero.secondary_cta"),
          link: "mailto:development@roundup.games",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          {resourceSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70"
            >
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-gray-50">
                {section.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base dark:text-gray-300">
                {section.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {section.actions.map((action) => {
                  const isExternal =
                    action.href.startsWith("http") || action.href.startsWith("mailto");
                  return isExternal ? (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="btn-brand-primary" variant="outline">
                        {action.label}
                      </Button>
                    </a>
                  ) : (
                    <Button
                      key={action.label}
                      className="btn-brand-primary"
                      variant="outline"
                      asChild
                    >
                      <SafeLink to={action.href}>{action.label}</SafeLink>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("certification.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base dark:text-gray-300">
            {t("certification.subtitle")}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {certificationTracks.map((track) => (
              <div
                key={track.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70"
              >
                <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex h-12 w-12 items-center justify-center rounded-full">
                  <track.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {track.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  {track.description}
                </p>
                {track.cta.href.startsWith("http") ? (
                  <a
                    className="text-brand-red mt-4 inline-block text-sm font-semibold hover:underline"
                    href={track.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {track.cta.label} →
                  </a>
                ) : (
                  <SafeLink
                    className="text-brand-red mt-4 inline-block text-sm font-semibold hover:underline"
                    to={track.cta.href}
                  >
                    {track.cta.label} →
                  </SafeLink>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              {t("consultation.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("consultation.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              {t("consultation.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://cal.com/roundupgames/community-success">
                <Button className="btn-brand-primary" variant="default">
                  {t("consultation.actions.schedule_meeting")}
                </Button>
              </a>
              <Link to="/teams">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  {t("consultation.actions.connect_hubs")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              {t("consultation.office_hours.title")}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              {officeHoursServices.map((service) => (
                <li key={service}>• {service}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
