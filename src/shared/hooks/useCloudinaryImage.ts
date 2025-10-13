import { useMemo } from "react";

import {
  buildCloudinaryUrl,
  type CloudinaryTransformOptions,
  isCloudinaryUrl,
} from "~/shared/lib/cloudinary";

export interface UseCloudinaryImageOptions extends CloudinaryTransformOptions {
  dprVariants?: number[];
}

export interface UseCloudinaryImageResult {
  src: string | null;
  srcSet: string | null;
  isCloudinary: boolean;
}

export function useCloudinaryImage(
  url: string | null | undefined,
  options: UseCloudinaryImageOptions = {},
): UseCloudinaryImageResult {
  const {
    dprVariants = [1, 2],
    width,
    height,
    quality,
    format,
    crop,
    gravity,
    dpr,
  } = options;

  return useMemo(() => {
    if (!url) {
      return { src: null, srcSet: null, isCloudinary: false };
    }

    if (!isCloudinaryUrl(url)) {
      return { src: url, srcSet: null, isCloudinary: false };
    }

    const baseTransform: CloudinaryTransformOptions = {};
    if (typeof width === "number") {
      baseTransform.width = width;
    }
    if (typeof height === "number") {
      baseTransform.height = height;
    }
    if (typeof quality !== "undefined") {
      baseTransform.quality = quality;
    }
    if (typeof format !== "undefined") {
      baseTransform.format = format;
    }
    if (typeof crop !== "undefined") {
      baseTransform.crop = crop;
    }
    if (typeof gravity === "string") {
      baseTransform.gravity = gravity;
    }
    if (typeof dpr === "number") {
      baseTransform.dpr = dpr;
    }
    const baseSrc = buildCloudinaryUrl(url, baseTransform);
    const uniqueDprs = Array.from(
      new Set(
        dprVariants.filter(
          (variant) => Number.isFinite(variant) && variant >= 1 && variant !== dpr,
        ),
      ),
    );
    const srcSet =
      uniqueDprs.length > 0
        ? uniqueDprs
            .map(
              (variant) =>
                `${buildCloudinaryUrl(url, { ...baseTransform, dpr: variant })} ${variant}x`,
            )
            .join(", ")
        : null;

    return { src: baseSrc, srcSet, isCloudinary: true };
  }, [url, width, height, quality, format, crop, gravity, dpr, dprVariants]);
}
