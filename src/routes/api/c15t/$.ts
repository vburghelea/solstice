import { createFileRoute } from "@tanstack/react-router";
import { getConsentBackend } from "~/features/consent/c15t.server";

type RequestContext = { request: Request };

const handleRequest = async ({ request }: RequestContext) => {
  const backend = await getConsentBackend();
  return await backend.handler(request);
};

export const Route = createFileRoute("/api/c15t/$")({
  server: {
    handlers: {
      GET: handleRequest,
      POST: handleRequest,
      PUT: handleRequest,
      PATCH: handleRequest,
      DELETE: handleRequest,
      OPTIONS: handleRequest,
      HEAD: handleRequest,
    },
  },
});
