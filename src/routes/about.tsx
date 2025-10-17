import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { CheckCircle2, ScrollText, Swords, UsersIcon } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useAboutTranslation } from "~/hooks/useTypedTranslation";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

// Note: These constants will be populated with translation keys in the component
// They remain empty here as they need access to the translation function

const ABOUT_HERO_IMAGE = createResponsiveCloudinaryImage("heroAbout", {
  transformation: {
    width: 1920,
    height: 1080,
    crop: "fill",
    gravity: "auto",
  },
  widths: [480, 768, 1024, 1440, 1920],
  sizes: "100vw",
});

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  const { t } = useAboutTranslation();

  // Translation-aware constants
  const missionHighlights = [
    {
      title: t("mission.highlights.belonging.title"),
      description: t("mission.highlights.belonging.description"),
      icon: UsersIcon,
    },
    {
      title: t("mission.highlights.storytellers.title"),
      description: t("mission.highlights.storytellers.description"),
      icon: ScrollText,
    },
    {
      title: t("mission.highlights.purpose.title"),
      description: t("mission.highlights.purpose.description"),
      icon: Swords,
    },
  ];

  const safetyCommitments = [
    t("vision.commitments.0"),
    t("vision.commitments.1"),
    t("vision.commitments.2"),
    t("vision.commitments.3"),
  ];

  const articlePlaceholders = [
    {
      title: t("stories_insights.articles.mission_practice.title"),
      description: t("stories_insights.articles.mission_practice.description"),
    },
    {
      title: t("stories_insights.articles.vision_safety.title"),
      description: t("stories_insights.articles.vision_safety.description"),
    },
    {
      title: t("stories_insights.articles.roadmap_impact.title"),
      description: t("stories_insights.articles.roadmap_impact.description"),
    },
  ];

  const feedbackTopics = [
    {
      title: t("feedback.topics.suggest_system.title"),
      description: t("feedback.topics.suggest_system.description"),
    },
    {
      title: t("feedback.topics.nominate_venue.title"),
      description: t("feedback.topics.nominate_venue.description"),
    },
    {
      title: t("feedback.topics.report_issue.title"),
      description: t("feedback.topics.report_issue.description"),
    },
  ];

  return (
    <PublicLayout>
      <HeroSection
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        backgroundImageSet={ABOUT_HERO_IMAGE}
        ctaText={t("hero.cta_text")}
        ctaLink="/resources"
        secondaryCta={{
          text: t("hero.secondary_cta"),
          link: "/teams",
        }}
      />

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto grid gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 lg:px-10">
          <div className="space-y-5">
            <p className="text-brand-red text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {t("mission.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("mission.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("mission.description_1")}
            </p>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("mission.description_2")}
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
              {t("vision.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("vision.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("vision.description_1")}
            </p>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("vision.description_2")}
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
              {t("stories_insights.eyebrow")}
            </p>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("stories_insights.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("stories_insights.subtitle")}
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
                  {t("stories_insights.publishing_soon")}
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
              {t("feedback.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("feedback.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("feedback.description")}
              <a
                className="text-brand-red font-semibold hover:underline"
                href="mailto:hello@roundup.games"
              >
                {t("feedback.email")}
              </a>{" "}
              {t("feedback.email_description")}
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
                  {t("feedback.feedback_form_soon")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
