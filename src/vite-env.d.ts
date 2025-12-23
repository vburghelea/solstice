/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Server-side environment variables
  readonly DATABASE_URL?: string;
  readonly DATABASE_URL_UNPOOLED?: string;
  readonly DATABASE_POOLED_URL?: string;
  readonly DATABASE_UNPOOLED_URL?: string;
  readonly NETLIFY_DATABASE_URL?: string;
  readonly NETLIFY_DATABASE_URL_UNPOOLED?: string;
  readonly BETTER_AUTH_SECRET?: string;
  readonly GOOGLE_CLIENT_ID?: string;
  readonly GOOGLE_CLIENT_SECRET?: string;
  readonly COOKIE_DOMAIN?: string;
  readonly NODE_ENV?: "development" | "production" | "test";
  readonly NETLIFY?: string;
  readonly VERCEL_ENV?: string;

  // Client-side environment variables (VITE_ prefixed)
  readonly VITE_BASE_URL?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_ENABLE_SENTRY?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
