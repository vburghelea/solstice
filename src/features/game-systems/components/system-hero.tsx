import { HeroSection } from "~/components/ui/hero-section";

interface SystemHeroProps {
  name: string;
  subtitle?: string;
  heroUrl: string | null;
}

export function SystemHero({ name, subtitle = "", heroUrl }: SystemHeroProps) {
  return (
    <div>
      <HeroSection
        title={name}
        subtitle={subtitle}
        {...(heroUrl ? { backgroundImage: heroUrl } : {})}
      />
      {!heroUrl && (
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Image pending moderation
        </p>
      )}
    </div>
  );
}
