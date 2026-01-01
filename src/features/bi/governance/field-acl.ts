/**
 * Field-Level Access Control
 *
 * Enforces field-level permissions for BI queries based on user permissions.
 * Masks PII fields for non-privileged users.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md (Governance Model)
 */

import type { DatasetField, QueryContext } from "../bi.types";

export const PII_PERMISSIONS = ["*", "pii.read", "pii:read", "data.pii.read"];

export function canViewSensitiveFields(permissions: Set<string>): boolean {
  return PII_PERMISSIONS.some((permission) => permissions.has(permission));
}

const hasPermission = (permissions: Set<string>, required?: string): boolean => {
  if (!required) return true;
  return permissions.has(required) || permissions.has("*");
};

export interface FieldAccessResult {
  canAccess: boolean;
  isPii: boolean;
  shouldMask: boolean;
  reason: string;
}

export function checkFieldAccess(
  field: DatasetField,
  context: QueryContext,
  isExport: boolean = false,
): FieldAccessResult {
  const hasRequiredPermission = hasPermission(
    context.permissions,
    field.requiredPermission,
  );

  if (!hasRequiredPermission) {
    return {
      canAccess: false,
      isPii: field.piiClassification !== undefined && field.piiClassification !== "none",
      shouldMask: false,
      reason: `Missing permission ${field.requiredPermission ?? ""}`,
    };
  }

  const isPii =
    field.piiClassification !== undefined && field.piiClassification !== "none";
  const canViewPii = context.isGlobalAdmin || canViewSensitiveFields(context.permissions);

  if (isPii && (!canViewPii || (isExport && !context.hasRecentAuth))) {
    return {
      canAccess: true,
      isPii: true,
      shouldMask: true,
      reason: "PII field masked",
    };
  }

  return {
    canAccess: true,
    isPii,
    shouldMask: false,
    reason: "Field access granted",
  };
}

export function filterAccessibleFields(
  fields: DatasetField[],
  context: QueryContext,
): DatasetField[] {
  return fields.filter((field) => checkFieldAccess(field, context).canAccess);
}

export function getFieldsToMask(
  fields: DatasetField[],
  context: QueryContext,
  isExport: boolean = false,
): string[] {
  return fields
    .filter((field) => checkFieldAccess(field, context, isExport).shouldMask)
    .map((field) => field.id);
}

export function maskPiiFields(
  row: Record<string, unknown>,
  fieldsToMask: string[],
): Record<string, unknown> {
  if (fieldsToMask.length === 0) return row;

  const maskedRow = { ...row };
  for (const field of fieldsToMask) {
    if (field in maskedRow) {
      maskedRow[field] = "***";
    }
  }
  return maskedRow;
}

export function queryIncludesPii(
  requestedFields: string[],
  datasetFields: DatasetField[],
): boolean {
  const fieldMap = new Map(datasetFields.map((field) => [field.id, field]));
  return requestedFields.some((fieldId) => {
    const field = fieldMap.get(fieldId);
    return field?.piiClassification !== undefined && field.piiClassification !== "none";
  });
}
