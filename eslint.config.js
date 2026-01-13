import react from "@eslint-react/eslint-plugin";
import js from "@eslint/js";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginRouter from "@tanstack/eslint-plugin-router";
import eslintConfigPrettier from "eslint-config-prettier";
import oxlint from "eslint-plugin-oxlint";
import * as reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "dev-dist",
      ".wrangler",
      ".vercel",
      ".netlify",
      ".output",
      ".sst/**",
      "sst.config.ts",
      "sst-env.d.ts",
      "build/",
      ".nitro/**",
      "coverage/**",
      "**/*.gen.ts",
      "node_modules/**",
      "vendor/**",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      eslintConfigPrettier,
      ...pluginQuery.configs["flat/recommended"],
      ...pluginRouter.configs["flat/recommended"],
      reactHooks.configs.recommended,
      react.configs["recommended-type-checked"],
    ],
    rules: {
      "react-hooks/react-compiler": "warn",
      "@typescript-eslint/no-deprecated": "warn",
    },
  },
  // Disable all rules that oxlint already covers - MUST be last
  ...oxlint.configs["flat/recommended"],
);
