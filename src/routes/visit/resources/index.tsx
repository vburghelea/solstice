import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { SafeLink } from "~/components/ui/SafeLink";
import { PublicLayout } from "~/features/layouts/public-layout";

const resourceSections = [
  {
    id: "club-toolkit",
    title: "Community starter toolkit",
    description:
      "Charters, budget planners, sponsorship decks, and onboarding emails tailored for tabletop clubs and board game cafés.",
    actions: [
      {
        label: "Download toolkit",
        href: "/visit/resources/toolkit",
      },
      {
        label: "View charter template",
        href: "/visit/resources/charter-template",
      },
    ],
  },
  {
    id: "training",
    title: "Session design library",
    description:
      "Adventure prompts, campaign handbooks, and board game rotation plans curated by experienced Game Masters and event hosts.",
    actions: [
      { label: "Browse session plans", href: "/visit/resources/session-plans" },
      {
        label: "Watch facilitation clinics",
        href: "/visit/resources/facilitation-clinics",
      },
    ],
  },
  {
    id: "safe-sport",
    title: "Safety & accessibility resources",
    description:
      "Policies, safety briefs, and inclusivity guidelines aligned with Roundup Games community standards.",
    actions: [
      {
        label: "Download policies",
        href: "/visit/resources/safety-policies",
      },
      { label: "Report a concern", href: "/visit/resources/report-concern" },
    ],
  },
];

const certificationTracks = [
  {
    title: "Game Master pathway",
    description:
      "Self-paced modules covering session zero best practices, safety tools, and campaign pacing—perfect for storytellers leading long-form games.",
    icon: UsersIcon,
    cta: { label: "Start GM training", href: "/visit/resources/game-master-pathway" },
  },
  {
    title: "Community host pathway",
    description:
      "Workshops on event flow, table assignments, and welcoming new players—ideal for café managers and meetup organizers running open play nights.",
    icon: Trophy,
    cta: {
      label: "Register for host labs",
      href: "/visit/resources/community-host-pathway",
    },
  },
  {
    title: "Event operations pathway",
    description:
      "Step-by-step playbooks for scheduling tournaments, coordinating volunteers, and implementing streamlined check-in systems.",
    icon: CalendarIcon,
    cta: {
      label: "Download operations kit",
      href: "/visit/resources/event-operations-kit",
    },
  },
];

export const Route = createFileRoute("/visit/resources/")({
  component: ResourcesIndexPage,
});

function ResourcesIndexPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Resources"
        title="Run unforgettable tabletop programs"
        subtitle="Toolkits, training plans, and certification pathways curated by the Roundup Games development team."
        backgroundImage="/images/hero-tabletop-board-game-resources-optimized.png"
        ctaText="Browse by category"
        ctaLink="#club-toolkit"
        secondaryCta={{
          text: "Request custom support",
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
            Certification & education pathways
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base dark:text-gray-300">
            Our learning management system keeps your credentials current. Complete the
            online modules and book practical assessments hosted by provincial partners.
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
              Need something custom?
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Development staff hours for clubs
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              Book a consultation with our staff to review grant applications, event bids,
              or long-term athlete development plans. We’ll work with you to tailor
              resources and connections for your region.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://cal.com/roundupgames/community-success">
                <Button className="btn-brand-primary" variant="default">
                  Schedule a meeting
                </Button>
              </a>
              <Link to="/visit/teams">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  Connect with regional hubs
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              Office hours menu
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              <li>• Funding strategy tune-up</li>
              <li>• Event operations audit</li>
              <li>• Volunteer journey mapping</li>
              <li>• Community code of conduct review</li>
            </ul>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
