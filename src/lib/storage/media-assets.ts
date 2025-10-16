import { serverOnly } from "@tanstack/react-start";
import type { UploadApiOptions } from "cloudinary";
import { and, eq, type SQL } from "drizzle-orm";
import type { db } from "~/db";
import { gameSystems, mediaAssets } from "~/db/schema";
import { computeChecksum, deleteImage } from "./cloudinary";

type Db = Awaited<ReturnType<typeof db>>;

export interface MediaUploadOptions {
  type: "thumbnail" | "hero" | "gallery" | "cover";
  gameSystemId: number;
  source: "bgg" | "startplaying" | "manual" | "import";
  moderated?: boolean;
  license?: string;
  licenseUrl?: string;
  originalUrl?: string;
}

export interface UploadedMediaAsset {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  checksum: string;
  license?: string;
  licenseUrl?: string;
  kind: string;
  moderated: boolean;
  gameSystemId: number;
  source: string;
  originalUrl?: string;
}

const getCloudinary = serverOnly(async () => {
  const { v2 } = await import("cloudinary");
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME ?? "",
    api_key: CLOUDINARY_API_KEY ?? "",
    api_secret: CLOUDINARY_API_SECRET ?? "",
  });
  return v2;
});

/**
 * Upload an image to Cloudinary with game system metadata and folder organization
 */
export async function uploadGameSystemMedia(
  file: string | Buffer,
  options: MediaUploadOptions,
  database: Db,
): Promise<UploadedMediaAsset> {
  // Get game system metadata
  const gameSystem = await database.query.gameSystems.findFirst({
    where: eq(gameSystems.id, options.gameSystemId),
    columns: { name: true, slug: true, sourceOfTruth: true },
  });

  if (!gameSystem) {
    throw new Error(`Game system with ID ${options.gameSystemId} not found`);
  }

  // Generate checksum
  const checksum =
    typeof file === "string" ? computeChecksum(file) : computeChecksum(file);

  // Build Cloudinary context with metadata
  const context: Record<string, string> = {
    moderated: String(options.moderated ?? false),
    checksum,
    type: options.type,
    source: options.source,
    game_system_id: String(options.gameSystemId),
    game_system_name: gameSystem.name,
    game_system_slug: gameSystem.slug || "",
    source_of_truth: gameSystem.sourceOfTruth || "",
  };

  if (options.originalUrl) {
    context["original_url"] = options.originalUrl;
  }

  if (options.license) {
    context["license"] = options.license;
  }

  if (options.licenseUrl) {
    context["license_url"] = options.licenseUrl;
  }

  // Build folder structure: game_systems/[source]/[game-system-slug]
  const folderParts = ["game_systems"];
  if (options.source) {
    folderParts.push(options.source);
  }
  if (gameSystem.slug) {
    folderParts.push(gameSystem.slug);
  }
  const folder = folderParts.join("/");

  // Build public ID with type prefix
  const timestamp = Date.now();
  const safeName = gameSystem.slug || gameSystem.name.replace(/[^a-zA-Z0-9]/g, "_");
  const publicId = `${options.type}_${safeName}_${timestamp}`;

  const uploadOptions: UploadApiOptions = {
    resource_type: "image",
    context,
    folder,
    public_id: publicId,
    use_filename: false,
    unique_filename: false,
    overwrite: true,
  };

  const cloudinary = await getCloudinary();
  // Convert Buffer to string if needed for Cloudinary upload
  const uploadData = Buffer.isBuffer(file) ? file.toString("base64") : file;
  const result = await cloudinary.uploader.upload(uploadData, uploadOptions);

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    checksum,
    ...(options.license ? { license: options.license } : {}),
    ...(options.licenseUrl ? { licenseUrl: options.licenseUrl } : {}),
    kind: options.type,
    moderated: options.moderated ?? false,
    gameSystemId: options.gameSystemId,
    source: options.source,
    ...(options.originalUrl ? { originalUrl: options.originalUrl } : {}),
  };
}

/**
 * Upload an image from a URL to Cloudinary with game system metadata
 */
export async function uploadGameSystemMediaFromUrl(
  url: string,
  options: MediaUploadOptions,
  database: Db,
): Promise<UploadedMediaAsset> {
  try {
    // Download the image from URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Include original URL in metadata
    const uploadOptions = {
      ...options,
      originalUrl: url,
    };

    return await uploadGameSystemMedia(buffer, uploadOptions, database);
  } catch (error) {
    console.error(`Failed to upload image from URL ${url}:`, error);
    throw error;
  }
}

/**
 * Delete media assets from both database and Cloudinary storage.
 * Handles Cloudinary deletion failures gracefully.
 *
 * @param database - Database instance
 * @param gameSystemId - Game system ID to delete assets for
 * @param whereClause - Drizzle where clause to filter assets (optional, defaults to all assets for the game system)
 */
export async function deleteMediaAssetsFromStorage(
  database: Db,
  gameSystemId: number,
  whereClause?: SQL,
): Promise<void> {
  // Use provided where clause or default to all assets for the game system
  const finalWhereClause = whereClause ?? eq(mediaAssets.gameSystemId, gameSystemId);

  // Get assets to delete
  const assetsToDelete = await database.query.mediaAssets.findMany({
    where: finalWhereClause,
    columns: { id: true, publicId: true },
  });

  if (assetsToDelete.length === 0) {
    return;
  }

  // Delete from Cloudinary first
  for (const asset of assetsToDelete) {
    try {
      await deleteImage(asset.publicId);
      console.log(`Deleted asset ${asset.publicId} from Cloudinary`);
    } catch (error) {
      console.warn(`Failed to delete asset ${asset.publicId} from Cloudinary:`, error);
      // Continue with database deletion even if Cloudinary fails
    }
  }

  // Delete from database
  await database.delete(mediaAssets).where(finalWhereClause);
}

/**
 * Delete only non-moderated media assets from both database and Cloudinary storage.
 * Useful when recrawling or updating assets while preserving moderated/approved assets.
 *
 * @param database - Database instance
 * @param gameSystemId - Game system ID to delete assets for
 */
export async function deleteNonModeratedMediaAssets(
  database: Db,
  gameSystemId: number,
): Promise<void> {
  await deleteMediaAssetsFromStorage(
    database,
    gameSystemId,
    and(eq(mediaAssets.gameSystemId, gameSystemId), eq(mediaAssets.moderated, false)),
  );
}

/**
 * Delete all media assets for a game system from both database and Cloudinary storage.
 * Useful when deleting an entire game system.
 *
 * @param database - Database instance
 * @param gameSystemId - Game system ID to delete all assets for
 */
export async function deleteAllMediaAssets(
  database: Db,
  gameSystemId: number,
): Promise<void> {
  await deleteMediaAssetsFromStorage(database, gameSystemId);
}

/**
 * Check if a game system has any moderated media assets.
 *
 * @param database - Database instance
 * @param gameSystemId - Game system ID to check
 * @returns True if the system has moderated assets
 */
export async function hasModeratedMediaAssets(
  database: Db,
  gameSystemId: number,
): Promise<boolean> {
  const moderatedAssets = await database.query.mediaAssets.findMany({
    where: and(
      eq(mediaAssets.gameSystemId, gameSystemId),
      eq(mediaAssets.moderated, true),
    ),
    columns: { id: true },
  });

  return moderatedAssets.length > 0;
}
