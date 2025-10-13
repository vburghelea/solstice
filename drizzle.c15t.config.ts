import type { Config } from "drizzle-kit";

export default {
  out: "./src/db/migrations",
  schema: "./src/features/consent/c15t.schema.ts",
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url:
      (process.env["C15T_DATABASE_URL"] as string) ||
      process.env["DATABASE_URL_UNPOOLED"] ||
      "",
  },
} satisfies Config;
