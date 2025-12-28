export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "between";

export type FilterType = "string" | "number" | "date" | "enum" | "uuid" | "boolean";

export type SortDirection = "asc" | "desc";

export type FilterConfig = {
  readonly operators: readonly FilterOperator[];
  readonly type: FilterType;
};

export type DataSourceConfig = {
  readonly allowedColumns: readonly string[];
  readonly allowedFilters: Readonly<Record<string, FilterConfig>>;
  readonly allowedSorts: readonly string[];
};

export const DATA_SOURCE_CONFIG = {
  organizations: {
    allowedColumns: [
      "id",
      "name",
      "slug",
      "type",
      "parentOrgId",
      "status",
      "createdAt",
      "updatedAt",
    ],
    allowedFilters: {
      id: { operators: ["eq", "in"], type: "uuid" },
      name: { operators: ["eq", "in"], type: "string" },
      slug: { operators: ["eq", "in"], type: "string" },
      type: { operators: ["eq", "in"], type: "enum" },
      status: { operators: ["eq", "in"], type: "enum" },
      parentOrgId: { operators: ["eq", "in"], type: "uuid" },
      createdAt: { operators: ["gte", "lte", "between"], type: "date" },
    },
    allowedSorts: ["name", "createdAt", "updatedAt"],
  },
  reporting_submissions: {
    allowedColumns: [
      "id",
      "taskId",
      "organizationId",
      "formSubmissionId",
      "status",
      "submittedAt",
      "submittedBy",
      "reviewedAt",
      "reviewedBy",
      "reviewNotes",
      "createdAt",
      "updatedAt",
    ],
    allowedFilters: {
      id: { operators: ["eq", "in"], type: "uuid" },
      taskId: { operators: ["eq", "in"], type: "uuid" },
      organizationId: { operators: ["eq", "in"], type: "uuid" },
      formSubmissionId: { operators: ["eq", "in"], type: "uuid" },
      status: { operators: ["eq", "in"], type: "enum" },
      submittedAt: { operators: ["gte", "lte", "between"], type: "date" },
      createdAt: { operators: ["gte", "lte", "between"], type: "date" },
    },
    allowedSorts: ["submittedAt", "createdAt", "status"],
  },
  form_submissions: {
    allowedColumns: [
      "id",
      "formId",
      "formVersionId",
      "organizationId",
      "importJobId",
      "submitterId",
      "status",
      "payload",
      "completenessScore",
      "missingFields",
      "validationErrors",
      "submittedAt",
      "reviewedBy",
      "reviewedAt",
      "reviewNotes",
      "createdAt",
      "updatedAt",
    ],
    allowedFilters: {
      id: { operators: ["eq", "in"], type: "uuid" },
      formId: { operators: ["eq", "in"], type: "uuid" },
      formVersionId: { operators: ["eq", "in"], type: "uuid" },
      organizationId: { operators: ["eq", "in"], type: "uuid" },
      submitterId: { operators: ["eq", "in"], type: "string" },
      status: { operators: ["eq", "in"], type: "enum" },
      submittedAt: { operators: ["gte", "lte", "between"], type: "date" },
      createdAt: { operators: ["gte", "lte", "between"], type: "date" },
    },
    allowedSorts: ["submittedAt", "createdAt", "status"],
  },
} as const;

export type ReportDataSource = keyof typeof DATA_SOURCE_CONFIG;
