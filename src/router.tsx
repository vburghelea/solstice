import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { DefaultCatchBoundary } from "~/components/DefaultCatchBoundary";
import { NotFound } from "~/components/NotFound";
import { i18nConfig, type SupportedLanguage } from "~/lib/i18n/config";
import { detectLanguageFromPath, getLocalizedUrl } from "~/lib/i18n/detector";
import { applyLanguageRouting } from "~/lib/i18n/language-routing";
import { routeTree as generatedRouteTree } from "./routeTree.gen";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 2, // 2 minutes
      },
    },
  });

  const localizedRouteTree = applyLanguageRouting(generatedRouteTree);

  const router = createTanStackRouter({
    routeTree: localizedRouteTree,
    context: {
      queryClient,
      user: null,
      language: i18nConfig.defaultLanguage,
      i18nRequestKey: null,
    },
    defaultPreload: "intent",
    // react-query will handle data fetching & caching
    // https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#passing-all-loader-events-to-an-external-cache
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
    scrollRestoration: true,
    defaultStructuralSharing: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  const normalizeLanguage = (value: unknown): SupportedLanguage | null => {
    if (typeof value !== "string") {
      return null;
    }

    const normalized = value.toLowerCase();
    return i18nConfig.supportedLanguages.includes(normalized as SupportedLanguage)
      ? (normalized as SupportedLanguage)
      : null;
  };

  const extractExplicitLanguage = (options: unknown): SupportedLanguage | null => {
    if (!options || typeof options !== "object") {
      return null;
    }

    const params = (options as { params?: unknown }).params;
    if (params && typeof params === "object") {
      return normalizeLanguage((params as Record<string, unknown>)["lang"]);
    }

    return null;
  };

  const isExternalHref = (to: unknown): to is string => {
    if (typeof to !== "string") {
      return false;
    }

    return /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(to);
  };

  const originalBuildLocation = router.buildLocation.bind(router);
  type BuildLocationResult = ReturnType<typeof originalBuildLocation>;

  router.buildLocation = ((options) => {
    const builtLocation = originalBuildLocation(options);

    const toValue =
      typeof options === "string" ? options : (options as { to?: unknown })?.to;
    if (isExternalHref(toValue)) {
      return builtLocation;
    }

    const explicitLanguage =
      extractExplicitLanguage(options) ??
      (typeof options === "object" && options
        ? extractExplicitLanguage((options as { mask?: unknown }).mask)
        : null);

    const currentLanguage =
      detectLanguageFromPath(router.latestLocation?.pathname ?? "") ??
      i18nConfig.defaultLanguage;

    const ensureLocalized = (
      location: BuildLocationResult,
      preferredLanguage: SupportedLanguage | null,
    ): BuildLocationResult => {
      if (!location) {
        return location;
      }

      const detectedLanguage = detectLanguageFromPath(location.pathname);
      const targetLanguage =
        preferredLanguage ?? explicitLanguage ?? detectedLanguage ?? currentLanguage;

      if (
        !targetLanguage ||
        targetLanguage === i18nConfig.defaultLanguage ||
        detectedLanguage
      ) {
        return location;
      }

      const localizedPath = getLocalizedUrl(location.pathname, targetLanguage);
      const hashSuffix = location.hash ? `#${location.hash}` : "";
      const localizedMasked =
        location.maskedLocation &&
        ensureLocalized(location.maskedLocation, targetLanguage);

      return {
        ...location,
        pathname: localizedPath,
        href: `${localizedPath}${location.searchStr}${hashSuffix}`,
        ...(localizedMasked ? { maskedLocation: localizedMasked } : {}),
      };
    };

    return ensureLocalized(builtLocation, explicitLanguage);
  }) as typeof router.buildLocation;

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
