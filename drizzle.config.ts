import type { Config } from "drizzle-kit";

// Use unpooled connection for migrations
// Priority: DATABASE_URL_UNPOOLED > NETLIFY_DATABASE_URL_UNPOOLED > DATABASE_URL
const getDatabaseUrl = () => {
  return (
    process.env["DATABASE_URL_UNPOOLED"] ||
    process.env["NETLIFY_DATABASE_URL_UNPOOLED"] ||
    (process.env["DATABASE_URL"] as string)
  );
};

export default {
  out: "./src/db/migrations",
  schema: "./src/db/schema/index.ts",
  breakpoints: true,
  verbose: true,
  strict: true,
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
} satisfies Config;
