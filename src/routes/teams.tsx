import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "~/components/ui/button";
import { HeroSection } from "~/components/ui/hero-section";
import { MapPinIcon, Trophy, UsersIcon } from "~/components/ui/icons";
import { VisitorShell } from "~/features/layouts/visitor-shell";
import { useTeamsTranslation } from "~/hooks/useTypedTranslation";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";

const TEAMS_HERO_IMAGE = createResponsiveCloudinaryImage("heroTeams", {
  transformation: {
    width: 1920,
    height: 1080,
    crop: "fill",
    gravity: "auto",
  },
  widths: [480, 768, 1024, 1440, 1920],
  sizes: "100vw",
});

export const Route = createFileRoute("/teams")({
  component: TeamsPage,
});

function TeamsPage() {
  const { t } = useTeamsTranslation();

  // Translation-aware constants
  const pathways = [
    {
      title: t("pathways.university.title"),
      description: t("pathways.university.description"),
      icon: UsersIcon,
    },
    {
      title: t("pathways.community.title"),
      description: t("pathways.community.description"),
      icon: MapPinIcon,
    },
    {
      title: t("pathways.youth.title"),
      description: t("pathways.youth.description"),
      icon: Trophy,
    },
  ];

  const resources = [
    {
      title: t("resources.club_starter.title"),
      copy: t("resources.club_starter.description"),
      link: "/resources#club-toolkit",
    },
    {
      title: t("resources.practice_library.title"),
      copy: t("resources.practice_library.description"),
      link: "/resources#training",
    },
    {
      title: t("resources.safe_sport.title"),
      copy: t("resources.safe_sport.description"),
      link: "/resources#safe-sport",
    },
  ];

  return (
    <VisitorShell>
      <HeroSection
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        subtitle={t("hero.subtitle")}
        backgroundImageSet={TEAMS_HERO_IMAGE}
        ctaText={t("hero.cta_text")}
        ctaLink="/resources"
        secondaryCta={{
          text: t("hero.secondary_cta"),
          link: "/resources#club-toolkit",
        }}
      />

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pathways.map((pathway) => (
              <div
                key={pathway.title}
                className="border-border bg-card rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="bg-primary/15 text-primary flex h-12 w-12 items-center justify-center rounded-full">
                  <pathway.icon className="h-6 w-6" />
                </div>
                <h3 className="text-foreground mt-4 text-lg font-semibold">
                  {pathway.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  {pathway.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto grid grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-10">
          <div className="space-y-4">
            <p className="text-primary text-sm font-semibold tracking-[0.3em] uppercase">
              {t("connect_locally.eyebrow")}
            </p>
            <h2 className="text-foreground text-2xl font-bold sm:text-3xl">
              {t("connect_locally.title")}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              {t("connect_locally.description_1")}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
              {t("connect_locally.description_2")}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:clubs@roundup.games">
                <Button className="btn-brand-primary">
                  {t("connect_locally.email_support")}
                </Button>
              </a>
              <Link to="/events">
                <Button
                  variant="outline"
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  {t("connect_locally.list_event")}
                </Button>
              </Link>
            </div>
          </div>
          <div className="border-border bg-card rounded-2xl border p-6 shadow-sm">
            <h3 className="text-foreground text-lg font-semibold">
              {t("information_shared.title")}
            </h3>
            <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
              <li>• {t("information_shared.items.contacts")}</li>
              <li>• {t("information_shared.items.referees")}</li>
              <li>• {t("information_shared.items.equipment")}</li>
              <li>• {t("information_shared.items.billeting")}</li>
            </ul>
            <p className="text-muted-foreground mt-6 text-xs tracking-[0.3em] uppercase">
              {t("information_shared.updated_monthly")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="text-foreground text-center text-2xl font-bold sm:text-3xl">
            {t("tools.title")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-center text-sm sm:text-base">
            {t("tools.subtitle")}
          </p>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {resources.map((resource) => (
              <div
                key={resource.title}
                className="border-border bg-card rounded-2xl border p-6 shadow-sm"
              >
                <h3 className="text-foreground text-lg font-semibold">
                  {resource.title}
                </h3>
                <p className="text-muted-foreground mt-2 text-sm">{resource.copy}</p>
                <a
                  href={resource.link}
                  className="text-primary mt-4 inline-block text-sm font-semibold hover:underline"
                >
                  {t("resources.open_resource")} →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </VisitorShell>
  );
}
