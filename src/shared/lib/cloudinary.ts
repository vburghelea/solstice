const CLOUDINARY_HOST_PATTERN = /(?:^|\.)cloudinary\.com$/i;

type QualitySetting = "auto" | number;
type FormatSetting = "auto" | "webp" | "avif" | "jpg" | "png";
type CropSetting = "fill" | "fit" | "scale" | "limit" | "thumb" | "crop" | "auto";

export interface CloudinaryTransformOptions {
  width?: number;
  height?: number;
  quality?: QualitySetting;
  format?: FormatSetting;
  crop?: CropSetting;
  gravity?: string;
  dpr?: number;
}

export function isCloudinaryUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return CLOUDINARY_HOST_PATTERN.test(parsed.hostname);
  } catch {
    return false;
  }
}

const CLOUDINARY_TRANSFORM_PREFIXES = new Set([
  "a",
  "ac",
  "af",
  "ar",
  "b",
  "bo",
  "c",
  "dpr",
  "e",
  "eo",
  "f",
  "fl",
  "g",
  "h",
  "l",
  "o",
  "p",
  "q",
  "r",
  "t",
  "u",
  "w",
  "x",
  "y",
  "z",
]);

function buildTransformationSegment(options: CloudinaryTransformOptions): string | null {
  const transforms: string[] = [];
  if (options.format) {
    transforms.push(`f_${options.format}`);
  } else {
    transforms.push("f_auto");
  }
  if (options.quality !== undefined) {
    const quality =
      typeof options.quality === "number" ? options.quality : options.quality;
    transforms.push(`q_${quality}`);
  } else {
    transforms.push("q_auto:good");
  }
  if (options.width) {
    transforms.push(`w_${Math.round(options.width)}`);
  }
  if (options.height) {
    transforms.push(`h_${Math.round(options.height)}`);
  }
  if ((options.width || options.height) && options.crop !== undefined) {
    transforms.push(`c_${options.crop}`);
  } else if (options.width || options.height) {
    transforms.push("c_fill");
  }
  if (options.gravity) {
    transforms.push(`g_${options.gravity}`);
  }
  if (options.dpr) {
    transforms.push(`dpr_${Math.max(1, Math.round(options.dpr * 100) / 100)}`);
  }
  return transforms.length ? transforms.join(",") : null;
}

function isTransformationSegment(segment: string | undefined): boolean {
  if (!segment) {
    return false;
  }

  return segment.split(",").every((part) => {
    const [prefix] = part.split("_", 1);
    return prefix !== undefined && CLOUDINARY_TRANSFORM_PREFIXES.has(prefix);
  });
}

export function buildCloudinaryUrl(
  url: string,
  options: CloudinaryTransformOptions = {},
): string {
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }

  const segments = parsed.pathname.split("/");
  const uploadIndex = segments.findIndex((segment) => segment === "upload");
  if (uploadIndex === -1) {
    return url;
  }

  const transformation = buildTransformationSegment(options);
  if (!transformation) {
    return url;
  }

  const existingSegment = segments[uploadIndex + 1];
  if (isTransformationSegment(existingSegment)) {
    segments[uploadIndex + 1] = `${transformation},${existingSegment}`;
  } else {
    segments.splice(uploadIndex + 1, 0, transformation);
  }

  parsed.pathname = segments.join("/");
  return parsed.toString();
}
