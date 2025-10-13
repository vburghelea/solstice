import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const capabilityTracks = [
  {
    title: "Hospitality & inclusivity",
    focus:
      "Designing arrivals, orientations, and table assignments that make every visitor feel welcome from the first hello.",
    highlights: [
      "Front-of-house rituals and sensory-friendly signage",
      "Pronoun best practices and cultural competency drills",
      "De-escalation playbook for common venue scenarios",
    ],
  },
  {
    title: "Operational excellence",
    focus:
      "Master event logistics—from equipment prep and volunteer wrangling to live troubleshooting and closing procedures.",
    highlights: [
      "Run of show templates with contingency triggers",
      "Inventory and table layout mapping",
      "Incident reporting and hand-off protocols",
    ],
  },
  {
    title: "Community growth",
    focus:
      "Cultivate membership momentum with outreach, partnerships, and post-event storytelling.",
    highlights: [
      "Social media and newsletter content calendars",
      "Feedback loop design and retention benchmarks",
      "Partnership toolkit for cafés, libraries, and schools",
    ],
  },
];

export const Route = createFileRoute("/resources/community-host-pathway")({
  component: CommunityHostPathwayPage,
});

function CommunityHostPathwayPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Community host pathway"
        title="Grow gatherings that feel like home"
        subtitle="Training for event leads, café teams, and volunteers who turn spaces into memorable tabletop destinations."
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText="Apply for the next cohort"
        ctaLink="#apply"
        secondaryCta={{
          text: "Hire a certified host",
          link: "mailto:events@roundup.games?subject=Host%20booking",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Curriculum tracks
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Build hospitality, logistics, and growth superpowers
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Mix live workshops with shadow shifts at flagship Roundup venues. Hosts
              leave with repeatable systems, feedback frameworks, and a network of peers
              to trade playbooks with.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {capabilityTracks.map((track) => (
              <Card key={track.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <UsersIcon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {track.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{track.focus}</p>
                  <ul className="space-y-2">
                    {track.highlights.map((highlight) => (
                      <li key={highlight}>• {highlight}</li>
                    ))}
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
              Learn by doing
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Shadow shifts and practicum support
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Each participant completes two mentored shifts at high-traffic events.
              You'll practice intake, table transitions, and closings with feedback from
              senior hosts and community managers.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Practicum checklist
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <li>• Accessibility walkthrough and sensory calibration</li>
                <li>• Table turn management and waitlist triage</li>
                <li>• Player conflict mediation with restorative options</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Toolkit downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Includes floor plan templates, checklist poster sets, and post-event
                  survey automations.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-host-toolkit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Optional certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Add-on workshops cover food handling, first aid, and inclusive
                  programming for youth or seniors.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Playbooks & templates
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Opening night checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Step-by-step run of show for first-time attendees.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-host-opening-night.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Volunteer scheduling matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Dynamic spreadsheet for shift assignments and reminder automations.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-host-volunteer-matrix.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download XLSX
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Retention campaign kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Email drips, social captions, and highlight reels to keep players coming
                  back.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-host-retention-kit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="apply" className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Application process
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Rolling admissions with quarterly start dates
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Submit your application to join the next cohort. We prioritize teams serving
              marginalized players, rural regions, and new venue launches.
            </p>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              <li>• Virtual info sessions on the first Tuesday of each month</li>
              <li>• Application review within five business days</li>
              <li>• Group interviews focused on scenario planning</li>
              <li>• Scholarships and sliding scale pricing available</li>
            </ul>
            <Button asChild className="sm:w-fit">
              <a href="https://cal.com/roundupgames/host-intake">
                Start application call
              </a>
            </Button>
          </div>
          <div className={mutedCardSurfaceClass + " space-y-3"}>
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              Certification maintenance
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              <li>• Renew CPR/first aid every two years</li>
              <li>• Complete two micro-courses from the facilitation clinic library</li>
              <li>• Submit quarterly event metrics and community stories</li>
            </ul>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              Program questions? Email
              <a
                className="text-brand-red font-semibold hover:underline"
                href="mailto:events@roundup.games?subject=Community%20host%20pathway"
              >
                events@roundup.games
              </a>
              .
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <div className="text-brand-red pt-1">
                  <CheckCircle2 className="size-5" />
                </div>
                <p>
                  Graduates receive a digital badge and placement support with affiliated
                  cafés, libraries, and convention partners across Canada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
