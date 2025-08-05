import { createServerFileRoute } from "@tanstack/react-start/server";
import { getAuth } from "~/lib/auth/server-helpers";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
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
});
