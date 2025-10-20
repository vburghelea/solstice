import { createServerOnlyFn } from "@tanstack/react-start";
import type { UploadApiOptions } from "cloudinary";
import { createHash } from "crypto";

export const getCloudinary = createServerOnlyFn(async () => {
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

export interface UploadOptions {
  checksum: string;
  license?: string;
  licenseUrl?: string;
  kind?: string;
  moderated?: boolean;
}

export interface UploadedAsset {
  publicId: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  checksum: string;
  license?: string;
  licenseUrl?: string;
  kind?: string;
  moderated: boolean;
}

export function computeChecksum(data: Buffer | string): string {
  return createHash("md5").update(data).digest("hex");
}

export async function uploadImage(
  file: string,
  options: UploadOptions,
): Promise<UploadedAsset> {
  const cloudinary = await getCloudinary();

  // Build Cloudinary context with metadata (format: key=value pairs)
  const contextPairs: string[] = [
    `moderated=${options.moderated ?? false}`,
    `checksum=${options.checksum}`,
  ];

  if (options.license) {
    contextPairs.push(`license=${options.license}`);
  }

  if (options.licenseUrl) {
    contextPairs.push(`license_url=${options.licenseUrl}`);
  }

  if (options.kind) {
    contextPairs.push(`kind=${options.kind}`);
  }

  const context = contextPairs.join("|");

  const uploadOptions: UploadApiOptions = {
    resource_type: "image",
    context: context as unknown as Record<string, string>,
  };

  const result = await cloudinary.uploader.upload(file, uploadOptions);

  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    checksum: options.checksum,
    ...(options.license ? { license: options.license } : {}),
    ...(options.licenseUrl ? { licenseUrl: options.licenseUrl } : {}),
    ...(options.kind ? { kind: options.kind } : {}),
    moderated: options.moderated ?? false,
  };
}

export async function deleteImage(publicId: string): Promise<void> {
  const cloudinary = await getCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

/**
 * Test Cloudinary API connectivity and configuration
 */
export async function testCloudinaryConnection(): Promise<{
  success: boolean;
  cloudName?: string;
  error?: string;
}> {
  try {
    const cloudinary = await getCloudinary();

    // Test API by getting usage info - we'll just test upload functionality instead
    // since the API might not be accessible with current credentials
    const testImage =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhMmQZQAAAABJRU5ErkJggg==";
    await cloudinary.uploader.upload(testImage, {
      public_id: "test-connection-check",
      overwrite: true,
    });

    // Clean up test image
    await cloudinary.uploader.destroy("test-connection-check");

    return {
      success: true,
      cloudName: process.env["CLOUDINARY_CLOUD_NAME"] || "unknown",
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
