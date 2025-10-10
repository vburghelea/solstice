import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, CreditCard, ScrollText, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const readinessBlocks = [
  {
    title: "Founding documents",
    description:
      "Customize a charter, code of conduct, and volunteer agreement that reflect your community's values and tone.",
    icon: ScrollText,
  },
  {
    title: "Financial runway",
    description:
      "Budget templates, cashflow trackers, and sample sponsorship decks help you forecast seasons with confidence.",
    icon: CreditCard,
  },
  {
    title: "People operations",
    description:
      "Role descriptions, onboarding checklists, and meeting agendas keep staff, GMs, and volunteers aligned.",
    icon: UsersIcon,
  },
  {
    title: "Quality standards",
    description:
      "Session rubrics and feedback loops ensure that every program meets the Roundup Games seal of care.",
    icon: CheckCircle2,
  },
];

export const Route = createFileRoute("/visit/resources/toolkit")({
  component: CommunityStarterToolkitPage,
});

function CommunityStarterToolkitPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Community starter toolkit"
        title="Launch your tabletop club with confidence"
        subtitle="Our toolkit distills the best practices from thriving Roundup Games chapters so you can build momentum in weeks, not months."
        backgroundImage="/images/hero-tabletop-board-game-resources-optimized.png"
        ctaText="Access the toolkit"
        ctaLink="#download"
        secondaryCta={{
          text: "Talk to a community coach",
          link: "mailto:development@roundup.games?subject=Community%20starter%20support",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              What's inside
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Everything you need from day zero to your first marquee event
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Whether you're spinning up a campus club, a library after-hours program, or
              a board game café league, this toolkit keeps planning grounded and
              collaborative. Work through the playbooks in order or jump straight to the
              templates that match your next milestone.
            </p>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Core documents
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                <li>• Editable constitution and operating charter</li>
                <li>• Code of conduct with incident response workflow</li>
                <li>• Volunteer and Game Master agreements</li>
                <li>• Accessible membership application and waiver forms</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Planning tools
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                <li>• Budget and grant forecast spreadsheet with cashflow scenarios</li>
                <li>• Sponsor outreach sequences and pitch deck slides</li>
                <li>• Event critical path template with role assignments</li>
                <li>• Risk assessment and safety checklist tailored to tabletop play</li>
              </ul>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {readinessBlocks.map((block) => (
              <Card
                key={block.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur transition-colors dark:border-gray-700 dark:bg-gray-900/70"
              >
                <CardHeader className="flex items-center gap-4 sm:flex-row">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <block.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {block.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    {block.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              How to use the toolkit
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              A guided sprint to build community infrastructure
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Follow our 6-week launch roadmap or adapt the modules to your timeline. Each
              chapter ends with reflection prompts so your core team can review progress
              and surface blockers early.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                title: "Weeks 1–2",
                items: [
                  "Define community values and inclusive play guidelines",
                  "Lock a meeting cadence and decision-making model",
                  "Confirm founding roles and communication channels",
                ],
              },
              {
                title: "Weeks 3–4",
                items: [
                  "Map funding sources and sponsorship prospects",
                  "Prototype your first flagship event agenda",
                  "Set up onboarding journeys for players and volunteers",
                ],
              },
              {
                title: "Weeks 5–6",
                items: [
                  "Test safety drills and debrief rituals",
                  "Plot your next quarter of programming",
                  "Collect pilot feedback and iterate the charter",
                ],
              },
            ].map((phase) => (
              <Card
                key={phase.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70"
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {phase.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                    {phase.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section
        id="download"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Download formats
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            Prefer working offline? Grab the editable bundle or individual templates
            below. Each file stays synced with the latest governance, accessibility, and
            safety requirements from the Roundup Games development team.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Complete toolkit (ZIP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>All charters, spreadsheets, and policy templates in one archive.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-toolkit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Charter & governance (DOCX)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Editable constitution, code of conduct, and volunteer agreement.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.docx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download DOCX
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Budgets & sponsors (Sheets)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Live spreadsheet for cashflow, grants, and recurring expenses.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-budget-template.xlsx"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Copy spreadsheet
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
            Need help adapting the materials? Email{" "}
            <a
              className="text-brand-red font-semibold hover:underline"
              href="mailto:development@roundup.games?subject=Toolkit%20support"
            >
              development@roundup.games
            </a>{" "}
            to request a co-working session with our community success team.
          </p>
        </div>
      </section>
    </PublicLayout>
  );
}
