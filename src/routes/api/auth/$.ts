import { createServerFileRoute } from "@tanstack/react-start/server";
import { auth } from "~/lib/auth";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: ({ request }) => {
    console.log("Auth GET request:", request.url);
    console.log("Request method:", request.method);
    console.log("Request path:", new URL(request.url).pathname);
    return auth.handler(request);
  },
  POST: ({ request }) => {
    console.log("Auth POST request:", request.url);
    console.log("Request method:", request.method);
    console.log("Request path:", new URL(request.url).pathname);
    return auth.handler(request);
  },
});
