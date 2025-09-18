import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig, loadEnv } from "vite";
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
      ],
      include: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@tanstack/react-router-with-query",
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
