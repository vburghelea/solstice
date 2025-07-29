import { serverOnly } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { getClientIp, rateLimit } from "./rate-limit";

/**
 * Apply rate limiting to a server function
 * @param type - Type of rate limit to apply ('auth' or 'api')
 * @param fn - The server function to wrap
 * @returns A rate-limited version of the server function
 */
export const withRateLimit = serverOnly(
  <T extends (...args: unknown[]) => unknown>(type: "auth" | "api", fn: T): T => {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Get the current request headers
      const { headers } = getWebRequest();
      const clientIp = await getClientIp(headers);

      // Apply rate limiting
      await rateLimit(type, clientIp);

      // Call the original function
      return fn(...args) as ReturnType<T>;
    }) as T;
  },
);

/**
 * Helper to create a rate-limited server function handler
 * This wraps the handler creation to apply rate limiting automatically
 */
export const rateLimitedHandler = serverOnly(
  <TArgs extends unknown[], TReturn>(
    type: "auth" | "api",
    handlerFn: (...args: TArgs) => TReturn | Promise<TReturn>,
  ): ((...args: TArgs) => Promise<TReturn>) => {
    return async (...args: TArgs): Promise<TReturn> => {
      // Get the current request headers
      const { headers } = getWebRequest();
      const clientIp = await getClientIp(headers);

      // Apply rate limiting
      await rateLimit(type, clientIp);

      // Call the original function
      return await handlerFn(...args);
    };
  },
);
