import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SupportedLanguage, i18nConfig } from "~/lib/i18n/config";
import {
  detectLanguage,
  getCurrentLanguage,
  storeLanguagePreference,
} from "~/lib/i18n/detector";
import i18n from "~/lib/i18n/i18n";
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

/**
 * Hook to detect and set the current language
 */
export const useLanguageDetection = (path?: string) => {
  const currentPath =
    path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  const queryClient = useQueryClient();

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

  const buildLocalizedUrl = (
    originalUrl: string,
    targetLanguage: SupportedLanguage = detectedLanguage,
  ) => getLocalizedUrl(originalUrl, targetLanguage, detectedLanguage);

  // Change language function
  const changeLanguage = async (language: SupportedLanguage) => {
    // Change i18n language first
    await i18n.changeLanguage(language);

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
    const localizedUrl = buildLocalizedUrl(currentPath, language);
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
    getLocalizedUrl: buildLocalizedUrl,
    isUpdating: updatePreferencesMutation.isPending,
    updateError: updatePreferencesMutation.error,
  };
};

/**
 * Hook for language switching with URL updates
 */
export const useLanguageSwitcher = (path?: string) => {
  const router = useRouter();
  const { currentLanguage, changeLanguage, getLocalizedUrl, isUpdating } =
    useLanguageDetection(path);

  const switchLanguage = async (language: SupportedLanguage) => {
    if (language === currentLanguage) return;

    const localizedUrl = await changeLanguage(language);

    // Update URL without page reload
    if (typeof window !== "undefined") {
      router.history.push(localizedUrl);
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
