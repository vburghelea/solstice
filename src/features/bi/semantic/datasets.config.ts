/**
 * Dataset Configuration
 *
 * Defines available datasets for BI queries. Each dataset maps to a database
 * table/view and specifies which fields are queryable, their types, and access rules.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md
 */

import type { DatasetConfig, DatasetField } from "../bi.types";

const organizationFields: DatasetField[] = [
  {
    id: "id",
    name: "ID",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "name",
    name: "Name",
    sourceColumn: "name",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "slug",
    name: "Slug",
    sourceColumn: "slug",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "type",
    name: "Type",
    sourceColumn: "type",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "parentOrgId",
    name: "Parent Organization",
    sourceColumn: "parent_org_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    sourceColumn: "created_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    sourceColumn: "updated_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
    allowSort: true,
  },
];

const reportingSubmissionFields: DatasetField[] = [
  {
    id: "id",
    name: "Submission ID",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "taskId",
    name: "Task ID",
    sourceColumn: "task_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "organizationId",
    name: "Organization ID",
    sourceColumn: "organization_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formSubmissionId",
    name: "Form Submission ID",
    sourceColumn: "form_submission_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "submittedAt",
    name: "Submitted",
    sourceColumn: "submitted_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "submittedBy",
    name: "Submitted By",
    sourceColumn: "submitted_by",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedAt",
    name: "Reviewed",
    sourceColumn: "reviewed_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedBy",
    name: "Reviewed By",
    sourceColumn: "reviewed_by",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewNotes",
    name: "Review Notes",
    sourceColumn: "review_notes",
    dataType: "string",
    allowGroupBy: false,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    sourceColumn: "created_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    sourceColumn: "updated_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

const formSubmissionFields: DatasetField[] = [
  {
    id: "id",
    name: "Submission ID",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formId",
    name: "Form ID",
    sourceColumn: "form_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "formVersionId",
    name: "Form Version ID",
    sourceColumn: "form_version_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "organizationId",
    name: "Organization ID",
    sourceColumn: "organization_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "importJobId",
    name: "Import Job ID",
    sourceColumn: "import_job_id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "submitterId",
    name: "Submitter ID",
    sourceColumn: "submitter_id",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "payload",
    name: "Payload",
    sourceColumn: "payload",
    dataType: "json",
    piiClassification: "sensitive",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "completenessScore",
    name: "Completeness",
    sourceColumn: "completeness_score",
    dataType: "number",
    allowGroupBy: true,
    allowFilter: true,
    allowAggregate: true,
    defaultAggregation: "avg",
  },
  {
    id: "missingFields",
    name: "Missing Fields",
    sourceColumn: "missing_fields",
    dataType: "json",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "validationErrors",
    name: "Validation Errors",
    sourceColumn: "validation_errors",
    dataType: "json",
    allowGroupBy: false,
    allowFilter: false,
  },
  {
    id: "submittedAt",
    name: "Submitted",
    sourceColumn: "submitted_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedBy",
    name: "Reviewed By",
    sourceColumn: "reviewed_by",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewedAt",
    name: "Reviewed",
    sourceColumn: "reviewed_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "reviewNotes",
    name: "Review Notes",
    sourceColumn: "review_notes",
    dataType: "string",
    allowGroupBy: false,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    sourceColumn: "created_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "updatedAt",
    name: "Updated",
    sourceColumn: "updated_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

const eventFields: DatasetField[] = [
  {
    id: "id",
    name: "Event ID",
    sourceColumn: "id",
    dataType: "uuid",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "name",
    name: "Event Name",
    sourceColumn: "name",
    dataType: "string",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "type",
    name: "Type",
    sourceColumn: "type",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "status",
    name: "Status",
    sourceColumn: "status",
    dataType: "enum",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "startDate",
    name: "Start Date",
    sourceColumn: "start_date",
    dataType: "date",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "endDate",
    name: "End Date",
    sourceColumn: "end_date",
    dataType: "date",
    allowGroupBy: true,
    allowFilter: true,
  },
  {
    id: "createdAt",
    name: "Created",
    sourceColumn: "created_at",
    dataType: "datetime",
    allowGroupBy: true,
    allowFilter: true,
  },
];

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
    requiresOrgScope: true,
    orgScopeColumn: "id",
  },
  reporting_submissions: {
    id: "reporting_submissions",
    name: "Reporting Submissions",
    description: "Submission status and review metadata",
    baseTable: "reporting_submissions",
    fields: measureFields(reportingSubmissionFields),
    requiresOrgScope: true,
    orgScopeColumn: "organizationId",
  },
  form_submissions: {
    id: "form_submissions",
    name: "Form Submissions",
    description: "Form submission records",
    baseTable: "form_submissions",
    fields: measureFields(formSubmissionFields),
    requiresOrgScope: true,
    orgScopeColumn: "organizationId",
  },
  events: {
    id: "events",
    name: "Events",
    description: "Event schedule metadata",
    baseTable: "events",
    fields: measureFields(eventFields),
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
