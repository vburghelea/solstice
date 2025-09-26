import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, Trophy, UsersIcon } from "~/components/ui/icons";
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
        href: "https://cdn.roundup.games/community-toolkit.pdf",
      },
      {
        label: "View charter template",
        href: "https://cdn.roundup.games/club-charter.docx",
      },
    ],
  },
  {
    id: "training",
    title: "Session design library",
    description:
      "Adventure prompts, campaign handbooks, and board game rotation plans curated by experienced Game Masters and event hosts.",
    actions: [
      { label: "Browse session plans", href: "https://cdn.roundup.games/session-plans" },
      {
        label: "Watch facilitation clinics",
        href: "https://cdn.roundup.games/facilitation-clinics",
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
        href: "https://cdn.roundup.games/community-guidelines",
      },
      { label: "Report a concern", href: "mailto:care@roundup.games" },
    ],
  },
];

const certificationTracks = [
  {
    title: "Game Master pathway",
    description:
      "Self-paced modules covering session zero best practices, safety tools, and campaign pacing—perfect for storytellers leading long-form games.",
    icon: UsersIcon,
    cta: { label: "Start GM training", href: "https://learn.roundup.games/game-master" },
  },
  {
    title: "Community host pathway",
    description:
      "Workshops on event flow, table assignments, and welcoming new players—ideal for café managers and meetup organizers running open play nights.",
    icon: Trophy,
    cta: {
      label: "Register for host labs",
      href: "https://learn.roundup.games/community-host",
    },
  },
  {
    title: "Event operations pathway",
    description:
      "Step-by-step playbooks for scheduling tournaments, coordinating volunteers, and implementing streamlined check-in systems.",
    icon: CalendarIcon,
    cta: {
      label: "Download operations kit",
      href: "https://cdn.roundup.games/event-operations-kit",
    },
  },
];

export const Route = createFileRoute("/resources")({
  component: ResourcesPage,
});

function ResourcesPage() {
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

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          {resourceSections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                {section.title}
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-600 sm:text-base">
                {section.description}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {section.actions.map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    target={action.href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      action.href.startsWith("http") ? "noopener noreferrer" : undefined
                    }
                  >
                    <Button className="btn-brand-primary" variant="outline">
                      {action.label}
                    </Button>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Certification & education pathways
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600 sm:text-base">
            Our learning management system keeps your credentials current. Complete the
            online modules and book practical assessments hosted by provincial partners.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {certificationTracks.map((track) => (
              <div key={track.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="bg-brand-red/10 text-brand-red flex h-12 w-12 items-center justify-center rounded-full">
                  <track.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {track.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{track.description}</p>
                <a
                  className="text-brand-red mt-4 inline-block text-sm font-semibold hover:underline"
                  href={track.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {track.cta.label} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-brand-red text-sm font-semibold tracking-[0.3em] uppercase">
              Need something custom?
            </p>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Development staff hours for clubs
            </h2>
            <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
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
              <Link to="/teams">
                <Button
                  variant="outline"
                  className="text-brand-red border-brand-red hover:bg-brand-red/10"
                >
                  Connect with regional hubs
                </Button>
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming workshops</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• Mar 9 · Hybrid practice design for mixed experience teams</li>
              <li>• Apr 4 · Funding your club through grants & sponsorship</li>
              <li>• Apr 21 · Volunteer onboarding and retention playbook</li>
              <li>• May 5 · Tournament operations with EventKit</li>
            </ul>
            <p className="mt-6 text-xs tracking-[0.3em] text-gray-500 uppercase">
              Registrations open two weeks in advance
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
