import type { AnyRoute } from "@tanstack/react-router";
import { i18nConfig, type SupportedLanguage } from "./config";

const OPTIONAL_LANG_SEGMENT = "{-$lang}";
const OPTIONAL_LANG_PREFIX = `/${OPTIONAL_LANG_SEGMENT}`;
const ROUTE_PREFIX_SKIP_LIST = ["/api"];
const LANGUAGE_ROUTING_APPLIED_FLAG = Symbol.for("solstice.languageRoutingApplied");

const supportedLanguageSet = new Set<SupportedLanguage>(i18nConfig.supportedLanguages);

const ensureLeadingSlash = (value: string): string => {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
};

const buildLocalizedSegment = (path: string): string => {
  const normalized = ensureLeadingSlash(path);

  if (
    normalized === OPTIONAL_LANG_PREFIX ||
    normalized === `/${OPTIONAL_LANG_SEGMENT}/`
  ) {
    return OPTIONAL_LANG_PREFIX;
  }

  if (normalized.startsWith(OPTIONAL_LANG_PREFIX)) {
    return normalized;
  }

  if (normalized === "/") {
    return OPTIONAL_LANG_PREFIX;
  }

  // Remove the leading slash before concatenating to avoid double slashes
  const trimmed = normalized.slice(1);
  return `${OPTIONAL_LANG_PREFIX}/${trimmed}`;
};

const normalizeRouteChildCollection = (route: AnyRoute): readonly AnyRoute[] => {
  const children = route.children as unknown;

  if (!children) return [];

  if (Array.isArray(children)) {
    return children;
  }

  return Object.values(children as Record<string, AnyRoute>);
};

const shouldSkipRoutePath = (path: string): boolean => {
  return ROUTE_PREFIX_SKIP_LIST.some((prefix) => path.startsWith(prefix));
};

const normalizeLanguageParam = (value: unknown): SupportedLanguage => {
  if (typeof value !== "string") {
    return i18nConfig.defaultLanguage;
  }

  const normalized = value.toLowerCase();
  return supportedLanguageSet.has(normalized as SupportedLanguage)
    ? (normalized as SupportedLanguage)
    : i18nConfig.defaultLanguage;
};

const mergeParseFunctions = (
  existing: ((params: Record<string, unknown>) => Record<string, unknown>) | undefined,
): ((params: Record<string, unknown>) => Record<string, unknown>) => {
  return (params) => {
    const parsed = existing ? existing(params) : params;
    const langSource = "lang" in params ? params["lang"] : parsed["lang"];
    return {
      ...parsed,
      lang: normalizeLanguageParam(langSource),
    };
  };
};

const mergeStringifyFunctions = (
  existing: ((params: Record<string, unknown>) => Record<string, unknown>) | undefined,
): ((params: Record<string, unknown>) => Record<string, unknown>) => {
  return (params) => {
    const stringified = existing ? existing(params) : { ...params };
    const lang = normalizeLanguageParam((params as Record<string, unknown>)["lang"]);
    const result = { ...stringified };

    if (lang !== i18nConfig.defaultLanguage) {
      result["lang"] = lang;
    } else {
      delete result["lang"];
    }

    return result;
  };
};

const configureRoute = (route: AnyRoute): void => {
  const routeOptions = route.options as unknown as Record<string, unknown>;

  const rawPath = (routeOptions?.["path"] as string | undefined) ?? route.path;

  if (!rawPath) {
    return;
  }

  const normalizedPath = ensureLeadingSlash(rawPath);

  if (shouldSkipRoutePath(normalizedPath)) {
    return;
  }

  if ((routeOptions as Record<symbol, boolean>)[LANGUAGE_ROUTING_APPLIED_FLAG]) {
    return;
  }

  const originalParamsOptions = routeOptions?.["params"] as
    | {
        parse?: (params: Record<string, unknown>) => Record<string, unknown>;
        stringify?: (params: Record<string, unknown>) => Record<string, unknown>;
      }
    | undefined;
  const legacyParseParams = routeOptions?.["parseParams"] as
    | ((params: Record<string, unknown>) => Record<string, unknown>)
    | undefined;
  const legacyStringifyParams = routeOptions?.["stringifyParams"] as
    | ((params: Record<string, unknown>) => Record<string, unknown>)
    | undefined;

  const parseParams = originalParamsOptions?.parse ?? legacyParseParams;
  const stringifyParams = originalParamsOptions?.stringify ?? legacyStringifyParams;

  const localizedPath = buildLocalizedSegment(normalizedPath);
  const localizedId = buildLocalizedSegment(
    (routeOptions?.["id"] as string | undefined) ?? route.id,
  );

  (route.update as (options: Record<string, unknown>) => AnyRoute)({
    path: localizedPath,
    id: localizedId,
    params: {
      ...(originalParamsOptions ?? {}),
      parse: mergeParseFunctions(parseParams),
      stringify: mergeStringifyFunctions(stringifyParams),
    },
  });

  (routeOptions as Record<symbol, boolean>)[LANGUAGE_ROUTING_APPLIED_FLAG] = true;
};

export const applyLanguageRouting = <TRoute extends AnyRoute>(
  rootRoute: TRoute,
): TRoute => {
  const directChildren = normalizeRouteChildCollection(rootRoute);

  for (const child of directChildren) {
    configureRoute(child);
  }

  return rootRoute;
};
