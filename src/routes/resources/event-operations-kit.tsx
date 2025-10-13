import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, CreditCard, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const operationsPhases = [
  {
    title: "Planning & budgeting",
    description:
      "Capacity models, staffing grids, and cashflow templates keep you in control before tickets even launch.",
    icon: CreditCard,
    bullets: [
      "Revenue scenarios with sponsorship and merch add-ons",
      "Volunteer and contractor staffing calculators",
      "Venue comparison worksheet and risk assessment",
    ],
  },
  {
    title: "Event execution",
    description:
      "Minute-by-minute run of show, comms trees, and crisis response cards ensure smooth delivery on event day",
    icon: CalendarIcon,
    bullets: [
      "Check-in flow with QR codes and backup lists",
      "Radio and messaging protocols for floor leads",
      "Incident escalation matrix and documentation kit",
    ],
  },
  {
    title: "Post-event wrap",
    description:
      "Debrief templates, metric dashboards, and outreach scripts help you convert momentum into future growth.",
    icon: UsersIcon,
    bullets: [
      "Stakeholder report outline with financial summary",
      "Volunteer thank-you automation sequences",
      "Player survey analysis and retention planner",
    ],
  },
];

export const Route = createFileRoute("/resources/event-operations-kit")({
  component: EventOperationsKitPage,
});

function EventOperationsKitPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Event operations kit"
        title="Run seamless tabletop events, tournaments, and festivals"
        subtitle="Operational blueprints tested by the Roundup Games events team to help you deliver safe, memorable, and profitable gatherings."
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText="Download the kit"
        ctaLink="#downloads"
        secondaryCta={{
          text: "Book an ops consult",
          link: "mailto:events@roundup.games?subject=Operations%20support",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Operating system
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Templates that scale from pop-ups to multi-day conventions
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Choose the modules you need or deploy the entire kit. We include editable
              spreadsheets, LiveOps dashboards, and facilitator checklists so your team
              can collaborate in real time.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {operationsPhases.map((phase) => (
              <Card key={phase.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <phase.icon className="size-6" />
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
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              LiveOps dashboard
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Real-time data keeps operations calm and proactive
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Set up our connected spreadsheet dashboard to monitor attendance, table
              occupancy, volunteer assignments, and incident logs. Integrate with our
              forms or plug in your own data sources.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Dashboard widgets
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <li>• Check-in counter with capacity alerts</li>
                <li>• Table usage heatmap and queue tracker</li>
                <li>• Volunteer staffing board with break reminders</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Included automations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Zapier-ready recipes send SMS alerts to shift leads, trigger inventory
                  restock notifications, and update your post-event reports.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/event-ops-automation-pack.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download automation pack
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Vendor management kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Contract templates, insurance checklists, and communication cadences
                  keep partners aligned.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/event-ops-vendor-kit.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download vendor kit
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
            Download the full kit
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Operations bundle (ZIP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>All templates, dashboards, and policy references in one archive.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/event-operations-kit.zip"
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
                  Run of show template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Google Sheets + Excel formats with automated reminders built-in.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/event-ops-run-of-show.xlsx"
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
                  Risk & compliance binder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Insurance certificates, waivers, and emergency response cards.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/event-ops-compliance-binder.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Need custom automation or staffing support?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Our event operations consultants can co-build dashboards, recruit
                  volunteers, and manage vendor briefs for your next flagship program.
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:events@roundup.games?subject=Custom%20event%20ops">
                  Talk with operations team
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Join the operator community
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            Swap troubleshooting tips, share vendor recommendations, and collaborate on
            multi-region events inside the Roundup Games Operations Collective on Discord.
          </p>
          <Button asChild className="sm:w-fit">
            <a
              href="https://discord.gg/roundup-operations"
              target="_blank"
              rel="noopener noreferrer"
            >
              Request an invite
            </a>
          </Button>
        </div>
      </section>
    </PublicLayout>
  );
}
