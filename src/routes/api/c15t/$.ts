import { createServerFileRoute } from "@tanstack/react-start/server";
import { getConsentBackend } from "~/features/consent/c15t.server";

type RequestContext = { request: Request };

const handleRequest = async ({ request }: RequestContext) => {
  const backend = await getConsentBackend();
  return await backend.handler(request);
};

export const ServerRoute = createServerFileRoute("/api/c15t/$").methods({
  GET: handleRequest,
  POST: handleRequest,
  PUT: handleRequest,
  PATCH: handleRequest,
  DELETE: handleRequest,
  OPTIONS: handleRequest,
  HEAD: handleRequest,
});
