import type { SupportedLanguage } from "~/lib/i18n/config";
import { detectLanguageFromPath } from "~/lib/i18n/detector";
import { normalizeLocalizedPath } from "~/lib/i18n/links/utils";

interface ResolveLocalizedPathOptions {
  targetPath: string;
  language?: SupportedLanguage | null | undefined;
  currentPath?: string | undefined;
}

export function resolveLocalizedPath({
  targetPath,
  language,
  currentPath,
}: ResolveLocalizedPathOptions): string {
  const activeLanguage =
    language ?? (currentPath ? detectLanguageFromPath(currentPath) : null);

  if (!activeLanguage) {
    return targetPath;
  }

  return normalizeLocalizedPath(targetPath, activeLanguage, {
    targetLanguage: activeLanguage,
  });
}
