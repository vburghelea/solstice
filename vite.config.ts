import netlify from "@netlify/vite-plugin-tanstack-start";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
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

      tanstackStart({
        router: {
          quoteStyle: "double",
          semicolons: true,
          // verboseFileRoutes: false,
        },
      }),

      // Netlify adapter for TanStack Start (SSR, server routes/functions)
      netlify(),

      viteReact({
        // https://react.dev/learn/react-compiler
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
          "icons/quadball-icon.svg",
          "icons/quadball-icon-maskable.svg",
        ],
        manifest: {
          id: "/",
          name: "Quadball Canada",
          short_name: "Quadball CA",
          description:
            "Official Quadball Canada platform for national events, club resources, and membership tools.",
          theme_color: "#d82929",
          background_color: "#ffffff",
          start_url: "/",
          display: "standalone",
          icons: [
            {
              src: "/icons/quadball-icon.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/icons/quadball-icon-maskable.svg",
              sizes: "512x512",
              type: "image/svg+xml",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkFirst",
              options: {
                cacheName: "qc-pages",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 30 },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/events"),
              handler: "NetworkFirst",
              options: {
                cacheName: "qc-events",
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 30 },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "qc-images",
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
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@tanstack/react-start",
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
      // Don't prebundle these to avoid server code leaking
      exclude: ["@tanstack/start-storage-context", "node:async_hooks"],
    },
  };
});
