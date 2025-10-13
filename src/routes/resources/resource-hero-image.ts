import { getCloudinaryAssetUrl } from "~/shared/lib/cloudinary-assets";

export const RESOURCES_HERO_IMAGE = getCloudinaryAssetUrl("heroResources", {
  width: 1920,
  height: 1080,
  crop: "fill",
  gravity: "auto",
});
