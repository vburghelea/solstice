/**
 * Field-Level Access Control
 *
 * Enforces field-level permissions for BI queries based on user role.
 * Filters out fields the user doesn't have permission to view and masks
 * PII fields in exports unless step-up auth is completed.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md (Governance Model)
 */

import type { DatasetField, QueryContext } from "../bi.types";

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
const ROLE_HIERARCHY: Record<string, number> = {
  reporter: 0,
  admin: 1,
  owner: 2,
};

/**
 * Check if user's role meets minimum requirement
 */
function hasMinRole(
  userRole: "owner" | "admin" | "reporter",
  minRole: "owner" | "admin" | "reporter",
): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minRole] ?? 0);
}

/**
 * Result of field access check
 */
export interface FieldAccessResult {
  /** Whether the user can access this field */
  canAccess: boolean;
  /** Whether the field contains PII */
  isPii: boolean;
  /** Whether PII masking should be applied */
  shouldMask: boolean;
  /** Reason for the access decision */
  reason: string;
}

/**
 * Check if user can access a specific field
 *
 * @param field - Field definition
 * @param context - Query execution context
 * @param isExport - Whether this is for an export operation
 * @returns Field access result
 */
export function checkFieldAccess(
  field: DatasetField,
  context: QueryContext,
  isExport: boolean = false,
): FieldAccessResult {
  // Check minimum role requirement
  if (field.minRole && !hasMinRole(context.orgRole, field.minRole)) {
    return {
      canAccess: false,
      isPii: field.isPii ?? false,
      shouldMask: false,
      reason: `Requires ${field.minRole} role, user has ${context.orgRole}`,
    };
  }

  // Global admins can see everything
  if (context.isGlobalAdmin) {
    return {
      canAccess: true,
      isPii: field.isPii ?? false,
      shouldMask: false,
      reason: "Global admin - full access",
    };
  }

  // PII field checks
  if (field.isPii) {
    // For exports, require recent auth
    if (isExport && !context.hasRecentAuth) {
      return {
        canAccess: true, // Can see, but masked
        isPii: true,
        shouldMask: true,
        reason: "PII field in export - requires step-up auth for unmasked",
      };
    }

    return {
      canAccess: true,
      isPii: true,
      shouldMask: false,
      reason: "PII field - access granted",
    };
  }

  // Standard field
  return {
    canAccess: true,
    isPii: false,
    shouldMask: false,
    reason: "Standard field - access granted",
  };
}

/**
 * Filter fields to only those accessible by user
 *
 * @param fields - All fields in a dataset
 * @param context - Query execution context
 * @returns Accessible fields only
 */
export function filterAccessibleFields(
  fields: DatasetField[],
  context: QueryContext,
): DatasetField[] {
  return fields.filter((field) => {
    const access = checkFieldAccess(field, context);
    return access.canAccess;
  });
}

/**
 * Get fields that require masking for export
 *
 * @param fields - Fields included in export
 * @param context - Query execution context
 * @returns Field names that should be masked
 */
export function getFieldsToMask(fields: DatasetField[], context: QueryContext): string[] {
  return fields
    .filter((field) => {
      const access = checkFieldAccess(field, context, true);
      return access.shouldMask;
    })
    .map((field) => field.column);
}

/**
 * Mask PII values in a data row
 *
 * @param row - Data row
 * @param fieldsToMask - Field names to mask
 * @returns Row with masked values
 */
export function maskPiiFields(
  row: Record<string, unknown>,
  fieldsToMask: string[],
): Record<string, unknown> {
  if (fieldsToMask.length === 0) return row;

  const maskedRow = { ...row };
  for (const field of fieldsToMask) {
    if (field in maskedRow) {
      maskedRow[field] = "***MASKED***";
    }
  }
  return maskedRow;
}

/**
 * Check if query includes any PII fields
 *
 * @param requestedFields - Fields requested in query
 * @param datasetFields - All fields in dataset
 * @returns True if any requested field is PII
 */
export function queryIncludesPii(
  requestedFields: string[],
  datasetFields: DatasetField[],
): boolean {
  const fieldMap = new Map(datasetFields.map((f) => [f.column, f]));
  return requestedFields.some((fieldName) => {
    const field = fieldMap.get(fieldName);
    return field?.isPii ?? false;
  });
}
