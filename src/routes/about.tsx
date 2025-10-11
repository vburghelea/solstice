import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, ScrollText, Swords, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

const missionHighlights = [
  {
    title: "Belonging at every table",
    description:
      "We connect newcomers, veterans, and curious visitors with welcoming hosts so no one has to face another quiet evening alone.",
    icon: UsersIcon,
  },
  {
    title: "Stages for storytellers",
    description:
      "Roundup Games creates rehearsal-ready spaces where Game Masters can practice their craft, receive coaching, and showcase their narratives to engaged audiences.",
    icon: ScrollText,
  },
  {
    title: "Play with purpose",
    description:
      "Every gathering is designed to spark laughter, curiosity, and long-term friendships through thoughtfully curated tabletop and board game experiences.",
    icon: Swords,
  },
];

const safetyCommitments = [
  "Dedicated community stewards and trained facilitators at every sanctioned event.",
  "Safety tools—from consent check-ins to debrief circles—woven into session design.",
  "Privacy-first data practices with encrypted storage, minimal retention, and transparent governance.",
  "Continuous audits with partners who specialize in safeguarding vulnerable communities.",
];

const articlePlaceholders = [
  {
    title: "Mission in practice",
    description:
      "Stories from local chapters turning empty Wednesday nights into vibrant, cross-generational meetups.",
  },
  {
    title: "Vision and safety standards",
    description:
      "Deep dives into the policies, partners, and tools that keep our community feeling brave and respected.",
  },
  {
    title: "Roadmap & impact reports",
    description:
      "Quarterly updates on new platform features, regional launches, and the metrics guiding our decisions.",
  },
];

const feedbackTopics = [
  {
    title: "Suggest a new game system",
    description:
      "Help us feature rulesets and universes that excite your tables and broaden our library of adventures.",
  },
  {
    title: "Nominate a venue",
    description:
      "Tell us about cafés, libraries, and community halls that would make incredible gathering points.",
  },
  {
    title: "Report a platform issue",
    description:
      "Share bugs, accessibility concerns, or content requests so we can keep improving the digital experience.",
  },
];

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="About Roundup Games"
        title="A platform for local-first gatherings around tabletop and board games."
        subtitle="We exist to make it easier for every visitor to step into a lively room, roll some dice, and leave knowing more people who care about their stories."
        backgroundImage="/images/hero-tabletop-board-game-about-optimized.png"
        ctaText="Explore our programs"
        ctaLink="/resources"
        secondaryCta={{
          text: "Meet our teams",
          link: "/teams",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Our mission
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Combat loneliness with joyful, real-life play
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Roundup Games was built for people who crave connection as much as they
              crave clever mechanics and collaborative storytelling. We nurture
              local-first experiences that are warm, low-pressure, and thoughtfully
              facilitated so you can arrive as you are and immediately feel seen.
            </p>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              By hosting skill-sharing sessions, mentorship circles, and rotating
              campaigns, we give storytellers the room they need to hone their craft while
              introducing audiences to bold new worlds. Every initiative we ship is guided
              by the belief that play is a basic human need—and one of the most powerful
              antidotes to boredom and isolation.
            </p>
          </div>
          <ul className="space-y-4">
            {missionHighlights.map((highlight) => (
              <li
                key={highlight.title}
                className={`${cardSurfaceClass} flex items-start gap-4`}
              >
                <div className="bg-brand-red/10 text-brand-red dark:bg-brand-red/20 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full">
                  <highlight.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                    {highlight.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                    {highlight.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Our vision
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Safety-first design for gatherings and data
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Trust is the foundation of every Roundup experience. We create brave spaces
              where participants can immerse themselves in narrative without worrying
              about physical, emotional, or digital harm. That commitment starts with
              trained staff on the floor and extends to how we store, permission, and act
              on your information behind the scenes.
            </p>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              Our platform is continually evolving to meet the expectations of our
              community and partners. We invest in transparent reporting, responsible AI
              tooling, and collaborative policy reviews with experts in safeguarding,
              accessibility, and cyber security.
            </p>
          </div>
          <ul className="space-y-4">
            {safetyCommitments.map((commitment) => (
              <li
                key={commitment}
                className={`${mutedCardSurfaceClass} flex items-start gap-3`}
              >
                <div className="text-brand-red pt-1">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
                  {commitment}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Stories & insights
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Articles coming soon
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              We’re assembling a library of essays, interviews, and progress updates so
              you can follow how the Roundup Games vision becomes reality across different
              regions.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {articlePlaceholders.map((article) => (
              <article key={article.title} className={`${cardSurfaceClass} text-left`}>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {article.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {article.description}
                </p>
                <Button
                  className="mt-4 w-full justify-center"
                  variant="outline"
                  disabled
                  aria-disabled="true"
                >
                  Publishing soon
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              Share your voice
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              Feedback channels opening soon
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              We’re designing a feedback portal where you can champion new ideas, flag
              concerns, and help us refine every experience. Until it launches, you can
              email
              <a
                className="text-brand-red font-semibold hover:underline"
                href="mailto:hello@roundup.games"
              >
                hello@roundup.games
              </a>{" "}
              and our community team will route your note to the right people.
            </p>
          </div>
          <div className="space-y-4">
            {feedbackTopics.map((topic) => (
              <div key={topic.title} className={mutedCardSurfaceClass}>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {topic.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {topic.description}
                </p>
                <Button
                  className="mt-4 w-full justify-center"
                  variant="secondary"
                  disabled
                  aria-disabled="true"
                >
                  Feedback form launching soon
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
