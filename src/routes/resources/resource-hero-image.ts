import { createResponsiveCloudinaryImage } from "~/shared/lib/cloudinary-assets";

export const RESOURCES_HERO_IMAGE = createResponsiveCloudinaryImage("heroResources", {
  transformation: {
    width: 1920,
    height: 1080,
    crop: "fill",
    gravity: "auto",
  },
  widths: [480, 768, 1024, 1440, 1920],
  sizes: "100vw",
});
