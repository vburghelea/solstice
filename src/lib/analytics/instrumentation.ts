/**
 * src/lib/analytics/instrumentation.ts
 *
 * Server instrumentation helpers for PostHog.
 *
 * Designed to be imported from server-only code. Provides:
 *  - register(): noop for compatibility
 *  - onRequestError(err, request): captures errors to PostHog server client
 *
 * This module keeps server-only code inside src/ so it is included in the TypeScript project.
 */

export function register(): void {
  // no-op
}

export const onRequestError = async (err: unknown, request: Request): Promise<void> => {
  // Only proceed when running in Node.js runtime
  if (!(typeof process !== "undefined" && process.env["NEXT_RUNTIME"] === "nodejs"))
    return;

  try {
    // Use a relative dynamic import so TypeScript can resolve during builds
    const { captureExceptionOnServer } = await import("./posthog-server");

    // Best-effort: extract PostHog distinct_id from cookie
    let distinctId: string | undefined;
    try {
      const cookieHeader = request.headers.get("cookie") ?? undefined;
      if (cookieHeader) {
        const match = cookieHeader.match(/ph_phc_[^=]*_posthog=([^;]+)/);
        if (match && match[1]) {
          try {
            const decoded = decodeURIComponent(match[1]);
            const parsed = JSON.parse(decoded);
            if (parsed && parsed.distinct_id) distinctId = String(parsed.distinct_id);
          } catch (parseError) {
            console.error("posthog instrumentation: failed to parse cookie", parseError);
          }
        }
      }
    } catch {
      // ignore cookie parsing issues
    }

    const url = (request as Request).url ?? "";
    const method = (request as Request).method ?? "GET";
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const properties: Record<string, unknown> = {
      url,
      method,
      userAgent,
    };

    await captureExceptionOnServer(err, distinctId, properties);
  } catch (captureError) {
    console.error("posthog instrumentation: failed to capture exception", captureError);
  }
};
