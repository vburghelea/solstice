import type { Config } from "drizzle-kit";
import { createRequire } from "node:module";

type LinkedDatabase = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

const require = createRequire(import.meta.url);

const getLinkedDatabase = (): LinkedDatabase | undefined => {
  try {
    const { Resource } = require("sst") as {
      Resource?: { Database?: LinkedDatabase };
    };
    return Resource?.Database;
  } catch {
    return undefined;
  }
};

// Use unpooled connection for migrations
// Priority: DATABASE_URL_UNPOOLED > NETLIFY_DATABASE_URL_UNPOOLED > DATABASE_URL
const getDatabaseUrl = () => {
  return (
    process.env["DATABASE_URL_UNPOOLED"] ||
    process.env["NETLIFY_DATABASE_URL_UNPOOLED"] ||
    (process.env["DATABASE_URL"] as string)
  );
};

const requireDatabaseUrl = () => {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Run via `sst shell drizzle-kit` or set DATABASE_URL_UNPOOLED.",
    );
  }
  return url;
};

const getDbCredentials = () => {
  const linked = getLinkedDatabase();
  if (linked) {
    return {
      host: linked.host,
      port: linked.port,
      user: linked.username,
      password: linked.password,
      database: linked.database,
    };
  }

  return { url: requireDatabaseUrl() };
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
    ...getDbCredentials(),
  },
} satisfies Config;
