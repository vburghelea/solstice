import type { Config, Context } from "@netlify/edge-functions";

export default async function handler(req: Request, context: Context) {
  const response = await context.next();

  // Generate a nonce for CSP
  const nonce = crypto.randomUUID();

  // Get the response body to inject nonce into scripts
  const contentType = response.headers.get("content-type");
  const isHtml = contentType?.includes("text/html");

  // Clone the response to add headers
  const newResponse = new Response(response.body, response);

  // Determine if we're in development
  const url = new URL(req.url);
  const isDevelopment = url.hostname === "localhost" || url.hostname === "127.0.0.1";

  // Security Headers
  const headers = {
    // Content Security Policy
    "Content-Security-Policy": [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'sha256-NatFdn9qa3ivEDVSUujTj3/04jf+6XsuTh7hTdyWQdE=' https://challenges.cloudflare.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      `connect-src 'self' ${isDevelopment ? "http://localhost:* ws://localhost:*" : ""} https://api.github.com https://accounts.google.com https://www.googleapis.com`,
      "frame-src 'self' https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),

    // Other Security Headers
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",

    // Remove server header
    "X-Powered-By": "",
  };

  // Apply all headers
  Object.entries(headers).forEach(([key, value]) => {
    if (value) {
      newResponse.headers.set(key, value);
    } else {
      newResponse.headers.delete(key);
    }
  });

  // If HTML response, inject nonce into script tags
  if (isHtml && response.body) {
    const text = await response.text();
    const modifiedHtml = text.replace(
      /<script(?![^>]*\snonce=)/g,
      `<script nonce="${nonce}"`,
    );

    return new Response(modifiedHtml, {
      status: newResponse.status,
      statusText: newResponse.statusText,
      headers: newResponse.headers,
    });
  }

  return newResponse;
}

export const config: Config = {
  path: "/*",
};
