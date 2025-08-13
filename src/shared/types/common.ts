export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { code: string; message: string; field?: string }[] };

export interface SelectOption {
  value: string;
  label: string;
}

export type LanguageLevel = "beginner" | "intermediate" | "advanced" | "fluent";

// Most spoken languages in the world
export const languageOptions: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "ar", label: "Arabic" },
  { value: "bn", label: "Bengali" },
  { value: "ru", label: "Russian" },
];

// Language proficiency levels
export const languageLevelOptions: SelectOption[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "fluent", label: "Fluent" },
];
