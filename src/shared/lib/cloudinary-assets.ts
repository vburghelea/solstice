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

export function getCloudinaryAssetUrl(
  assetKeyOrId: CloudinaryAssetKey | string,
  options: CloudinaryTransformOptions = {},
): string {
  const publicId =
    typeof assetKeyOrId === "string" && assetKeyOrId in CLOUDINARY_ASSET_IDS
      ? CLOUDINARY_ASSET_IDS[assetKeyOrId as CloudinaryAssetKey]
      : assetKeyOrId;

  return buildCloudinaryUrl(`${IMAGE_BASE_URL}/${publicId}`, options);
}
