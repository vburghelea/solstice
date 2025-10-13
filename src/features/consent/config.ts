import type { AllConsentNames, TranslationConfig } from "c15t";

export type ConsentCategoryConfig = {
  id: AllConsentNames;
  title: string;
  description: string;
  required?: boolean;
  futureScope?: boolean;
  providers?: {
    id: string;
    name: string;
    description: string;
    policyUrl?: string;
  }[];
};

export const consentCategories: ConsentCategoryConfig[] = [
  {
    id: "necessary",
    title: "Essential cookies",
    description:
      "Required for security, authentication, and remembering your privacy choices.",
    required: true,
  },
  {
    id: "measurement",
    title: "Analytics",
    description:
      "Helps us understand how Roundup Games is used so we can improve features and fix issues.",
    providers: [
      {
        id: "posthog",
        name: "PostHog",
        description:
          "Captures page views and interaction patterns. Data is anonymized until you give consent.",
        policyUrl: "https://posthog.com/privacy",
      },
    ],
  },
  {
    id: "marketing",
    title: "Marketing",
    description:
      "Optional cookies for future campaigns, retargeting, and partner integrations.",
    futureScope: true,
  },
];

export const consentCategoryIds = consentCategories.map((category) => category.id);

export const consentTranslations: TranslationConfig = {
  defaultLanguage: "en",
  translations: {
    en: {
      common: {
        acceptAll: "Accept all",
        rejectAll: "Reject non-essential",
        customize: "Customize",
        save: "Save preferences",
      },
      cookieBanner: {
        title: "Cookies & privacy",
        description:
          "We use essential cookies to run Roundup Games. With your permission, we'll also use analytics cookies to understand usage and continuously improve the experience.",
      },
      consentManagerDialog: {
        title: "Manage cookie preferences",
        description:
          "Choose which types of cookies you're comfortable with. You can update these settings at any time.",
      },
      consentTypes: {
        necessary: {
          title: consentCategories[0]?.title ?? "Essential cookies",
          description:
            consentCategories[0]?.description ?? "Required for the site to function.",
        },
        measurement: {
          title: consentCategories[1]?.title ?? "Analytics",
          description: consentCategories[1]?.description ?? "Helps us understand usage.",
        },
        marketing: {
          title: consentCategories[2]?.title ?? "Marketing",
          description:
            consentCategories[2]?.description ?? "Used for future promotional tools.",
        },
        functionality: {
          title: "Functional",
          description:
            "Enables enhanced features like saved filters and personalization.",
        },
        experience: {
          title: "Experience",
          description: "Improves browsing with contextual prompts and experiments.",
        },
      },
    },
  },
};
