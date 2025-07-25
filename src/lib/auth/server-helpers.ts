import { serverOnly } from "@tanstack/react-start";

/**
 * Server-only helper to get the auth instance
 * This ensures the auth module (which uses env vars) is never included in the client bundle
 */
export const getAuth = serverOnly(async () => {
  const { auth } = await import("~/lib/auth");
  return auth;
});
