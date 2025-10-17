import { createFileRoute } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { HeroSection } from "~/components/ui/hero-section";
import { CalendarIcon, ScrollText, Swords } from "~/components/ui/icons";
import { PublicLayout } from "~/features/layouts/public-layout";
import { useResourcesTranslation } from "~/hooks/useTypedTranslation";
import { RESOURCES_HERO_IMAGE } from "./resource-hero-image";

const cardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/70";

const mutedCardSurfaceClass =
  "rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/60";

export const Route = createFileRoute("/resources/session-plans")({
  component: SessionPlansPage,
});

function SessionPlansPage() {
  const { t } = useResourcesTranslation();

  const programCollections = [
    {
      title: t("session_plans.collections.story_driven.title"),
      description: t("session_plans.collections.story_driven.description"),
      icon: ScrollText,
      examples: Array.isArray(t("session_plans.collections.story_driven.examples"))
        ? (t("session_plans.collections.story_driven.examples") as unknown as string[])
        : ["Loading examples..."],
    },
    {
      title: t("session_plans.collections.quickstart.title"),
      description: t("session_plans.collections.quickstart.description"),
      icon: Swords,
      examples: Array.isArray(t("session_plans.collections.quickstart.examples"))
        ? (t("session_plans.collections.quickstart.examples") as unknown as string[])
        : ["Loading examples..."],
    },
    {
      title: t("session_plans.collections.board_games.title"),
      description: t("session_plans.collections.board_games.description"),
      icon: CalendarIcon,
      examples: Array.isArray(t("session_plans.collections.board_games.examples"))
        ? (t("session_plans.collections.board_games.examples") as unknown as string[])
        : ["Loading examples..."],
    },
  ];

  const downloadBundles = [
    {
      title: t("session_plans.downloads.story_driven_pack.title"),
      description: t("session_plans.downloads.story_driven_pack.description"),
      button: t("session_plans.downloads.story_driven_pack.button"),
      href: "https://cdn.roundup.games/session-pack-story-driven.zip",
    },
    {
      title: t("session_plans.downloads.quickstart_bundle.title"),
      description: t("session_plans.downloads.quickstart_bundle.description"),
      button: t("session_plans.downloads.quickstart_bundle.button"),
      href: "https://cdn.roundup.games/session-pack-one-shot.zip",
    },
    {
      title: t("session_plans.downloads.board_game_kit.title"),
      description: t("session_plans.downloads.board_game_kit.description"),
      button: t("session_plans.downloads.board_game_kit.button"),
      href: "https://cdn.roundup.games/session-pack-board-games.zip",
    },
  ];
  return (
    <PublicLayout>
      <HeroSection
        eyebrow={t("session_plans.hero.eyebrow")}
        title={t("session_plans.hero.title")}
        subtitle={t("session_plans.hero.subtitle")}
        backgroundImageSet={RESOURCES_HERO_IMAGE}
        ctaText={t("session_plans.hero.cta_text")}
        ctaLink="#collections"
        secondaryCta={{
          text: t("session_plans.hero.secondary_cta"),
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
              {t("session_plans.collections.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("session_plans.collections.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("session_plans.collections.description")}
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
              {t("session_plans.logistics.eyebrow")}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
              {t("session_plans.logistics.title")}
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 sm:text-base dark:text-gray-300">
              {t("session_plans.logistics.description")}
            </p>
            <div className={mutedCardSurfaceClass + " space-y-3"}>
              <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                {t("session_plans.logistics.files_title")}
              </h3>
              <ul className="space-y-2 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                {Array.isArray(t("session_plans.logistics.files"))
                  ? (t("session_plans.logistics.files") as unknown as string[]).map(
                      (file, index) => (
                        <li key={`file-${index}-${file.slice(0, 20)}`}>• {file}</li>
                      ),
                    )
                  : null}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("session_plans.logistics.update_cadence.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("session_plans.logistics.update_cadence.description")}</p>
              </CardContent>
            </Card>
            <Card className={mutedCardSurfaceClass}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  {t("session_plans.logistics.accessibility.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                <p>{t("session_plans.logistics.accessibility.description")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-secondary py-12 sm:py-16 lg:py-20 dark:bg-gray-950">
        <div className="container mx-auto space-y-6 px-4 sm:px-6 lg:px-10">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-50">
            {t("session_plans.downloads.title")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {downloadBundles.map((bundle, index) => (
              <Card
                key={`bundle-${index}-${bundle.title.slice(0, 20)}`}
                className={cardSurfaceClass}
              >
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                    {bundle.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  <p>{bundle.description}</p>
                  <Button asChild variant="outline" className="justify-center">
                    <a href={bundle.href} target="_blank" rel="noopener noreferrer">
                      {bundle.button}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className={cardSurfaceClass}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 sm:text-xl dark:text-gray-50">
                  {t("session_plans.submission.title")}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base dark:text-gray-300">
                  {t("session_plans.submission.description")}
                </p>
              </div>
              <Button asChild className="sm:w-auto">
                <a href="mailto:design@roundup.games?subject=Session%20plan%20submission">
                  {t("session_plans.submission.button")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
