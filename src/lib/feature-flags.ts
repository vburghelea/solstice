import { useCallback, useSyncExternalStore } from "react";

const FEATURE_FLAG_ENV_PREFIX = "VITE_FLAG_" as const;
export const FEATURE_FLAG_STORAGE_PREFIX = "roundup.featureFlag." as const;
export const FEATURE_FLAG_CHANGE_EVENT = "roundup:feature-flag-change" as const;

type FeatureFlagValue = boolean | undefined;

type FeatureFlagEventDetail = {
  flag: string;
  value: boolean | null;
};

function buildStorageKey(flag: string): string {
  return `${FEATURE_FLAG_STORAGE_PREFIX}${flag}`;
}

function normalizeEnvKey(flag: string): string | null {
  const normalized = flag
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
  return normalized.length > 0 ? `${FEATURE_FLAG_ENV_PREFIX}${normalized}` : null;
}

function parseFlagValue(value: unknown): FeatureFlagValue {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "on", "enabled"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "off", "disabled"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

function readLocalStorageFlag(flag: string): FeatureFlagValue {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const storedValue = window.localStorage.getItem(buildStorageKey(flag));
    if (storedValue === null) {
      return undefined;
    }

    return parseFlagValue(storedValue);
  } catch {
    return undefined;
  }
}

function readGlobalFlag(flag: string): FeatureFlagValue {
  const globalObject = globalThis as typeof globalThis & {
    __featureFlags?: Record<string, unknown>;
    featureFlags?: Record<string, unknown>;
  };

  const sources = [globalObject.__featureFlags, globalObject.featureFlags];
  for (const source of sources) {
    if (!source) continue;
    const rawValue = source[flag];
    const parsed = parseFlagValue(rawValue);
    if (typeof parsed !== "undefined") {
      return parsed;
    }
  }

  return undefined;
}

function readEnvFlag(flag: string): FeatureFlagValue {
  const envKey = normalizeEnvKey(flag);
  if (!envKey) {
    return undefined;
  }

  const envSource =
    typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
      ? (import.meta.env as Record<string, unknown>)
      : undefined;

  if (!envSource) {
    return undefined;
  }

  const rawValue = envSource[envKey];
  return parseFlagValue(rawValue);
}

export function isFeatureFlagEnabled(flag: string, fallback = false): boolean {
  const localOverride = readLocalStorageFlag(flag);
  if (typeof localOverride !== "undefined") {
    return localOverride;
  }

  const globalOverride = readGlobalFlag(flag);
  if (typeof globalOverride !== "undefined") {
    return globalOverride;
  }

  const envValue = readEnvFlag(flag);
  if (typeof envValue !== "undefined") {
    return envValue;
  }

  return fallback;
}

export function setFeatureFlagOverride(flag: string, value: boolean | null): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = buildStorageKey(flag);
    if (value === null) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, String(value));
    }

    const event = new CustomEvent<FeatureFlagEventDetail>(FEATURE_FLAG_CHANGE_EVENT, {
      detail: { flag, value },
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.warn("Unable to persist feature flag override", error);
  }
}

export function useFeatureFlag(flag: string, fallback = false): boolean {
  const getSnapshot = useCallback(
    () => isFeatureFlagEnabled(flag, fallback),
    [flag, fallback],
  );

  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === "undefined") {
        return () => {};
      }

      const handleStorageChange = (event: StorageEvent) => {
        if (!event.key) return;
        if (event.key !== buildStorageKey(flag)) return;
        listener();
      };

      const handleCustomChange = (event: Event) => {
        const custom = event as CustomEvent<FeatureFlagEventDetail>;
        if (custom.detail?.flag !== flag) return;
        listener();
      };

      window.addEventListener("storage", handleStorageChange);
      window.addEventListener(FEATURE_FLAG_CHANGE_EVENT, handleCustomChange);

      return () => {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener(FEATURE_FLAG_CHANGE_EVENT, handleCustomChange);
      };
    },
    [flag],
  );

  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
