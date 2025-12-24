import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";

// Browser-safe aliases for Node-only modules referenced by server bundles.
const aliasNodeModulesForClient = (): Plugin => ({
  name: "alias-node-modules-browser",
  enforce: "pre",
  resolveId(source, _importer, options) {
    if (options?.ssr) return null;

    if (source === "node:async_hooks") {
      return new URL("./src/shims/async-local-storage.browser.ts", import.meta.url)
        .pathname;
    }
    if (source === "node:stream") {
      return new URL("./src/shims/stream.browser.ts", import.meta.url).pathname;
    }
    if (source === "node:stream/web") {
      return new URL("./src/shims/stream-web.browser.ts", import.meta.url).pathname;
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
      aliasNodeModulesForClient(),

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

      // Nitro adapter for AWS Lambda deployment via SST
      nitro(),

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
          // Don't precache HTML - always fetch fresh from network
          navigateFallback: null,
          runtimeCaching: [
            // Documents (HTML) - always fetch from network, never cache
            // This prevents stale authenticated content after logout
            {
              urlPattern: ({ request }) => request.destination === "document",
              handler: "NetworkOnly",
            },
            // Static images - cache aggressively
            {
              urlPattern: ({ request }) => request.destination === "image",
              handler: "CacheFirst",
              options: {
                cacheName: "qc-images",
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            // Static assets (JS, CSS) - cache with network fallback
            {
              urlPattern: ({ request }) =>
                request.destination === "script" || request.destination === "style",
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "qc-assets",
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    server: {
      port: 5173,
    },
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
    // Nitro configuration for AWS Lambda deployment
    // See docs/lambda-timeout-approaches.md for full analysis
    //
    // Two entry files are available:
    // - aws-lambda-streaming.mjs: Non-streaming (buffered), works with VPC
    // - aws-lambda-response-streaming.mjs: Streaming, requires testing without VPC
    //
    // IMPORTANT: awsLambda.streaming controls TWO things via SST:
    // 1. The Function URL invokeMode (BUFFERED vs RESPONSE_STREAM)
    // 2. Whether SST enables streaming on the Lambda function
    //
    // VPC CAVEAT: AWS docs state "Lambda function URLs do not support response
    // streaming within a VPC environment." Since our Lambda is in a VPC for
    // RDS access, streaming may not work. Test by deploying and checking response.
    nitro: {
      preset: "aws-lambda",
      // Custom entries that fix Nitro 3.0.1-alpha.1 streaming bug + add callbackWaitsForEmptyEventLoop
      // See docs/lambda-timeout-approaches.md for full analysis
      //
      // Nitro appends "-streaming" to entry when awsLambda.streaming=true, so:
      // - Entry: src/nitro/aws-lambda-response (no extension)
      // - streaming=false: resolves to src/nitro/aws-lambda-response.mjs
      // - streaming=true: resolves to src/nitro/aws-lambda-response-streaming.mjs
      //
      // VPC CAVEAT: AWS docs say Function URLs don't support streaming in VPC.
      // If streaming fails, set streaming: false
      entry: "src/nitro/aws-lambda-response",
      awsLambda: {
        streaming: true,
      },
    },
  };
});
