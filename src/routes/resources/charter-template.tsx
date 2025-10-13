import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, ScrollText, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const charterSections = [
  {
    title: "Mission & values",
    description:
      "Anchor your storytelling focus and community promises so everyone knows why this space exists.",
    icon: ScrollText,
    highlights: [
      "Statement of purpose tailored to tabletop and board gaming",
      "Commitment to safety, accessibility, and anti-harassment",
      "Inclusion charter with language for gender-affirming and neurodivergent players",
    ],
  },
  {
    title: "Membership & governance",
    description:
      "Clarify who can join, how decisions are made, and the pathways to leadership roles.",
    icon: UsersIcon,
    highlights: [
      "Membership tiers with benefits and expectations",
      "Voting structure and annual general meeting checklist",
      "Conflict resolution ladder and escalation timelines",
    ],
  },
  {
    title: "Programming & safety",
    description:
      "Outline how events are proposed, approved, and evaluated with player wellbeing in mind.",
    icon: CheckCircle2,
    highlights: [
      "Session pitch form and selection rubric",
      "Table facilitator roles, responsibilities, and training modules",
      "Incident reporting workflow with response benchmarks",
    ],
  },
];

export const Route = createFileRoute("/resources/charter-template")({
  component: CharterTemplatePage,
});

function CharterTemplatePage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Club charter template"
        title="Adaptable governance for tabletop communities"
        subtitle="Use our living charter to formalize expectations, celebrate your shared identity, and welcome newcomers with clarity."
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText="Copy the template"
        ctaLink="#charter-downloads"
        secondaryCta={{
          text: "Request facilitation support",
          link: "mailto:development@roundup.games?subject=Charter%20facilitation",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Why this charter works
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Transparent, inclusive guidelines for clubs of any size
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Built alongside administrators, librarians, and café owners, this charter
              keeps structure approachable. Each clause comes with facilitator notes to
              help you introduce it to members, plus optional amendments for schools and
              youth-serving organizations.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {charterSections.map((section) => (
              <Card key={section.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <section.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{section.description}</p>
                  <ul className="space-y-2">
                    {section.highlights.map((highlight) => (
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
              Facilitation notes
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Host a charter review workshop
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Bring staff, volunteers, and community members into the drafting process.
              Our facilitation guide walks you through a 90-minute workshop covering
              values, membership flow, and accountability. Use the included slide deck and
              breakout prompts to co-create language that reflects your campus or region.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Workshop outline
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <li>• Icebreaker: "Memorable moments at the table" circle</li>
                <li>• Charter walkthrough with annotation activity</li>
                <li>• Small group edits using scenario cards</li>
                <li>• Consent-based ratification and next steps</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Facilitation toolkit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Includes annotated script, editable slides, and evaluation form to
                  capture feedback from participants.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/charter-workshop-kit.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download workshop kit
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Scenario cards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Thirty real-world tabletop dilemmas to stress-test your charter language
                  and escalation procedures.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/charter-scenario-cards.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF deck
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section
        id="charter-downloads"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Choose your format
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Editable document (DOCX)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Best for committees drafting in Word or Google Docs.</p>
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
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Printable version (PDF)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Ready-to-share document with fillable fields for sign-off.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Card className={cardSurfaceClass}>
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Lightweight constitution (Markdown)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Use with static sites, Git-based communities, or Notion workspaces.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/club-charter.md"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Copy Markdown
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Need a custom clause?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Our policy specialists can help tailor language for youth programs,
                  public institutions, or multilingual chapters.
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:policy@roundup.games?subject=Custom%20charter%20support">
                  Connect with policy team
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
