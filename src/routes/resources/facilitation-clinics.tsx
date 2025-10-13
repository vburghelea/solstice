import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const clinicModules = [
  {
    title: "Setting the table",
    duration: "28 minutes",
    focus:
      "Hospitality rituals, onboarding scripts, and accessibility walkthroughs that calm first-session nerves.",
    resources: [
      "Facilitator opening script",
      "Room layout checklist",
      "Sensory considerations worksheet",
    ],
  },
  {
    title: "Safety tools in motion",
    duration: "34 minutes",
    focus:
      "Demonstrations of consent-based safety tools with live debrief and coaching tips for tricky moments.",
    resources: [
      "X-card and Open Door playset",
      "Lines & Veils sample prompts",
      "Escalation decision tree",
    ],
  },
  {
    title: "Pacing & spotlight management",
    duration: "31 minutes",
    focus:
      "Balancing action and reflection, supporting quieter players, and reading the table's energy in real time.",
    resources: [
      "Beat structure worksheet",
      "Audience engagement tracker",
      "Post-session reflection form",
    ],
  },
];

export const Route = createFileRoute("/resources/facilitation-clinics")({
  component: FacilitationClinicsPage,
});

function FacilitationClinicsPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Facilitation clinics"
        title="On-demand coaching for storytellers and hosts"
        subtitle="Watch master facilitators lead live sessions, then apply the same techniques at your tables with guided practice materials."
        backgroundImage={RESOURCES_HERO_IMAGE}
        ctaText="Stream the clinics"
        ctaLink="#clinic-library"
        secondaryCta={{
          text: "Book live coaching",
          link: "mailto:training@roundup.games?subject=Facilitation%20coaching",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Clinic format
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Learn by watching real tables in action
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Each clinic pairs a live-recorded session with commentary from Roundup Games
              facilitators. Pause at reflection markers to practice with your own staff,
              or use the included discussion prompts to turn the video into a team
              workshop.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {clinicModules.map((module) => (
              <Card key={module.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <CalendarIcon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {module.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Runtime: {module.duration}
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
            ))}
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
              Streaming access
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Watch clinics anytime, anywhere
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Videos are hosted on our private learning portal. Request an access code and
              you’ll receive streaming links, slide decks, and note-taking packets for
              each clinic. Chapters are timestamped so you can jump straight to the
              moments you want to review.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Request access
              </h3>
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                Email training@roundup.games with your organization name, preferred
                clinic, and facilitator roster. We approve requests within two business
                days.
              </p>
              <Button asChild className="sm:w-fit">
                <a href="mailto:training@roundup.games?subject=Facilitation%20clinic%20access">
                  Email the training team
                </a>
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Discussion guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Turn the clinics into a team learning session with reflection prompts
                  and skill drills for new and experienced facilitators alike.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-clinic-discussion-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF guide
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Certification credits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Complete all three clinics and submit reflection assignments to earn
                  continuing education hours recognized by Roundup Games and partner
                  leagues.
                </p>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900/60">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    • 2 CE hours per clinic
                    <br />• Digital badge issued within 7 days
                    <br />• Counts toward Game Master and Host pathway renewals
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
            Download clinic resources
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Opening rituals packet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Scripts, table signs, and welcome cards featured in the clinics.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-opening-rituals.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Safety tool kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Printable cards, facilitator cheat sheets, and incident log templates.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-safety-tools.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Spotlight scheduler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Editable pacing tracker compatible with Google Sheets and Excel.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/facilitation-spotlight-scheduler.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download XLSX
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Need interpretation services?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  We can arrange live captioning, ASL interpretation, or translation for
                  your team training. Let us know at least two weeks ahead of time.
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:accessibility@roundup.games?subject=Clinic%20accessibility">
                  Coordinate accessibility support
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
