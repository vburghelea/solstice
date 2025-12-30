/**
 * Organization Scoping
 *
 * Enforces organization-level data isolation for BI queries.
 * All queries are automatically scoped to the user's organization unless
 * they have global admin permissions.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md (Governance Model)
 */

import type { DatasetConfig, QueryContext } from "../bi.types";

/**
 * Result of org scoping check
 */
export interface OrgScopingResult {
  /** Whether org scoping should be applied */
  shouldScope: boolean;
  /** Organization ID to scope to (null if global admin) */
  scopeOrgId: string | null;
  /** Column to use for scoping */
  scopeColumn: string | null;
  /** Reason for the scoping decision */
  reason: string;
}

/**
 * Determine org scoping for a query
 *
 * @param context - Query execution context
 * @param dataset - Dataset configuration
 * @returns Org scoping result with decision and reason
 */
export function determineOrgScoping(
  context: QueryContext,
  dataset: DatasetConfig,
): OrgScopingResult {
  // Global admins bypass org scoping
  if (context.isGlobalAdmin) {
    return {
      shouldScope: false,
      scopeOrgId: null,
      scopeColumn: null,
      reason: "Global admin - org scoping bypassed",
    };
  }

  // Dataset doesn't require org scoping
  if (!dataset.requiresOrgScope) {
    return {
      shouldScope: false,
      scopeOrgId: null,
      scopeColumn: null,
      reason: `Dataset '${dataset.id}' does not require org scoping`,
    };
  }

  // Missing org scope column configuration
  if (!dataset.orgScopeColumn) {
    // This is a configuration error - fail safe
    return {
      shouldScope: true,
      scopeOrgId: context.organizationId,
      scopeColumn: "organization_id", // Default fallback
      reason: `Dataset '${dataset.id}' missing orgScopeColumn - using default`,
    };
  }

  // Normal case: scope to user's organization
  return {
    shouldScope: true,
    scopeOrgId: context.organizationId,
    scopeColumn: dataset.orgScopeColumn,
    reason: `Scoped to org ${context.organizationId}`,
  };
}

/**
 * Apply org scoping filter to data
 *
 * @param data - Raw data rows
 * @param scoping - Org scoping result
 * @returns Filtered data (only rows belonging to the scoped org)
 */
export function applyOrgScopingFilter(
  data: Record<string, unknown>[],
  scoping: OrgScopingResult,
): Record<string, unknown>[] {
  if (!scoping.shouldScope || !scoping.scopeOrgId || !scoping.scopeColumn) {
    return data;
  }

  return data.filter((row) => row[scoping.scopeColumn!] === scoping.scopeOrgId);
}

/**
 * Build SQL WHERE clause for org scoping
 *
 * Used when constructing database queries.
 *
 * @param scoping - Org scoping result
 * @returns SQL WHERE clause fragment (without 'WHERE' keyword)
 */
export function buildOrgScopingClause(scoping: OrgScopingResult): string | null {
  if (!scoping.shouldScope || !scoping.scopeOrgId || !scoping.scopeColumn) {
    return null;
  }

  // Note: In actual implementation, use parameterized queries
  // This is just for illustration of the clause structure
  return `${scoping.scopeColumn} = :orgId`;
}
