import type { ImgHTMLAttributes } from "react";

import {
  type UseCloudinaryImageOptions,
  useCloudinaryImage,
} from "~/shared/hooks/useCloudinaryImage";

interface CloudinaryImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  imageUrl: string | null | undefined;
  transform?: UseCloudinaryImageOptions;
}

export function CloudinaryImage({
  imageUrl,
  transform,
  alt,
  loading = "lazy",
  ...imgProps
}: CloudinaryImageProps) {
  const image = useCloudinaryImage(imageUrl, transform);

  if (!image.src) {
    return null;
  }

  return (
    <img
      {...imgProps}
      alt={alt}
      loading={loading}
      src={image.src}
      srcSet={image.srcSet ?? undefined}
    />
  );
}
