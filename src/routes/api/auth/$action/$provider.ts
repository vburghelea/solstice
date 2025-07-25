import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$action/$provider").methods({
  GET: async ({ request }) => {
    const { auth } = await import("~/lib/auth");
    return auth.handler(request);
  },
  POST: async ({ request }) => {
    const { auth } = await import("~/lib/auth");
    return auth.handler(request);
  },
});
