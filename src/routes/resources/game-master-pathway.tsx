import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, Trophy } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const milestones = [
  {
    title: "Foundation badge",
    duration: "4 weeks",
    outcomes: [
      "Session zero mastery with consent-forward facilitation",
      "Improvisation drills for character spotlighting",
      "Safety tool certification and table covenant design",
    ],
  },
  {
    title: "Campaign architect badge",
    duration: "6 weeks",
    outcomes: [
      "Long-form narrative pacing with arcs and cliffhangers",
      "Dynamic encounter design rooted in player agency",
      "Community management for hybrid online/in-person play",
    ],
  },
  {
    title: "Master storyteller badge",
    duration: "8 weeks",
    outcomes: [
      "Advanced emotional safety facilitation and conflict repair",
      "Mentorship practicum leading emerging Game Masters",
      "Performance coaching for live shows and streamed events",
    ],
  },
];

export const Route = createFileRoute("/resources/game-master-pathway")({
  component: GameMasterPathwayPage,
});

function GameMasterPathwayPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Game Master pathway"
        title="Level up your storytelling practice"
        subtitle="A structured curriculum blending narrative craft, safety leadership, and production skills so you can deliver unforgettable campaigns."
        backgroundImage="/images/hero-tabletop-board-game-resources-optimized.png"
        ctaText="Enroll now"
        ctaLink="#enroll"
        secondaryCta={{
          text: "Browse session library",
          link: "/resources/session-plans",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Curriculum overview
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Build skills in stages with expert mentorship
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Live clinics, asynchronous workshops, and reflective coaching help you
              experiment safely and apply new techniques to your home tables. Expect
              weekly practice prompts, peer feedback circles, and 1:1 sessions with senior
              GMs.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {milestones.map((milestone) => (
              <Card key={milestone.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <Trophy className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {milestone.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Recommended pace: {milestone.duration}
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {milestone.outcomes.map((outcome) => (
                    <p key={outcome}>• {outcome}</p>
                  ))}
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
              Learning experience
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Practice-rich, feedback-heavy coaching journey
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Every cohort is capped at 16 participants to maintain intimate, high-trust
              learning environments. You will receive detailed notes on recorded sessions
              and shadow senior facilitators during live community programs.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Weekly rhythm
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <li>• Monday: Live clinic with Q&A</li>
                <li>• Wednesday: Peer practice pods and critique swaps</li>
                <li>• Friday: Office hours with curriculum designers</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Portfolio & assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Graduate with a documented campaign bible, session recordings, and
                  player feedback reports you can share with venues, production partners,
                  or future collaborators.
                </p>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Alumni network
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Access exclusive casting calls, paid storytelling opportunities, and
                  collaborative worldbuilding jams with other Roundup-certified Game
                  Masters.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Curriculum modules & resources
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Narrative craft workbook
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Exercises for motif development, character arcs, and collaborative scene
                  framing.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/gm-pathway-narrative-workbook.pdf"
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
                  Safety leadership toolkit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Incident logs, consent scripts, and restorative repair playbooks used in
                  the pathway.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/gm-pathway-safety-toolkit.zip"
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
                  Performance coaching guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  Voice, posture, and camera presence exercises for live and streamed
                  experiences.
                </p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/gm-pathway-performance-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download PDF
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="enroll" className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Enrollment details
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Upcoming cohorts and tuition options
            </h2>
            <ul className="space-y-4 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              <li>• Spring cohort (April 8 start) – hybrid online & Toronto studio</li>
              <li>
                • Summer cohort (July 15 start) – fully virtual with regional meetups
              </li>
              <li>
                • Scholarships available for marginalized storytellers and youth mentors
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Tuition begins at $480 CAD with flexible installment plans. Partner venues
              can sponsor spots for their facilitators through the Roundup Development
              Fund.
            </p>
            <Button asChild className="sm:w-fit">
              <a href="https://cal.com/roundupgames/gm-intake">Schedule an intake call</a>
            </Button>
          </div>
          <div className={mutedCardSurfaceClass + " space-y-3"}>
            <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
              Certification requirements
            </h3>
            <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
              <li>• Complete all milestone projects and reflective journals</li>
              <li>• Facilitate two supervised community sessions</li>
              <li>• Maintain active safety certification and background checks</li>
              <li>• Contribute to the session design library or mentorship pool</li>
            </ul>
            <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300">
              Questions? Email
              <a
                className="text-brand-red font-semibold hover:underline"
                href="mailto:training@roundup.games?subject=GM%20pathway%20question"
              >
                training@roundup.games
              </a>
              for personalized guidance.
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
