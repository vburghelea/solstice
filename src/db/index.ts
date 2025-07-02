import { getDb, pooledDb, unpooledDb } from "./connections";
import * as schema from "./schema";

// Export the auto-selected database connection based on environment
// This must be a function that is called within a server context.
export const db = getDb;

// Export specific connections for when you need explicit control
export { pooledDb, unpooledDb };

// Re-export all schemas and types
export * from "./schema";
export { schema };
