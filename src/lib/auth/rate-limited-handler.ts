import { serverOnly } from "@tanstack/react-start";
import { getClientIp, rateLimit } from "~/lib/security/middleware/rate-limit";
import { auth } from "./index";

/**
 * Rate-limited auth handler that wraps Better Auth's handler
 * Applies different rate limits based on the auth action
 */
export const rateLimitedAuthHandler = serverOnly(async (request: Request) => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Determine if this is a sensitive auth endpoint that needs stricter rate limiting
  const isAuthAction =
    pathname.includes("/sign-in") ||
    pathname.includes("/sign-up") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/reset-password") ||
    pathname.includes("/verify-email");

  if (isAuthAction) {
    try {
      // Apply auth rate limit for sensitive endpoints
      const clientIp = await getClientIp(request.headers);
      await rateLimit("auth", clientIp);
    } catch (error) {
      // If rate limit is exceeded, return 429 response
      if (error instanceof Error && "status" in error && error.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Too Many Requests",
            message: error.message,
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
      }
      throw error;
    }
  }

  // Pass through to Better Auth handler
  return auth.handler(request);
});
