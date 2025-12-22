import type { Config, Context } from "@netlify/edge-functions";

export default async function handler(req: Request, context: Context) {
  const response = await context.next();

  // Generate a nonce for CSP (may be replaced with one from HTML)
  let nonce: string = crypto.randomUUID();

  // Determine if we're in development
  const url = new URL(req.url);
  const isDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  const buildHeaders = (nonceValue: string) => ({
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonceValue}' 'sha256-NatFdn9qa3ivEDVSUujTj3/04jf+6XsuTh7hTdyWQdE=' 'sha256-KlDLetaHs3jydugAFrZVquz1h6i4vHS3ohIh0sfZqC4=' 'sha256-5JedoFHPMD1o/9fNxPf7aN8DGXTYs9UJC2bTfRPBFxY=' 'sha256-gHUVPg/ygmuHop+u65qJwyip1pg0/k2Ch2Va8wmwlgY=' https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      `connect-src 'self' ${isDevelopment ? "ws://localhost:*" : ""} https://accounts.google.com https://www.googleapis.com`,
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
  });

  const contentType = response.headers.get("content-type");
  const isHtml = contentType?.includes("text/html");

  // If not HTML, clone response and add headers
  if (!isHtml) {
    const newResponse = new Response(response.body, response);
    const headers = buildHeaders(nonce);
    Object.entries(headers).forEach(([key, value]) => {
      newResponse.headers.set(key, value);
    });
    newResponse.headers.delete("X-Powered-By");
    return newResponse;
  }

  // For HTML responses, read the body, reuse existing nonce if present, and inject if missing
  const text = await response.text();
  const nonceMatch =
    text.match(/<meta[^>]+property=["']csp-nonce["'][^>]+content=["']([^"']+)["']/i) ??
    text.match(/<script[^>]+nonce=["']([^"']+)["']/i);

  if (nonceMatch?.[1]) {
    nonce = nonceMatch[1];
  }

  const modifiedHtml = text.replace(
    /<script(?![^>]*\snonce=)/g,
    `<script nonce="${nonce}"`,
  );

  const newResponse = new Response(modifiedHtml, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  const headers = buildHeaders(nonce);
  Object.entries(headers).forEach(([key, value]) => {
    newResponse.headers.set(key, value);
  });
  newResponse.headers.delete("X-Powered-By");

  return newResponse;
}

export const config: Config = {
  path: "/*",
};
