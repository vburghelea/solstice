import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroSection } from "~/components/ui/hero-section";
import { PublicLayout } from "~/features/layouts/public-layout";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicLayout>
      <HeroSection
        eyebrow="About Roundup Games"
        title="A platform for local-first gatherings around tabletop and board games."
        subtitle=""
        backgroundImage="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=2000&q=80"
        ctaText="Explore our programs"
        ctaLink="/resources"
        secondaryCta={{
          text: "Meet our teams",
          link: "/teams",
        }}
      />
    </PublicLayout>
  );
}
