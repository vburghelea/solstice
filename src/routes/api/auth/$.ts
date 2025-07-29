import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: async ({ request }) => {
    const { rateLimitedAuthHandler } = await import("~/lib/auth/rate-limited-handler");
    return rateLimitedAuthHandler(request);
  },
  POST: async ({ request }) => {
    const { rateLimitedAuthHandler } = await import("~/lib/auth/rate-limited-handler");
    return rateLimitedAuthHandler(request);
  },
  OPTIONS: async ({ request }) => {
    const { rateLimitedAuthHandler } = await import("~/lib/auth/rate-limited-handler");
    return rateLimitedAuthHandler(request);
  },
});
