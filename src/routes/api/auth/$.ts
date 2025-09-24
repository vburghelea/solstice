import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "~/lib/auth/server-helpers";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      POST: async ({ request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      OPTIONS: async ({ request }) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
    },
  },
});
