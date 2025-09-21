import type { Config, Context } from "@netlify/edge-functions";

export default async function handler(req: Request, context: Context) {
  const response = await context.next();

  // Generate a nonce for CSP
  const nonce = crypto.randomUUID();

  // Determine if we're in development
  const url = new URL(req.url);
  const isDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  // Base headers - applied to all responses
  const headers = {
    "Content-Security-Policy": [
      "default-src 'self'",
      // Allow trusted scripts + PostHog CDN + blob: for worker bootstraps. Prefer nonce/hashes; no generic inline allowed.
      `script-src 'self' 'unsafe-eval' 'nonce-${nonce}' 'sha256-NatFdn9qa3ivEDVSUujTj3/04jf+6XsuTh7hTdyWQdE=' 'sha256-KlDLetaHs3jydugAFrZVquz1h6i4vHS3ohIh0sfZqC4=' 'sha256-xqOjbNm60mQzEVYVjZCljL+3FDPBOA1akQuoSdPNNtw=' 'sha256-5JedoFHPMD1o/9fNxPf7aN8DGXTYs9UJC2bTfRPBFxY=' 'sha256-gHUVPg/ygmuHop+u65qJwyip1pg0/k2Ch2Va8wmwlgY=' https://challenges.cloudflare.com https://eu-assets.i.posthog.com https://eu.i.posthog.com blob:`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      // PostHog APIs + websockets. Dev adds Vite WS.
      `connect-src 'self' ${isDevelopment ? "ws://localhost:*" : ""} https://accounts.google.com https://www.googleapis.com https://eu.i.posthog.com https://eu-assets.i.posthog.com wss://eu.i.posthog.com`,
      // Session recording uses a blob worker
      "worker-src 'self' blob:",
      // Allow media blobs if needed by analytics/session recording
      "media-src 'self' blob:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
    "X-XSS-Protection": "1; mode=block", // Deprecated, but good for older browsers
  };

  const contentType = response.headers.get("content-type");
  const isHtml = contentType?.includes("text/html");

  // If not HTML, clone response and add headers
  if (!isHtml) {
    const newResponse = new Response(response.body, response);
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    newResponse.headers.delete("X-Powered-By");
    return newResponse;
  }

  // For HTML responses, read the body, inject nonce, and create a new response
  const text = await response.text();
  const withScripts = text.replace(
    /<script(?![^>]*\snonce=)/g,
    `<script nonce="${nonce}"`,
  );
  const modifiedHtml = withScripts.replace(
    "</head>",
    `<meta name="csp-nonce" content="${nonce}"></head>`,
  );

  const newResponse = new Response(modifiedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  newResponse.headers.delete("X-Powered-By");

  return newResponse;
}

export const config: Config = {
  path: "/*",
};
