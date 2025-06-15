import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => {
  // Load test environment variables
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tsconfigPaths()],
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/tests/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
      exclude: ["node_modules", "dist", ".next", ".cache", "build"],
      coverage: {
        reporter: ["text", "json", "html"],
        exclude: [
          "node_modules/",
          "src/tests/",
          "**/*.d.ts",
          "**/*.config.*",
          "**/mockData.ts",
          "src/routeTree.gen.ts",
        ],
      },
      env: {
        ...env,
        // Override with test-specific env vars if needed
        VITE_BASE_URL: "http://localhost:3000",
      },
    },
    resolve: {
      alias: {
        "~": "/src",
      },
    },
  };
});
