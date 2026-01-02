/**
 * Dataset Configuration
 *
 * Defines available datasets for BI queries. Each dataset maps to a database
 * table/view and specifies which fields are queryable, their types, and access rules.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md
 */

import type { DatasetConfig, DatasetField } from "../bi.types";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const timeGrainsForField = (field: DatasetField) => {
  if (field.dataType !== "date" && field.dataType !== "datetime") return [];
  if (field.dataType === "date") return ["week", "month", "quarter"] as const;
  return ["day", "week", "month", "quarter"] as const;
};

const buildTimeGrainFields = (field: DatasetField): DatasetField[] => {
  if (!field.allowGroupBy) return [];
  return timeGrainsForField(field).map((grain) => ({
    id: `${field.id}${capitalize(grain)}`,
    name: `${field.name} (${capitalize(grain)})`,
    description: `${field.description ?? field.name} grouped by ${grain}.`,
    sourceColumn: field.sourceColumn,
    dataType: "date",
    formatType: "date",
    allowGroupBy: true,
    allowFilter: false,
    allowSort: true,
    allowAggregate: false,
    derivedFrom: field.id,
    timeGrain: grain,
    ...(field.piiClassification ? { piiClassification: field.piiClassification } : {}),
    ...(field.requiredPermission ? { requiredPermission: field.requiredPermission } : {}),
  }));
};

const withTimeGrainFields = (fields: DatasetField[]) => [
  ...fields,
  ...fields.flatMap((field) => buildTimeGrainFields(field)),
];

const organizationBaseFields: DatasetField[] = [
  {
    id: "id",
    name: "ID",
    description: "Unique organization identifier.",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "name",
    name: "Name",
    description: "Organization display name.",
    sourceColumn: "name",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "slug",
    name: "Slug",
    description: "URL-friendly organization short name.",
    sourceColumn: "slug",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "type",
    name: "Type",
    description: "Organization type classification.",
    sourceColumn: "type",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "governing_body", label: "Governing body" },
      { value: "pso", label: "PSO" },
      { value: "league", label: "League" },
      { value: "club", label: "Club" },
      { value: "affiliate", label: "Affiliate" },
    ],
  },
  {
    id: "parentOrgId",
    name: "Parent Organization",
    description: "Parent organization identifier (if applicable).",
    sourceColumn: "parent_org_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    description: "Organization lifecycle status.",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "pending", label: "Pending" },
      { value: "active", label: "Active" },
      { value: "suspended", label: "Suspended" },
      { value: "archived", label: "Archived" },
    ],
  },
  {
    id: "createdAt",
    name: "Created",
    description: "Timestamp when the organization was created.",
    sourceColumn: "created_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    description: "Timestamp when the organization was last updated.",
    sourceColumn: "updated_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
];

const organizationFields = withTimeGrainFields(organizationBaseFields);

const reportingSubmissionBaseFields: DatasetField[] = [
  {
    id: "id",
    name: "Submission ID",
    description: "Reporting submission identifier.",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "taskId",
    name: "Task ID",
    description: "Reporting task identifier.",
    sourceColumn: "task_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "organizationId",
    name: "Organization ID",
    description: "Submitting organization identifier.",
    sourceColumn: "organization_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formSubmissionId",
    name: "Form Submission ID",
    description: "Linked form submission identifier.",
    sourceColumn: "form_submission_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    description: "Reporting submission status.",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "not_started", label: "Not started" },
      { value: "in_progress", label: "In progress" },
      { value: "submitted", label: "Submitted" },
      { value: "under_review", label: "Under review" },
      { value: "changes_requested", label: "Changes requested" },
      { value: "approved", label: "Approved" },
      { value: "overdue", label: "Overdue" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    id: "submittedAt",
    name: "Submitted",
    description: "Timestamp when the submission was sent.",
    sourceColumn: "submitted_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "submittedBy",
    name: "Submitted By",
    description: "User identifier for the submitter.",
    sourceColumn: "submitted_by",
    dataType: "string",
    piiClassification: "personal",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedAt",
    name: "Reviewed",
    description: "Timestamp when the submission was reviewed.",
    sourceColumn: "reviewed_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedBy",
    name: "Reviewed By",
    description: "Reviewer identifier for the submission.",
    sourceColumn: "reviewed_by",
    dataType: "string",
    piiClassification: "personal",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewNotes",
    name: "Review Notes",
    description: "Reviewer notes and feedback.",
    sourceColumn: "review_notes",
    dataType: "string",
    allowGroupBy: false,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    description: "Timestamp when the submission was created.",
    sourceColumn: "created_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    description: "Timestamp when the submission was last updated.",
    sourceColumn: "updated_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

const reportingSubmissionFields = withTimeGrainFields(reportingSubmissionBaseFields);

const formSubmissionBaseFields: DatasetField[] = [
  {
    id: "id",
    name: "Submission ID",
    description: "Form submission identifier.",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formId",
    name: "Form ID",
    description: "Form identifier associated with the submission.",
    sourceColumn: "form_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formVersionId",
    name: "Form Version ID",
    description: "Form version used at submission time.",
    sourceColumn: "form_version_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "organizationId",
    name: "Organization ID",
    description: "Submitting organization identifier.",
    sourceColumn: "organization_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "importJobId",
    name: "Import Job ID",
    description: "Import job identifier for bulk submissions.",
    sourceColumn: "import_job_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "submitterId",
    name: "Submitter ID",
    description: "User identifier for the submitter.",
    sourceColumn: "submitter_id",
    dataType: "string",
    piiClassification: "personal",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    description: "Form submission status.",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "draft", label: "Draft" },
      { value: "submitted", label: "Submitted" },
      { value: "under_review", label: "Under review" },
      { value: "changes_requested", label: "Changes requested" },
      { value: "approved", label: "Approved" },
      { value: "rejected", label: "Rejected" },
    ],
  },
  {
    id: "payload",
    name: "Payload",
    description: "Submission payload (masked by default).",
    sourceColumn: "payload",
    dataType: "json",
    piiClassification: "sensitive",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "completenessScore",
    name: "Completeness",
    description: "Percent of required fields completed.",
    sourceColumn: "completeness_score",
    dataType: "number",
    formatType: "percent",
    formatOptions: { decimals: 1 },
    allowGroupBy: true,
    allowFilter: true,
    allowAggregate: true,
    defaultAggregation: "avg",
  },
  {
    id: "missingFields",
    name: "Missing Fields",
    description: "List of required fields missing from the submission.",
    sourceColumn: "missing_fields",
    dataType: "json",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "validationErrors",
    name: "Validation Errors",
    description: "Validation errors captured during submission.",
    sourceColumn: "validation_errors",
    dataType: "json",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "submittedAt",
    name: "Submitted",
    description: "Timestamp when the submission was sent.",
    sourceColumn: "submitted_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedBy",
    name: "Reviewed By",
    description: "Reviewer identifier for the submission.",
    sourceColumn: "reviewed_by",
    dataType: "string",
    piiClassification: "personal",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedAt",
    name: "Reviewed",
    description: "Timestamp when the submission was reviewed.",
    sourceColumn: "reviewed_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewNotes",
    name: "Review Notes",
    description: "Reviewer notes and feedback.",
    sourceColumn: "review_notes",
    dataType: "string",
    allowGroupBy: false,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    description: "Timestamp when the submission was created.",
    sourceColumn: "created_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    description: "Timestamp when the submission was last updated.",
    sourceColumn: "updated_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

const formSubmissionFields = withTimeGrainFields(formSubmissionBaseFields);

const eventBaseFields: DatasetField[] = [
  {
    id: "id",
    name: "Event ID",
    description: "Event identifier.",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "name",
    name: "Event Name",
    description: "Event display name.",
    sourceColumn: "name",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "type",
    name: "Type",
    description: "Event type classification.",
    sourceColumn: "type",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "tournament", label: "Tournament" },
      { value: "league", label: "League" },
      { value: "camp", label: "Camp" },
      { value: "clinic", label: "Clinic" },
      { value: "social", label: "Social" },
      { value: "other", label: "Other" },
    ],
  },
  {
    id: "status",
    name: "Status",
    description: "Event lifecycle status.",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
    enumValues: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
      { value: "registration_open", label: "Registration open" },
      { value: "registration_closed", label: "Registration closed" },
      { value: "in_progress", label: "In progress" },
      { value: "completed", label: "Completed" },
      { value: "cancelled", label: "Cancelled" },
    ],
  },
  {
    id: "startDate",
    name: "Start Date",
    description: "Event start date.",
    sourceColumn: "start_date",
    dataType: "date",
    formatType: "date",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "endDate",
    name: "End Date",
    description: "Event end date.",
    sourceColumn: "end_date",
    dataType: "date",
    formatType: "date",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    description: "Timestamp when the event was created.",
    sourceColumn: "created_at",
    dataType: "datetime",
    formatType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

const eventFields = withTimeGrainFields(eventBaseFields);

const measureFields = (fields: DatasetField[]) =>
  fields.map((field) => ({
    ...field,
    allowAggregate:
      field.allowAggregate ?? (field.dataType !== "json" && field.dataType !== "boolean"),
    defaultAggregation:
      field.defaultAggregation ?? (field.dataType === "number" ? "sum" : "count"),
  }));

export const DATASETS: Record<string, DatasetConfig> = {
  organizations: {
    id: "organizations",
    name: "Organizations",
    description: "Organization hierarchy and metadata",
    baseTable: "organizations",
    fields: measureFields(organizationFields),
    freshness: {
      sourceSystem: "Solstice Core",
      updateCadence: "Near real-time",
      lastUpdatedField: "updatedAt",
    },
    requiresOrgScope: true,
    orgScopeColumn: "id",
  },
  reporting_submissions: {
    id: "reporting_submissions",
    name: "Reporting Submissions",
    description: "Submission status and review metadata",
    baseTable: "reporting_submissions",
    fields: measureFields(reportingSubmissionFields),
    freshness: {
      sourceSystem: "SIN Reporting",
      updateCadence: "Near real-time",
      lastUpdatedField: "updatedAt",
    },
    requiresOrgScope: true,
    orgScopeColumn: "organizationId",
  },
  form_submissions: {
    id: "form_submissions",
    name: "Form Submissions",
    description: "Form submission records",
    baseTable: "form_submissions",
    fields: measureFields(formSubmissionFields),
    freshness: {
      sourceSystem: "SIN Forms",
      updateCadence: "Near real-time",
      lastUpdatedField: "updatedAt",
    },
    requiresOrgScope: true,
    orgScopeColumn: "organizationId",
  },
  events: {
    id: "events",
    name: "Events",
    description: "Event schedule metadata",
    baseTable: "events",
    fields: measureFields(eventFields),
    freshness: {
      sourceSystem: "Events",
      updateCadence: "Daily",
      lastUpdatedField: "createdAt",
    },
    requiresOrgScope: false,
  },
};

export function getDataset(datasetId: string): DatasetConfig | undefined {
  return DATASETS[datasetId];
}

export function getDatasetIds(): string[] {
  return Object.keys(DATASETS);
}

export function hasDataset(datasetId: string): boolean {
  return datasetId in DATASETS;
}
