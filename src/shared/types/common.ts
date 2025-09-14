export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: { code: string; message: string; field?: string }[] };

export type OptionalFetcher<TData, TResult> = (options?: {
  data?: TData;
}) => Promise<TResult>;

export interface SelectOption {
  value: string;
  label: string;
}

export type LanguageLevel = "beginner" | "intermediate" | "advanced" | "fluent";

// Most spoken languages in the world
export const languageOptions: SelectOption[] = [
  { value: "en", label: "English" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pl", label: "Polish" },
  { value: "ar", label: "Arabic" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
];

// Language proficiency levels
export const languageLevelOptions: SelectOption[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "fluent", label: "Fluent" },
];

// Constants for profile options
export const identityTagOptions = [
  "LGBTQ+",
  "Queer",
  "BIMPOC",
  "Disabled",
  "Neurodivergent",
  "Artist",
  "Cosplayer",
  "Educator",
  "Femme Identifying",
  "Game Designer",
  "Multi-lingual",
] as const;

export const experienceLevelOptions = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const gameThemeOptions = [
  "Anime",
  "Battle Royale",
  "Comedy",
  "Cosmic Horror",
  "Cozy",
  "Cyberpunk",
  "Dark Fantasy",
  "Eldritch Horror",
  "Espionage",
  "Fantasy",
  "Futuristic",
  "Gothic Horror",
  "Grimdark",
  "Gritty Fantasy",
  "Heartwarming",
  "High Fantasy",
  "Historical",
  "Horror",
  "Imaginative",
  "Modern",
  "Mystery",
  "Pirate",
  "Political",
  "Post-Apocalyptic",
  "Romance",
  "Rustic",
  "Scifi",
  "Space Western",
  "Steampunk",
  "Super Heroes",
  "Supernatural",
  "Survival",
  "Urban Fantasy",
  "Victorian",
  "Viking",
  "Wacky",
  "Western",
] as const;

export const gmStrengthOptions = [
  "creativity",
  "world_builder",
  "inclusive",
  "rule_of_cool",
  "storytelling",
  "voices",
  "sets_the_mood",
  "teacher",
  "knows_the_rules",
  "visual_aid",
] as const;

export const gmStrengthLabels: Record<string, string> = {
  creativity: "Creativity",
  world_builder: "World Builder",
  inclusive: "Inclusive",
  rule_of_cool: "Rule of Cool",
  storytelling: "Storytelling",
  voices: "Voices",
  sets_the_mood: "Sets the Mood",
  teacher: "Teacher",
  knows_the_rules: "Knows the Rules",
  visual_aid: "Visual Aid",
};

// Fun, relevant icons for each GM strength
export const gmStrengthIcons: Record<string, string> = {
  creativity: "🎨",
  world_builder: "🏗️",
  inclusive: "🫶",
  rule_of_cool: "😎",
  storytelling: "📖",
  voices: "🎭",
  sets_the_mood: "🕯️",
  teacher: "🧑‍🏫",
  knows_the_rules: "📚",
  visual_aid: "🖼️",
};

// Availability editor configuration
export const AVAILABILITY_CONFIG = {
  startHour: 9, // 09:00
  endHour: 22, // 22:00
  displayIntervalMinutes: 30, // Display 30-minute intervals
  dataIntervalMinutes: 15, // Keep data at 15-minute resolution
} as const;
