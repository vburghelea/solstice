import { serverOnly } from "@tanstack/react-start";
import type { UploadApiOptions } from "cloudinary";
import { createHash } from "crypto";

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
  const context: Record<string, string> = {
    moderated: String(options.moderated ?? false),
    checksum: options.checksum,
  };

  if (options.license) {
    context["license"] = options.license;
  }

  if (options.licenseUrl) {
    context["license_url"] = options.licenseUrl;
  }

  if (options.kind) {
    context["kind"] = options.kind;
  }

  const uploadOptions: UploadApiOptions = {
    resource_type: "image",
    context,
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
