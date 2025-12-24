/**
 * Request ID utilities
 *
 * IMPORTANT:
 * - This file is imported by cron/Lambda code bundled by SST (esbuild).
 * - Do NOT import TanStack Start server helpers from here.
 */
export const resolveRequestId = (headers?: Headers | null): string => {
  const headerValue = headers?.get("x-request-id");
  return headerValue ?? globalThis.crypto.randomUUID();
};
