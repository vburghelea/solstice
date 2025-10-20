import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "~/lib/auth/server-helpers";

type RequestContext = { request: Request };

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: RequestContext) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      POST: async ({ request }: RequestContext) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
      OPTIONS: async ({ request }: RequestContext) => {
        const auth = await getAuth();
        return await auth.handler(request);
      },
    },
  },
});
