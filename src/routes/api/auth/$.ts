import { createServerFileRoute } from "@tanstack/react-start/server";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: async ({ request }) => {
    const { auth } = await import("~/lib/auth");
    return auth.handler(request);
  },
  POST: async ({ request }) => {
    const { auth } = await import("~/lib/auth");
    return auth.handler(request);
  },
  OPTIONS: async ({ request }) => {
    const { auth } = await import("~/lib/auth");
    return auth.handler(request);
  },
});
