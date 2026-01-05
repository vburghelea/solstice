import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "~/lib/auth/server-helpers";
import { maybeRateLimitAuthRequest } from "~/lib/auth/auth-rate-limit";

export const Route = createFileRoute("/api/auth/$action/$provider")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      POST: async ({ request }) => {
        const rateLimited = await maybeRateLimitAuthRequest(request);
        if (rateLimited) return rateLimited;
        const auth = await getAuth();
        return await auth.handler(request);
      },
    },
  },
});
