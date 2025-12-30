/**
 * Dataset Configuration
 *
 * Defines available datasets for BI queries. Each dataset maps to a database
 * table/view and specifies which fields are queryable, their types, and access rules.
 *
 * This is the semantic layer - user-friendly field names and query restrictions.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md
 */

import type { DatasetConfig, DatasetField } from "../bi.types";

// =============================================================================
// Field Definitions
// =============================================================================

const organizationFields: DatasetField[] = [
  {
    column: "id",
    label: "Organization ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "name",
    label: "Organization Name",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "slug",
    label: "Slug",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "type",
    label: "Organization Type",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "status",
    label: "Status",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "created_at",
    label: "Created At",
    type: "datetime",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
];

const memberFields: DatasetField[] = [
  {
    column: "id",
    label: "Member ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "organization_id",
    label: "Organization ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "membership_type",
    label: "Membership Type",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "status",
    label: "Status",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "created_at",
    label: "Created At",
    type: "datetime",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
  // PII fields - require step-up auth for export
  {
    column: "email",
    label: "Email",
    type: "string",
    allowDimension: false,
    allowMeasure: false,
    isPii: true,
    minRole: "admin",
  },
  {
    column: "first_name",
    label: "First Name",
    type: "string",
    allowDimension: false,
    allowMeasure: false,
    isPii: true,
    minRole: "admin",
  },
  {
    column: "last_name",
    label: "Last Name",
    type: "string",
    allowDimension: false,
    allowMeasure: false,
    isPii: true,
    minRole: "admin",
  },
];

const formSubmissionFields: DatasetField[] = [
  {
    column: "id",
    label: "Submission ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "form_id",
    label: "Form ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "organization_id",
    label: "Organization ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "status",
    label: "Status",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "submitted_at",
    label: "Submitted At",
    type: "datetime",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
  {
    column: "created_at",
    label: "Created At",
    type: "datetime",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
];

const eventFields: DatasetField[] = [
  {
    column: "id",
    label: "Event ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "name",
    label: "Event Name",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "organization_id",
    label: "Organization ID",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
  },
  {
    column: "type",
    label: "Event Type",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "status",
    label: "Status",
    type: "string",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "neq", "in"],
  },
  {
    column: "start_date",
    label: "Start Date",
    type: "date",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
  {
    column: "end_date",
    label: "End Date",
    type: "date",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
  {
    column: "registration_count",
    label: "Registration Count",
    type: "number",
    allowDimension: false,
    allowMeasure: true,
    allowedAggregations: ["sum", "avg", "min", "max", "count"],
  },
  {
    column: "created_at",
    label: "Created At",
    type: "datetime",
    allowDimension: true,
    allowMeasure: false,
    allowedOperators: ["eq", "gt", "gte", "lt", "lte", "between"],
  },
];

// =============================================================================
// Dataset Configurations
// =============================================================================

export const DATASETS: Record<string, DatasetConfig> = {
  organizations: {
    id: "organizations",
    name: "Organizations",
    description: "Organization hierarchy and metadata",
    source: "bi_v_organizations", // Uses curated view, not raw table
    fields: organizationFields,
    requiresOrgScope: true,
    orgScopeColumn: "id",
    maxRows: 10000,
  },

  members: {
    id: "members",
    name: "Members",
    description: "Membership records and status",
    source: "bi_v_members", // Uses curated view, not raw table
    fields: memberFields,
    requiresOrgScope: true,
    orgScopeColumn: "organization_id",
    maxRows: 10000,
  },

  form_submissions: {
    id: "form_submissions",
    name: "Form Submissions",
    description: "Form submission records",
    source: "bi_v_form_submissions", // Uses curated view, not raw table
    fields: formSubmissionFields,
    requiresOrgScope: true,
    orgScopeColumn: "organization_id",
    maxRows: 10000,
  },

  events: {
    id: "events",
    name: "Events",
    description: "Events and registrations",
    source: "bi_v_events", // Uses curated view, not raw table
    fields: eventFields,
    requiresOrgScope: true,
    orgScopeColumn: "organization_id",
    maxRows: 10000,
  },
};

/**
 * Get dataset configuration by ID
 */
export function getDataset(datasetId: string): DatasetConfig | undefined {
  return DATASETS[datasetId];
}

/**
 * Get all available dataset IDs
 */
export function getDatasetIds(): string[] {
  return Object.keys(DATASETS);
}

/**
 * Check if a dataset exists
 */
export function hasDataset(datasetId: string): boolean {
  return datasetId in DATASETS;
}
