import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SupportedLanguage, i18nConfig } from "~/lib/i18n/config";
import {
  detectLanguage,
  getCurrentLanguage,
  storeLanguagePreference,
} from "~/lib/i18n/detector";
import { UserLanguagePreferences } from "~/lib/i18n/types";

/**
 * Server function to get user language preferences
 */
const getUserLanguagePreferences = createServerFn()
  .validator(z.object({ userId: z.string().optional() }))
  .handler(async () => {
    // In a real implementation, this would fetch from the database
    // For now, return default preferences
    return {
      preferredLanguage: i18nConfig.defaultLanguage,
      fallbackLanguage: i18nConfig.fallbackLanguage,
      autoDetectEnabled: true,
    } as UserLanguagePreferences;
  });

/**
 * Server function to update user language preferences
 */
const updateUserLanguagePreferences = createServerFn()
  .validator(
    z.object({
      userId: z.string().optional(),
      preferredLanguage: z.enum(["en", "de", "pl"]),
      autoDetectEnabled: z.boolean().optional(),
    }),
  )
  .handler(async () => {
    // In a real implementation, this would update the database
    // For now, just return success
    return { success: true };
  });

// Query client for invalidating queries
const queryClient = new QueryClient();

/**
 * Hook to detect and set the current language
 */
export const useLanguageDetection = (path?: string) => {
  const currentPath =
    path ?? (typeof window !== "undefined" ? window.location.pathname : "/");

  // Query user preferences
  const {
    data: userPreferences,
    isLoading: isLoadingPreferences,
    error: preferencesError,
  } = useQuery({
    queryKey: ["userLanguagePreferences"],
    queryFn: () => getUserLanguagePreferences({ data: {} }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Mutation to update user preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: { preferredLanguage: string; autoDetectEnabled?: boolean }) =>
      updateUserLanguagePreferences({
        data: {
          preferredLanguage: data.preferredLanguage as "en" | "de" | "pl",
          autoDetectEnabled: data.autoDetectEnabled,
        },
      }),
    onSuccess: () => {
      // Invalidate preferences query to refetch
      queryClient.invalidateQueries({ queryKey: ["userLanguagePreferences"] });
    },
  });

  // Detect current language based on path and preferences
  const detectedLanguage = getCurrentLanguage(currentPath, userPreferences);

  // Change language function
  const changeLanguage = async (language: SupportedLanguage) => {
    // Store in localStorage and cookie
    storeLanguagePreference(language);

    // Update user preferences if logged in
    if (userPreferences) {
      await updatePreferencesMutation.mutateAsync({
        preferredLanguage: language,
        autoDetectEnabled: false, // User manually changed language
      });
    }

    // Return the localized URL
    const localizedUrl = getLocalizedUrl(currentPath, language, detectedLanguage);
    return localizedUrl;
  };

  // Auto-detect language function
  const autoDetectLanguage = async () => {
    if (userPreferences?.autoDetectEnabled) {
      const autoDetected = detectLanguage(currentPath, userPreferences);
      if (autoDetected !== detectedLanguage) {
        await changeLanguage(autoDetected);
        return autoDetected;
      }
    }
    return detectedLanguage;
  };

  return {
    currentLanguage: detectedLanguage,
    userPreferences,
    isLoading: isLoadingPreferences,
    error: preferencesError,
    changeLanguage,
    autoDetectLanguage,
    isUpdating: updatePreferencesMutation.isPending,
    updateError: updatePreferencesMutation.error,
  };
};

/**
 * Hook to get localized URL
 */
export const useLocalizedUrl = () => {
  const { currentLanguage } = useLanguageDetection();

  const getLocalizedUrl = (originalUrl: string, targetLanguage?: SupportedLanguage) => {
    const lang = targetLanguage ?? currentLanguage;
    const segments = originalUrl.split("/").filter(Boolean);

    // Remove current language prefix if it exists
    if (segments[0] && ["en", "de", "pl"].includes(segments[0])) {
      segments.shift();
    }

    // Add target language prefix if it's not the default language
    if (lang !== i18nConfig.defaultLanguage) {
      segments.unshift(lang);
    }

    return `/${segments.join("/")}`;
  };

  return { getLocalizedUrl };
};

/**
 * Hook for language switching with URL updates
 */
export const useLanguageSwitcher = () => {
  const { currentLanguage, changeLanguage, isUpdating } = useLanguageDetection();
  const { getLocalizedUrl } = useLocalizedUrl();

  const switchLanguage = async (language: SupportedLanguage) => {
    if (language === currentLanguage) return;

    const localizedUrl = await changeLanguage(language);

    // Update URL without page reload
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", localizedUrl);
      // Trigger a custom event for components that need to react to URL changes
      window.dispatchEvent(
        new CustomEvent("languageChanged", {
          detail: { language, url: localizedUrl },
        }),
      );
    }
  };

  return {
    currentLanguage,
    switchLanguage,
    isUpdating,
    getLocalizedUrl,
  };
};

// Helper function to get localized URL (moved from detector.ts for better organization)
function getLocalizedUrl(
  originalUrl: string,
  targetLanguage: SupportedLanguage,
  currentLanguage?: SupportedLanguage,
): string {
  const segments = originalUrl.split("/").filter(Boolean);

  // Remove current language prefix if it exists
  if (currentLanguage && segments[0] === currentLanguage) {
    segments.shift();
  }

  // Add target language prefix if it's not the default language
  if (targetLanguage !== i18nConfig.defaultLanguage) {
    segments.unshift(targetLanguage);
  }

  return `/${segments.join("/")}`;
}
