import { serverOnly } from "@tanstack/react-start";

/**
 * Server-only helper to get the database connection
 * This ensures the database module is never included in the client bundle
 */
export const getDb = serverOnly(async () => {
  const { db } = await import("~/db");
  return db();
});

/**
 * Server-only helper to get the unpooled database connection
 * Use this for migrations and long-running operations
 */
export const getUnpooledDb = serverOnly(async () => {
  const { unpooledDb } = await import("~/db");
  return unpooledDb();
});
