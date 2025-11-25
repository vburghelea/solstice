import { LocalizedButtonLink } from "~/components/ui/LocalizedLink";
import { HeroBackgroundImage } from "~/shared/components/hero-background-image";
import type { CloudinaryResponsiveImageSet } from "~/shared/lib/cloudinary-assets";
import { cn } from "~/shared/lib/utils";

interface HeroSectionProps {
  eyebrow?: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundImageSet?: CloudinaryResponsiveImageSet | null;
  backgroundImageAlt?: string;
  backgroundImageLoading?: "eager" | "lazy";
  ctaText?: string;
  ctaLink?: string;
  secondaryCta?: {
    text: string;
    link: string;
  };
  className?: string | undefined;
  overlayClassName?: string | undefined;
  contentClassName?: string | undefined;
  titleClassName?: string | undefined;
  subtitleClassName?: string | undefined;
}

export function HeroSection({
  eyebrow,
  title,
  subtitle,
  backgroundImage,
  backgroundImageSet,
  backgroundImageAlt,
  backgroundImageLoading,
  ctaText,
  ctaLink = "/",
  secondaryCta,
  className,
  overlayClassName,
  contentClassName,
  titleClassName,
  subtitleClassName,
}: HeroSectionProps) {
  const hasResponsiveBackground = Boolean(backgroundImageSet);
  const showOverlayTint = hasResponsiveBackground || Boolean(backgroundImage);
  const backgroundStyle =
    !hasResponsiveBackground && backgroundImage
      ? {
          backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0.2)), url('${backgroundImage}')`,
        }
      : undefined;

  return (
    <section
      className={cn(
        "relative h-[50vh] min-h-[360px] overflow-hidden bg-cover bg-center sm:h-[60vh]",
        className,
      )}
      style={backgroundStyle}
    >
      {hasResponsiveBackground && backgroundImageSet ? (
        <>
          <HeroBackgroundImage
            image={backgroundImageSet}
            alt={backgroundImageAlt ?? null}
            loading={backgroundImageLoading ?? "eager"}
          />
          <div
            aria-hidden
            className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/45 to-black/20"
          />
        </>
      ) : null}
      <div
        className={cn(
          "absolute inset-0 z-20 flex flex-col items-center justify-center text-center text-white",
          showOverlayTint ? "bg-black/40" : undefined,
          overlayClassName,
        )}
      >
        <div className={cn("container mx-auto px-4 sm:px-6 lg:px-10", contentClassName)}>
          {eyebrow && (
            <p className="text-brand-red/90 mx-auto mb-4 max-w-2xl text-xs font-semibold tracking-[0.3em] uppercase sm:text-sm">
              {eyebrow}
            </p>
          )}
          <h1
            className={cn(
              "mx-auto max-w-4xl text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-6xl",
              titleClassName,
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              "mx-auto mt-4 max-w-2xl px-4 text-base text-gray-200 sm:px-0 sm:text-lg",
              subtitleClassName,
            )}
          >
            {subtitle}
          </p>
          {(ctaText || secondaryCta) && (
            <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 sm:flex-row sm:justify-center">
              {ctaText && (
                <LocalizedButtonLink
                  to={ctaLink}
                  className="btn-brand-primary rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg sm:px-8 sm:py-3 sm:text-base"
                >
                  {ctaText}
                </LocalizedButtonLink>
              )}
              {secondaryCta && (
                <LocalizedButtonLink
                  to={secondaryCta.link}
                  className="btn-brand-secondary rounded-lg px-6 py-2.5 text-sm font-bold shadow-lg sm:px-8 sm:py-3 sm:text-base"
                >
                  {secondaryCta.text}
                </LocalizedButtonLink>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
