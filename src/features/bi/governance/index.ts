/**
 * Governance Layer - Public API
 *
 * Access control, org scoping, and audit logging for BI.
 */

export {
  applyOrgScopingFilter,
  buildOrgScopingClause,
  determineOrgScoping,
  type OrgScopingResult,
} from "./org-scoping";

export {
  checkFieldAccess,
  filterAccessibleFields,
  getFieldsToMask,
  maskPiiFields,
  queryIncludesPii,
  type FieldAccessResult,
} from "./field-acl";

export {
  computeChecksum,
  computeQueryHash,
  logExport,
  logQuery,
  verifyAuditChain,
  type LogQueryParams,
  type QueryType,
} from "./audit-logger";

export {
  QUERY_GUARDRAILS,
  acquireConcurrencySlot,
  buildLimitedQuery,
  inlineParameters,
  stripTrailingSemicolons,
} from "./query-guardrails";

export { assertExportAllowed } from "./export-controls";
