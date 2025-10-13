import { useMemo } from "react";

import {
  buildCloudinaryUrl,
  type CloudinaryTransformOptions,
  isCloudinaryUrl,
} from "~/shared/lib/cloudinary";

export interface UseCloudinaryImageOptions extends CloudinaryTransformOptions {
  dprVariants?: number[];
  widthVariants?: number[];
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
    widthVariants,
  } = options;

  return useMemo(() => {
    if (!url) {
      return { src: null, srcSet: null, isCloudinary: false };
    }

    if (!isCloudinaryUrl(url)) {
      return { src: url, srcSet: null, isCloudinary: false };
    }

    const baseTransform: CloudinaryTransformOptions = {};
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
    const hasWidthVariants = Array.isArray(widthVariants) && widthVariants.length > 0;

    if (hasWidthVariants) {
      const uniqueWidths = Array.from(
        new Set(
          (widthVariants ?? []).filter(
            (variant) => Number.isFinite(variant) && variant > 0,
          ),
        ),
      ).sort((a, b) => a - b);

      const ratio =
        typeof width === "number" && typeof height === "number"
          ? height / width
          : undefined;

      if (uniqueWidths.length > 0) {
        const buildVariantTransform = (
          variantWidth: number,
        ): CloudinaryTransformOptions => {
          const transform: CloudinaryTransformOptions = {
            ...baseTransform,
            width: variantWidth,
          };

          if (ratio) {
            transform.height = Math.max(1, Math.round(variantWidth * ratio));
          } else if (typeof height === "number") {
            transform.height = height;
          }

          return transform;
        };

        const srcSet = uniqueWidths
          .map(
            (variantWidth) =>
              `${buildCloudinaryUrl(url, buildVariantTransform(variantWidth))} ${variantWidth}w`,
          )
          .join(", ");

        const largestWidth = uniqueWidths[uniqueWidths.length - 1];
        const finalTransform: CloudinaryTransformOptions = {
          ...baseTransform,
          width: typeof width === "number" ? width : largestWidth,
        };

        if (ratio) {
          finalTransform.height = Math.max(
            1,
            Math.round((finalTransform.width ?? largestWidth) * ratio),
          );
        } else if (typeof height === "number") {
          finalTransform.height = height;
        }

        const src = buildCloudinaryUrl(url, finalTransform);
        return { src, srcSet, isCloudinary: true };
      }
    }

    if (typeof width === "number") {
      baseTransform.width = width;
    }
    if (typeof height === "number") {
      baseTransform.height = height;
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
  }, [
    url,
    width,
    height,
    quality,
    format,
    crop,
    gravity,
    dpr,
    dprVariants,
    widthVariants,
  ]);
}
