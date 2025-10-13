import { buildCloudinaryUrl, type CloudinaryTransformOptions } from "./cloudinary";

const DEFAULT_CLOUD_NAME = "du5naygi0";
const cloudName =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.["VITE_CLOUDINARY_CLOUD_NAME"]) ||
  DEFAULT_CLOUD_NAME;

const IMAGE_BASE_URL = `https://res.cloudinary.com/${cloudName}/image/upload`;

export const CLOUDINARY_ASSET_IDS = {
  heroTournament: "hero-tabletop-board-game-tournament-optimized_z4bcco",
  heroTournamentCards: "hero-tabletop-board-game-tournament-cards-optimized_mqgmvj",
  heroNotFound: "hero-tabletop-board-game-404-optimized_cz8erq",
  heroTeams: "hero-tabletop-board-game-teams-optimized_b66o49",
  heroAbout: "hero-tabletop-board-game-about-optimized_kkygwd",
  heroResources: "hero-tabletop-board-game-resources-optimized_wx6nmq",
  heroSmallGroup: "hero-tabletop-board-game-small-group-optimized_wzpxdm",
} as const;

export type CloudinaryAssetKey = keyof typeof CLOUDINARY_ASSET_IDS;

function resolveCloudinaryUrl(assetKeyOrId: CloudinaryAssetKey | string): string {
  if (typeof assetKeyOrId === "string" && assetKeyOrId in CLOUDINARY_ASSET_IDS) {
    const publicId = CLOUDINARY_ASSET_IDS[assetKeyOrId as CloudinaryAssetKey];
    return `${IMAGE_BASE_URL}/${publicId}`;
  }

  if (typeof assetKeyOrId === "string" && assetKeyOrId.startsWith("http")) {
    return assetKeyOrId;
  }

  return `${IMAGE_BASE_URL}/${assetKeyOrId}`;
}

export function getCloudinaryAssetUrl(
  assetKeyOrId: CloudinaryAssetKey | string,
  options: CloudinaryTransformOptions = {},
): string {
  const baseUrl = resolveCloudinaryUrl(assetKeyOrId);
  return buildCloudinaryUrl(baseUrl, options);
}

export interface CloudinaryResponsiveSource {
  type: string;
  srcSet: string;
}

export interface CloudinaryResponsiveImageSet {
  fallbackSrc: string;
  fallbackSrcSet: string;
  sources: CloudinaryResponsiveSource[];
  sizes: string;
}

interface CreateResponsiveImageOptions {
  transformation: CloudinaryTransformOptions & { width: number; height: number };
  widths?: number[];
  sizes?: string;
  formats?: Array<"avif" | "webp">;
}

const DEFAULT_RESPONSIVE_WIDTHS = [480, 768, 1024, 1440, 1920];

function buildResponsiveImageSet(
  url: string,
  {
    transformation,
    widths = DEFAULT_RESPONSIVE_WIDTHS,
    sizes = "100vw",
    formats = ["avif", "webp"],
  }: CreateResponsiveImageOptions,
): CloudinaryResponsiveImageSet {
  const ratio = transformation.height / transformation.width;
  const uniqueWidths = Array.from(
    new Set(widths.filter((width) => Number.isFinite(width) && width > 0)),
  ).sort((a, b) => a - b);

  const createVariantTransform = (
    width: number,
    format?: "avif" | "webp",
  ): CloudinaryTransformOptions => {
    const next: CloudinaryTransformOptions = {
      ...transformation,
      width,
      height: Math.max(1, Math.round(width * ratio)),
    };

    if (format) {
      next.format = format;
    }

    return next;
  };

  const fallbackSrcSet = uniqueWidths
    .map((width) => `${buildCloudinaryUrl(url, createVariantTransform(width))} ${width}w`)
    .join(", ");

  const sources = formats.map((format) => ({
    type: `image/${format}`,
    srcSet: uniqueWidths
      .map(
        (width) =>
          `${buildCloudinaryUrl(url, createVariantTransform(width, format))} ${width}w`,
      )
      .join(", "),
  }));

  return {
    fallbackSrc: buildCloudinaryUrl(url, transformation),
    fallbackSrcSet,
    sources,
    sizes,
  };
}

export function createResponsiveCloudinaryImage(
  assetKeyOrId: CloudinaryAssetKey | string | null | undefined,
  options: CreateResponsiveImageOptions,
): CloudinaryResponsiveImageSet | null {
  if (!assetKeyOrId) {
    return null;
  }

  const baseUrl = resolveCloudinaryUrl(assetKeyOrId);
  return buildResponsiveImageSet(baseUrl, options);
}
