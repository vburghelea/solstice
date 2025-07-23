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
    define: {
      // Provide NODE_ENV to client
      "process.env.NODE_ENV": JSON.stringify(mode),
    },
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
        "@tanstack/react-start/server-functions-client",
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
