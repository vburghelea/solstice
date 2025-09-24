import { createServerFileRoute } from "@tanstack/react-start/server";
import { getAuth } from "~/lib/auth/server-helpers";

type RequestContext = { request: Request };

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
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
});
