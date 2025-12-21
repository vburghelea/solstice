/**
 * Debug/test endpoint guard - blocks access in production
 *
 * This guard returns a 404 response for debug/test endpoints in production,
 * making them invisible to attackers. In development, it returns undefined
 * to allow the endpoint to proceed.
 *
 * @returns Response with 404 status in production, undefined in development
 */
export function debugGuard(): Response | undefined {
  // Use import.meta.env.PROD which is true for production builds
  // This cannot be bypassed by environment variables
  if (import.meta.env.PROD) {
    return new Response("Not Found", { status: 404 });
  }
  return undefined;
}

/**
 * Helper to wrap a handler with the debug guard
 * Returns 404 in production, executes handler in development
 */
export function withDebugGuard<T>(
  handler: () => T | Promise<T>,
): Response | T | Promise<T> {
  const guardResponse = debugGuard();
  if (guardResponse) {
    return guardResponse;
  }
  return handler();
}
