import { getBrand } from "~/tenant";

export const buildPageTitle = (page: string) => {
  const brand = getBrand().name;
  return page ? `${page} | ${brand}` : brand;
};

export const createPageHead = (page: string, description?: string) => {
  const meta = [
    { title: buildPageTitle(page) },
    ...(description && description.length > 0
      ? [{ name: "description", content: description }]
      : []),
  ];
  return { meta };
};
