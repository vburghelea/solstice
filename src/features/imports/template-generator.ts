import type { FormDefinition } from "~/features/forms/forms.schemas";
import {
  IMPORT_TEMPLATE_MARKER_TOKEN,
  IMPORT_TEMPLATE_SKIP_MARKERS,
} from "~/features/imports/imports.utils";

export interface TemplateOptions {
  format?: "xlsx" | "csv" | undefined;
  includeDescriptions?: boolean | undefined;
  includeExamples?: boolean | undefined;
  includeDataValidation?: boolean | undefined;
  includeMetadataMarkers?: boolean | undefined;
  organizationId?: string | undefined;
}

const DEFAULT_OPTIONS: Required<
  Pick<
    TemplateOptions,
    | "includeDescriptions"
    | "includeExamples"
    | "includeDataValidation"
    | "includeMetadataMarkers"
  >
> = {
  includeDescriptions: true,
  includeExamples: true,
  includeDataValidation: true,
  includeMetadataMarkers: true,
};

const toSafeFileName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_.]/g, "")
    .toLowerCase();

export const getTemplateFileName = (formName: string, format: "xlsx" | "csv") => {
  const safeName = toSafeFileName(formName || "import-template");
  return `${safeName}.${format}`;
};

const buildDescriptionText = (field: FormDefinition["fields"][number]) => {
  const parts: string[] = [];
  if (field.description) {
    parts.push(field.description);
  }
  if (field.required) {
    parts.push("Required");
  }
  if (field.type === "date") {
    parts.push("Format: YYYY-MM-DD");
  }
  if (field.type === "select" || field.type === "multiselect") {
    const options = field.options ?? [];
    if (options.length > 0) {
      parts.push(
        `Options: ${options
          .map((option) => `${option.label} (${option.value})`)
          .join(", ")}`,
      );
    }
  }
  return parts.join(" | ");
};

const buildExampleValue = (field: FormDefinition["fields"][number]) => {
  if (field.type === "number") return "123";
  if (field.type === "email") return "user@example.com";
  if (field.type === "phone") return "555-555-5555";
  if (field.type === "date") return "YYYY-MM-DD";
  if (field.type === "checkbox") return "true";
  if (field.type === "multiselect") {
    const first = field.options?.[0]?.value;
    const second = field.options?.[1]?.value;
    return [first, second].filter(Boolean).join(", ");
  }
  if (field.type === "select") return field.options?.[0]?.value ?? "";
  if (field.type === "file") {
    return '{"fileName":"example.pdf","mimeType":"application/pdf","sizeBytes":1234,"storageKey":"..."}';
  }
  return "Example";
};

const buildColumns = (definition: FormDefinition, columns?: Record<string, unknown>) => {
  if (!columns || typeof columns !== "object") {
    return definition.fields.map((field) => ({ field, header: field.label }));
  }

  if (Array.isArray(columns)) {
    const fieldKeys = columns.filter(
      (entry): entry is string => typeof entry === "string",
    );
    return fieldKeys
      .map((key) => definition.fields.find((field) => field.key === key))
      .filter((field): field is FormDefinition["fields"][number] => field !== undefined)
      .map((field) => ({ field, header: field.label }));
  }

  return Object.entries(columns)
    .map(([header, fieldKey]) => {
      if (typeof fieldKey !== "string") return null;
      const field = definition.fields.find((item) => item.key === fieldKey);
      if (!field) return null;
      return { field, header };
    })
    .filter(Boolean) as Array<{
    field: FormDefinition["fields"][number];
    header: string;
  }>;
};

const buildRows = (
  columnDefs: Array<{ field: FormDefinition["fields"][number]; header: string }>,
  options: Required<
    Pick<
      TemplateOptions,
      "includeDescriptions" | "includeExamples" | "includeMetadataMarkers"
    >
  >,
  defaults?: Record<string, unknown>,
) => {
  const headers = columnDefs.map((col) => col.header);
  const rows: string[][] = [headers];

  if (options.includeDescriptions) {
    const descriptionRow = columnDefs.map((col) => buildDescriptionText(col.field));
    if (options.includeMetadataMarkers && descriptionRow.length > 0) {
      const marker = `${IMPORT_TEMPLATE_SKIP_MARKERS[0]} | ${IMPORT_TEMPLATE_MARKER_TOKEN}`;
      const detail = descriptionRow[0] ? ` | ${descriptionRow[0]}` : "";
      descriptionRow[0] = `${marker}${detail}`;
    }
    rows.push(descriptionRow);
  }

  if (options.includeExamples) {
    const exampleRow = columnDefs.map((col) => {
      if (defaults && typeof defaults === "object") {
        const defaultByKey = defaults[col.field.key];
        if (defaultByKey !== undefined && defaultByKey !== null) {
          return String(defaultByKey);
        }
        const defaultByHeader = defaults[col.header];
        if (defaultByHeader !== undefined && defaultByHeader !== null) {
          return String(defaultByHeader);
        }
      }
      return buildExampleValue(col.field);
    });
    if (options.includeMetadataMarkers && exampleRow.length > 0) {
      const marker = IMPORT_TEMPLATE_SKIP_MARKERS[2];
      const detail = exampleRow[0] ? ` | ${exampleRow[0]}` : "";
      exampleRow[0] = `${marker}${detail}`;
    }
    rows.push(exampleRow);
  }

  return rows;
};

const columnToLetter = (columnIndex: number) => {
  let result = "";
  let index = columnIndex + 1;
  while (index > 0) {
    const modulo = (index - 1) % 26;
    result = String.fromCharCode(65 + modulo) + result;
    index = Math.floor((index - 1) / 26);
  }
  return result;
};

const addDataValidation = (
  sheet: Record<string, unknown>,
  columnDefs: Array<{ field: FormDefinition["fields"][number]; header: string }>,
  dataStartRow: number,
) => {
  const validations: Array<Record<string, unknown>> = [];
  const maxRow = 1048576;

  columnDefs.forEach((col, index) => {
    const field = col.field;
    if (field.type !== "select" && field.type !== "multiselect") return;
    const options = field.options ?? [];
    if (options.length === 0) return;
    const values = options.map((option) => option.value.replace(/"/g, '""'));
    const formula = `"${values.join(",")}"`;
    if (formula.length > 250) return;
    const columnLetter = columnToLetter(index);
    validations.push({
      type: "list",
      allowBlank: 1,
      sqref: `${columnLetter}${dataStartRow}:${columnLetter}${maxRow}`,
      formulas: [formula],
    });
  });

  if (validations.length > 0) {
    sheet["!dataValidation"] = validations;
  }
};

export const generateTemplateBuffer = async (params: {
  definition: FormDefinition;
  format: "xlsx" | "csv";
  options?: TemplateOptions | undefined;
  columns?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
}) => {
  const { utils, write } = await import("xlsx");
  const normalizedOptions = { ...DEFAULT_OPTIONS, ...params.options };
  const columnDefs = buildColumns(params.definition, params.columns);
  const rows = buildRows(columnDefs, normalizedOptions, params.defaults);

  const sheet = utils.aoa_to_sheet(rows);
  if (params.format === "xlsx" && normalizedOptions.includeDataValidation) {
    const dataStartRow =
      2 +
      (normalizedOptions.includeDescriptions ? 1 : 0) +
      (normalizedOptions.includeExamples ? 1 : 0);
    addDataValidation(sheet as Record<string, unknown>, columnDefs, dataStartRow);
  }

  if (params.format === "csv") {
    const csv = utils.sheet_to_csv(sheet);
    return Buffer.from(csv, "utf8");
  }

  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, "Template");
  const arrayBuffer = write(workbook, { type: "array", bookType: "xlsx" });
  return Buffer.from(arrayBuffer);
};
