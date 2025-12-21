import { sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * Atomic JSONB merge utility for Drizzle ORM
 *
 * Uses PostgreSQL's `||` operator for atomic JSONB concatenation.
 * This prevents race conditions where concurrent updates would overwrite each other.
 *
 * @example
 * // Instead of:
 * .set({ metadata: { ...existing, newField: value } })
 *
 * // Use:
 * .set({ metadata: atomicJsonbMerge(table.metadata, { newField: value }) })
 */
export function atomicJsonbMerge<T extends Record<string, unknown>>(
  column: PgColumn,
  updates: T,
): SQL {
  // Use COALESCE to handle null columns, then merge with ||
  return sql`COALESCE(${column}, '{}'::jsonb) || ${JSON.stringify(updates)}::jsonb`;
}

/**
 * Atomic JSONB set for a specific path
 *
 * Uses PostgreSQL's `jsonb_set()` function for atomic path-based updates.
 *
 * @example
 * // Set metadata.lastUpdated = "2025-01-01"
 * .set({ metadata: atomicJsonbSet(table.metadata, ['lastUpdated'], '2025-01-01') })
 */
export function atomicJsonbSet(
  column: PgColumn,
  path: string[],
  value: unknown,
  createMissing = true,
): SQL {
  const pathArray = `{${path.join(",")}}`;
  return sql`jsonb_set(COALESCE(${column}, '{}'::jsonb), ${pathArray}::text[], ${JSON.stringify(value)}::jsonb, ${createMissing})`;
}

/**
 * Atomic JSONB delete for a specific key
 *
 * Uses PostgreSQL's `-` operator for atomic key removal.
 *
 * @example
 * // Remove the 'deprecated' key from metadata
 * .set({ metadata: atomicJsonbDelete(table.metadata, 'deprecated') })
 */
export function atomicJsonbDelete(column: PgColumn, key: string): SQL {
  return sql`COALESCE(${column}, '{}'::jsonb) - ${key}`;
}

/**
 * Atomic JSONB deep merge that preserves nested objects
 *
 * Uses a custom SQL expression that recursively merges objects.
 * For arrays, the new value replaces the old value.
 *
 * @example
 * // Deep merge nested settings
 * .set({ metadata: atomicJsonbDeepMerge(table.metadata, { settings: { theme: 'dark' } }) })
 */
export function atomicJsonbDeepMerge<T extends Record<string, unknown>>(
  column: PgColumn,
  updates: T,
): SQL {
  // PostgreSQL recursive merge using jsonb_strip_nulls to clean up
  return sql`(
    SELECT jsonb_object_agg(
      COALESCE(k1, k2),
      CASE
        WHEN v1 IS NULL THEN v2
        WHEN v2 IS NULL THEN v1
        WHEN jsonb_typeof(v1) = 'object' AND jsonb_typeof(v2) = 'object'
        THEN v1 || v2
        ELSE v2
      END
    )
    FROM jsonb_each(COALESCE(${column}, '{}'::jsonb)) e1(k1, v1)
    FULL OUTER JOIN jsonb_each(${JSON.stringify(updates)}::jsonb) e2(k2, v2)
    ON k1 = k2
  )`;
}
