import type { CloudinaryResponsiveImageSet } from "~/shared/lib/cloudinary-assets";
import { cn } from "~/shared/lib/utils";

interface HeroBackgroundImageProps {
  image: CloudinaryResponsiveImageSet;
  alt?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
}

export function HeroBackgroundImage({
  image,
  alt,
  className,
  loading = "eager",
}: HeroBackgroundImageProps) {
  const resolvedAlt = alt ?? "";
  const isDecorative = resolvedAlt.length === 0;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 z-0 overflow-hidden",
        className,
      )}
    >
      <picture className="block h-full w-full">
        {image.sources.map((source) => (
          <source
            key={source.type}
            type={source.type}
            srcSet={source.srcSet}
            sizes={image.sizes}
          />
        ))}
        <img
          src={image.fallbackSrc}
          srcSet={image.fallbackSrcSet}
          sizes={image.sizes}
          alt={resolvedAlt}
          aria-hidden={isDecorative ? true : undefined}
          loading={loading}
          decoding="async"
          className="h-full w-full object-cover"
        />
      </picture>
    </div>
  );
}
