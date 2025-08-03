import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$action/$provider").methods({
  GET: async ({ request }) => {
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const auth = await getAuth();
    return auth.handler(request);
  },
  POST: async ({ request }) => {
    const { getAuth } = await import("~/lib/auth/server-helpers");
    const auth = await getAuth();
    return auth.handler(request);
  },
});
