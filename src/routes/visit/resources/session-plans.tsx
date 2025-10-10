import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, ScrollText, Swords } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const programCollections = [
  {
    title: "Story-driven campaigns",
    description:
      "Episodic arcs for narrative-focused groups with session zero prompts and safety tool reminders.",
    icon: ScrollText,
    examples: [
      "Whispers Below: Urban fantasy mystery in four acts",
      "Voyagers of the Verdant Sea: Hopepunk exploration mini-series",
      "The Iron Concordat: Political intrigue with rotating spotlight scenes",
    ],
  },
  {
    title: "Quickstart one-shots",
    description:
      "Low-prep adventures that fit 90-minute to 2-hour windows—ideal for cafés, clubs, and convention demos.",
    icon: Swords,
    examples: [
      "Aurora Chase: Cooperative puzzle crawl with branching endings",
      "Signal Lost: Sci-fi rescue featuring fail-forward mechanics",
      "Hearth & Hollow: Cozy mystery with accessible rules reference",
    ],
  },
  {
    title: "Board game spotlights",
    description:
      "Curated rotation schedules for modern board games, emphasizing accessibility, theme, and replay variety.",
    icon: CalendarIcon,
    examples: [
      "Gateway night: Cascadia, Azul, and Flamecraft with facilitator scripts",
      "Strategy ladder: Dune Imperium into John Company with prep briefs",
      "Collab corner: Spirit Island and The Crew with teamwork debrief prompts",
    ],
  },
];

export const Route = createFileRoute("/visit/resources/session-plans")({
  component: SessionPlansPage,
});

function SessionPlansPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="Session design library"
        title="Facilitator-tested sessions for every table"
        subtitle="Download ready-to-run adventures, rotation schedules, and debrief guides built by Roundup Games storytellers."
        backgroundImage="/images/hero-tabletop-board-game-resources-optimized.png"
        ctaText="Browse collections"
        ctaLink="#collections"
        secondaryCta={{
          text: "Book a design consult",
          link: "mailto:programs@roundup.games?subject=Session%20design%20support",
        }}
      />

      <section
        id="collections"
        className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950"
      >
        <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Curated playlists
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Mix and match adventures tailored to your goals
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Filter by genre, session length, player experience, or accessibility needs.
              Each plan lists required materials, facilitation tips, and spotlight moments
              to help you coach new storytellers.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {programCollections.map((collection) => (
              <Card key={collection.title} className={cardSurfaceClass}>
                <CardHeader className="space-y-3">
                  <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex size-12 items-center justify-center rounded-full">
                    <collection.icon className="size-6" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {collection.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{collection.description}</p>
                  <ul className="space-y-2">
                    {collection.examples.map((example) => (
                      <li key={example}>• {example}</li>
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
              What each plan includes
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Plug-and-play logistics for smooth sessions
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Every download provides facilitator briefs, optional safety calibrations,
              and pacing calls so you can adapt to a wide spectrum of player energy. We
              also include wrap-up prompts and digital follow-up templates to keep the
              connection going after game night.
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                Files in each package
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <li>• Session overview with tone, theme, and content warnings</li>
                <li>• Facilitation script with timing cues and spotlight rotations</li>
                <li>• Player handouts, map packs, and tokens where applicable</li>
                <li>• Debrief questions and survey link for post-event insights</li>
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Update cadence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  New bundles drop monthly with seasonal events, convention packages, and
                  community submissions curated by the Roundup Games design council.
                </p>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Accessibility notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>
                  We flag sensory load, reading level, and physical requirements for each
                  plan. Alternates are provided for low-vision, no-dice, and low-audio
                  environments.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            Download session bundles
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className={cardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Story-driven campaign pack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Includes Whispers Below, Verdant Sea, and Iron Concordat arcs.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/session-pack-story-driven.zip"
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
                  Quickstart one-shot bundle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Includes Aurora Chase, Signal Lost, and Hearth & Hollow adventures.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/session-pack-one-shot.zip"
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
                  Board game spotlight kit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>Rotation schedules, facilitator briefs, and player scorecards.</p>
                <Button asChild variant="outline" className="justify-center">
                  <a
                    href="https://cdn.roundup.games/session-pack-board-games.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download ZIP
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  Submit your own session plan
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  Have a tested adventure or board game night format? Share it with the
                  design council for feedback and potential inclusion in the library.
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:design@roundup.games?subject=Session%20plan%20submission">
                  Email the design council
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
