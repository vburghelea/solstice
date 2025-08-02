import { useAsyncRateLimitedCallback } from "@tanstack/react-pacer";
import { toast } from "sonner";
import { rateLimitPresets, type RateLimitType } from "./rate-limit-config";

interface UseRateLimitedServerFnOptions {
  type?: RateLimitType;
  onReject?: (limiter: {
    getMsUntilNextWindow?: () => number;
    store?: { state: Record<string, unknown> };
  }) => void;
  showToast?: boolean;
}

/**
 * Hook to rate limit server function calls on the client side
 *
 * @example
 * ```tsx
 * const rateLimitedCreateTeam = useRateLimitedServerFn(
 *   createTeam,
 *   { type: 'mutation' }
 * );
 *
 * // Use it like the original function
 * await rateLimitedCreateTeam({ data: teamData });
 * ```
 */
export function useRateLimitedServerFn<TArgs extends unknown[], TReturn>(
  serverFn: (...args: TArgs) => Promise<TReturn>,
  options: UseRateLimitedServerFnOptions = {},
) {
  const { type = "api", onReject, showToast = true } = options;
  const preset = rateLimitPresets[type];

  // Type assertion needed due to TanStack Pacer's alpha API
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return useAsyncRateLimitedCallback(serverFn, {
    ...preset,
    onReject: (limiter: any) => {
      if (showToast) {
        const msUntilNext = limiter.getMsUntilNextWindow?.() || 1000;
        const seconds = Math.ceil(msUntilNext / 1000);
        toast.error(
          `Too many requests. Please try again in ${seconds} second${seconds === 1 ? "" : "s"}.`,
        );
      }
      onReject?.(limiter);
    },
    onError: (error: unknown) => {
      // Let the original error bubble up
      throw error;
    },
  } as any);
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

/**
 * Hook for rate limiting search operations with debouncing
 * Combines rate limiting with a slight delay to avoid too many requests while typing
 */
export function useRateLimitedSearch<TReturn>(
  searchFn: (query: string) => Promise<TReturn>,
  options: Omit<UseRateLimitedServerFnOptions, "type"> = {},
) {
  return useRateLimitedServerFn(searchFn, {
    ...options,
    type: "search",
  });
}
