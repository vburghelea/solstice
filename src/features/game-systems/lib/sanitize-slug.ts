export const sanitizeSlug = (
  slug: string | null | undefined,
  fallbackId: number,
): string => {
  const trimmed = slug?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : String(fallbackId);
};
