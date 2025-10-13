import { HeroSection } from "~/components/ui/hero-section";
import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";

interface SystemHeroProps {
  name: string;
  subtitle?: string;
  heroUrl: string | null;
  renderBackground?: boolean;
}

export function SystemHero({
  name,
  subtitle = "",
  heroUrl,
  renderBackground = true,
}: SystemHeroProps) {
  const heroBackground = heroUrl
    ? createResponsiveCloudinaryImage(heroUrl, {
        transformation: {
          width: 1600,
          height: 900,
          crop: "fill",
          gravity: "auto",
        },
        widths: [640, 960, 1280, 1600],
        sizes: "100vw",
      })
    : null;

  return (
    <div className={renderBackground ? undefined : "pb-6"}>
      <HeroSection
        title={name}
        subtitle={subtitle}
        {...(renderBackground && heroBackground
          ? { backgroundImageSet: heroBackground }
          : {})}
        className={
          renderBackground
            ? undefined
            : "h-auto min-h-[220px] py-12 sm:min-h-[260px] sm:py-16 lg:min-h-[300px] lg:py-20"
        }
        overlayClassName={
          renderBackground
            ? undefined
            : "bg-gradient-to-b from-black/70 via-black/45 to-black/20 text-white"
        }
        titleClassName={
          renderBackground
            ? undefined
            : "text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-4xl"
        }
        subtitleClassName={
          renderBackground
            ? undefined
            : "mt-3 max-w-xl px-0 text-sm text-white/80 sm:text-base"
        }
      />
      {!heroBackground && (
        <p className="text-muted-foreground mt-2 text-center text-sm">
          Image pending moderation
        </p>
      )}
    </div>
  );
}
