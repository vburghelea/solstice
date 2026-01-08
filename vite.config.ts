import tailwindcss from "@tailwindcss/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";

// Browser-safe alias for node:async_hooks to prevent client-side crashes
const aliasNodeAsyncHooksForClient = (): Plugin => ({
  name: "alias-node-async_hooks-browser",
  enforce: "pre",
  resolveId(source, _importer, options) {
    if (source === "node:async_hooks" && !options?.ssr) {
      // Map only client-side imports to the shim
      return new URL("./src/shims/async-local-storage.browser.ts", import.meta.url)
        .pathname;
    }
    return null;
  },
});

export default defineConfig(({ mode }) => {
  // Ensure .env variables are loaded into process.env for server-side code
  const env = loadEnv(mode, process.cwd(), "");
  // Merge loaded env into process.env
  for (const [key, val] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = val;
  }

  return {
    plugins: [
      // Browser shim for node:async_hooks - prevents client crashes
      aliasNodeAsyncHooksForClient(),

      // Keep path aliasing & tailwind first
      tsConfigPaths({
        projects: ["./tsconfig.json"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      tailwindcss(),

      // IMPORTANT: TanStack Start before react(), with React plugin provided separately
      tanstackStart({
        router: {
          quoteStyle: "double",
          semicolons: true,
          routeFileIgnorePrefix: "__tests__",
          // verboseFileRoutes: false,
        },
      }),

      // Nitro v2 plugin for Netlify deployment
      // Using modern netlify preset (not netlify-legacy) for better performance
      nitroV2Plugin({
        preset: "netlify",
        compatibilityDate: "2026-01-08",
      }),

      // React plugin explicitly provided (required for TanStack Start RC v1.132+)
      // with React compiler configuration
      react({
        babel: {
          plugins: [
            [
              "babel-plugin-react-compiler",
              {
                target: "19",
              },
            ],
          ],
        },
      }),

      // Keep PWA after the app framework plugins
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "icons/roundup-games-icon.svg",
          "icons/roundup-games-icon-maskable.svg",
        ],
        manifest: {
          id: "/",
          name: "Roundup Games",
          short_name: "Roundup Games",
          description:
            "Roundup Games, a platform for local-first gatherings around tabletop and board games.",
          theme_color: "#d82929",
          background_color: "#ffffff",
          start_url: "/",
          display: "standalone",
          icons: [
            {
              src: "/icons/roundup-games-icon.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/icons/roundup-games-icon-maskable.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.destination === "document",
              handler: "NetworkFirst",
              options: {
                cacheName: "roundup-pages",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 30 },
              },
            },
            {
              urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/events"),
              handler: "NetworkFirst",
              options: {
                cacheName: "roundup-events",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 },
              },
            },
            {
              urlPattern: ({ request }: { request: Request }) =>
                request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "roundup-images",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],

    // Development-only CSP to allow PostHog & Vite HMR while keeping other defaults strict.
    // Note: We allow 'unsafe-inline' in dev because TanStack Router's <ScriptOnce> renders
    // an inline script. Production CSP is handled by Netlify Edge with nonces/hashes.
    server: {
      headers: {
        "Content-Security-Policy": [
          "default-src 'self'",
          "base-uri 'self'",
          "frame-ancestors 'none'",
          "img-src 'self' https: data: blob:",
          "style-src 'self' 'unsafe-inline'",
          "font-src 'self' https: data:",
          "connect-src 'self' ws://localhost:* https://eu.i.posthog.com https://eu-assets.i.posthog.com wss://eu.i.posthog.com",
          "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://eu-assets.i.posthog.com https://eu.i.posthog.com",
          "worker-src 'self' blob:",
          "media-src 'self' blob:",
        ].join("; "),
      },
    },

    // Vite will attach this nonce to its own injected tags. Our inline scripts from
    // React SSR (e.g., <ScriptOnce>) are allowed in dev via 'unsafe-inline' above.
    html: {
      cspNonce: "dev-nonce",
    },

    optimizeDeps: {
      // Avoid prebundling Start internals that reference AsyncLocalStorage
      exclude: [
        "@tanstack/react-store",
        "@tanstack/react-start",
        "@tanstack/start-storage-context",
        "node:async_hooks",
      ],
      include: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@tanstack/react-router-ssr-query",
        // Removed: "@tanstack/react-start/server-functions-client" - can drag server bits into client
        "@radix-ui/react-slot",
        "@radix-ui/react-label",
        "class-variance-authority",
        "@tanstack/react-query-devtools",
        "@tanstack/react-router-devtools",
        "clsx",
        "tailwind-merge",
        "better-auth/react",
        "@t3-oss/env-core",
        "zod",
        "lucide-react",
      ],
    },
  };
});
