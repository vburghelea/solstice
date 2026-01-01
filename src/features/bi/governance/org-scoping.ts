/**
 * Organization Scoping
 *
 * Enforces organization-level data isolation for BI queries.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md (Governance Model)
 */

import type { DatasetConfig, QueryContext } from "../bi.types";

export interface OrgScopingResult {
  shouldScope: boolean;
  scopeOrgId: string | null;
  scopeColumn: string | null;
  reason: string;
}

export function determineOrgScoping(
  context: QueryContext,
  dataset: DatasetConfig,
): OrgScopingResult {
  if (context.isGlobalAdmin) {
    return {
      shouldScope: false,
      scopeOrgId: null,
      scopeColumn: null,
      reason: "Global admin - org scoping bypassed",
    };
  }

  if (!dataset.requiresOrgScope) {
    return {
      shouldScope: false,
      scopeOrgId: null,
      scopeColumn: null,
      reason: `Dataset '${dataset.id}' does not require org scoping`,
    };
  }

  if (!dataset.orgScopeColumn) {
    return {
      shouldScope: true,
      scopeOrgId: context.organizationId,
      scopeColumn: "organizationId",
      reason: `Dataset '${dataset.id}' missing orgScopeColumn - using default`,
    };
  }

  return {
    shouldScope: true,
    scopeOrgId: context.organizationId,
    scopeColumn: dataset.orgScopeColumn,
    reason: `Scoped to org ${context.organizationId}`,
  };
}

export function applyOrgScopingFilter(
  data: Record<string, unknown>[],
  scoping: OrgScopingResult,
): Record<string, unknown>[] {
  if (!scoping.shouldScope || !scoping.scopeOrgId || !scoping.scopeColumn) {
    return data;
  }

  return data.filter((row) => row[scoping.scopeColumn!] === scoping.scopeOrgId);
}

export function buildOrgScopingClause(scoping: OrgScopingResult): string | null {
  if (!scoping.shouldScope || !scoping.scopeOrgId || !scoping.scopeColumn) {
    return null;
  }

  return `${scoping.scopeColumn} = :orgId`;
}
