import { languageOptions } from "~/shared/types/common";

const languageValueMap = new Map(
  languageOptions.map((option) => [option.value.toLowerCase(), option.label]),
);

const languageLabelMap = new Map(
  languageOptions.map((option) => [option.label.toLowerCase(), option.label]),
);

export function getLanguageDisplayName(language?: string | null): string | null {
  if (!language) return null;
  const trimmed = language.trim();
  if (trimmed.length === 0) return null;

  const lower = trimmed.toLowerCase();
  if (languageValueMap.has(lower)) {
    return languageValueMap.get(lower) ?? null;
  }

  if (languageLabelMap.has(lower)) {
    return languageLabelMap.get(lower) ?? null;
  }

  return trimmed;
}
