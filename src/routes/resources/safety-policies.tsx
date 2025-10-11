import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, Info, PenSquareIcon, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const policyPillars = [
  {
    title: "People-first safeguards",
    description:
      "Trained community stewards, background-checked volunteers, and clear escalation ladders keep every table supported.",
    icon: UsersIcon,
  },
  {
    title: "Consent-driven play",
    description:
      "Session safety tools, pre-event briefings, and debrief rituals help participants advocate for their needs in real time.",
    icon: CheckCircle2,
  },
  {
    title: "Data stewardship",
    description:
      "We minimize data collection, encrypt sensitive records, and maintain transparent retention schedules for all programs.",
    icon: PenSquareIcon,
  },
];

export const Route = createFileRoute("/resources/safety-policies")({
  component: SafetyPoliciesPage,
});

function SafetyPoliciesPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Safety & accessibility policies"
        title="Feel protected at every Roundup gathering"
        subtitle="We design policies with community members, safeguarding experts, and legal advisors so your stories flourish in safe spaces."
        backgroundImage="/images/hero-tabletop-board-game-resources-optimized.png"
        ctaText="Download policies"
        ctaLink="#policy-downloads"
        secondaryCta={{
          text: "Report an urgent concern",
          link: "/resources/report-concern",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Our approach
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Policies built with survivors, advocates, and storytellers
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              We co-create safety standards with trauma-informed practitioners and
              marginalized community members. The result is a living framework that
              reduces harm, prioritizes consent, and keeps data protected across every
              chapter.
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
              Policy library
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Cover every stage of the participant journey
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              The library is organized by lifecycle—before, during, and after events—so
              you can quickly find the guidance you need. Each policy includes training
              checklists, implementation tips, and metrics for auditing effectiveness.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className={mutedCardSurfaceClass}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Before the event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>• Venue risk assessments and accessibility audits</p>
                  <p>• Volunteer screening and reference checks</p>
                  <p>• Registration data minimization guidelines</p>
                </CardContent>
              </Card>
              <Card className={mutedCardSurfaceClass}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    During the event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>• Safety brief scripts and red/yellow escalation matrix</p>
                  <p>• Incident response roles with on-call coverage</p>
                  <p>• Real-time accessibility adjustments checklist</p>
                </CardContent>
              </Card>
              <Card className={mutedCardSurfaceClass}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    After the event
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>• Follow-up protocols and care referrals</p>
                  <p>• Data retention schedules aligned with privacy law</p>
                  <p>• Root cause analysis template for incident reviews</p>
                </CardContent>
              </Card>
              <Card className={mutedCardSurfaceClass}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    Digital portal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>• Platform security posture and encryption standards</p>
                  <p>• Data subject request workflow</p>
                  <p>• Vendor due diligence questionnaire</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Annual review timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Policies undergo triannual review with external advisors specializing in
                  safeguarding, cybersecurity, and disability justice. We publish a change
                  log and invite public comment prior to ratification.
                </p>
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
                  • January: Legal and compliance audit
                  <br />• May: Community town hall & survey
                  <br />• September: Accessibility and data security refresh
                </div>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Transparency reports
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Biannual reports summarize incident metrics, resolution timelines, and
                  improvement projects. Subscribe to receive updates the moment they
                  publish.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a href="mailto:safety@roundup.games?subject=Transparency%20reports">
                    Join the safety briefing list
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
            Download policy packs
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Community safety handbook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Complete policies for in-person programs, including facilitator scripts.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/community-safety-handbook.pdf"
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
                  Data protection addendum
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Privacy policy, retention schedules, and incident notification
                  templates.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/data-protection-addendum.pdf"
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
                  Accessibility playbook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Guidelines for sensory-friendly, mobility-aware, and multilingual
                  events.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/accessibility-playbook.pdf"
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
                  Need a signed policy for your venue?
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Our legal team can co-author venue-specific agreements or compliance
                  attestations.
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:legal@roundup.games?subject=Venue%20policy%20support">
                  Coordinate with legal
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Questions or feedback?
          </h2>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
            Reach out to safety@roundup.games with policy updates, accessibility requests,
            or clarifying questions. We respond within 48 hours and can schedule follow-up
            calls when needed.
          </p>
          <div className={mutedCardSurfaceClass}>
            <div className="flex items-start gap-4">
              <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                <Info className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Emergency contacts
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  For urgent incidents during an event, call the 24/7 hotline shared with
                  registered coordinators. For digital security concerns, email
                  security@roundup.games to reach our on-call response team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
