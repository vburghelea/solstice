import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Ensure .env variables are loaded into process.env for server-side code
  const env = loadEnv(mode, process.cwd(), "");
  // Merge loaded env into process.env
  for (const [key, val] of Object.entries(env)) {
    if (!(key in process.env)) process.env[key] = val;
  }

  return {
    plugins: [
      tsConfigPaths({
        projects: ["./tsconfig.json"],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
      tailwindcss(),
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
      tanstackStart({
        // https://react.dev/learn/react-compiler
        react: {
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
        },

        tsr: {
          quoteStyle: "double",
          semicolons: true,
          // verboseFileRoutes: false,
        },

        // Netlify deployment target
        target: "netlify",
      }),
    ],
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "@tanstack/react-start",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@tanstack/react-router-with-query",
        "@radix-ui/react-slot",
        "@radix-ui/react-label",
        "class-variance-authority",
        "@tanstack/react-query-devtools",
        "@tanstack/react-router-devtools",
        "@tanstack/react-start/server-functions-client",
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
