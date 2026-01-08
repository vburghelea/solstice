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

const buildRows = (
  definition: FormDefinition,
  options: Required<
    Pick<
      TemplateOptions,
      "includeDescriptions" | "includeExamples" | "includeMetadataMarkers"
    >
  >,
) => {
  const headers = definition.fields.map((field) => field.label);
  const rows: string[][] = [headers];

  if (options.includeDescriptions) {
    const descriptionRow = definition.fields.map(buildDescriptionText);
    if (options.includeMetadataMarkers && descriptionRow.length > 0) {
      const marker = `${IMPORT_TEMPLATE_SKIP_MARKERS[0]} | ${IMPORT_TEMPLATE_MARKER_TOKEN}`;
      const detail = descriptionRow[0] ? ` | ${descriptionRow[0]}` : "";
      descriptionRow[0] = `${marker}${detail}`;
    }
    rows.push(descriptionRow);
  }

  if (options.includeExamples) {
    const exampleRow = definition.fields.map(buildExampleValue);
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
  definition: FormDefinition,
  dataStartRow: number,
) => {
  const validations: Array<Record<string, unknown>> = [];
  const maxRow = 1048576;

  definition.fields.forEach((field, index) => {
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
}) => {
  const { utils, write } = await import("xlsx");
  const normalizedOptions = { ...DEFAULT_OPTIONS, ...params.options };
  const rows = buildRows(params.definition, normalizedOptions);

  const sheet = utils.aoa_to_sheet(rows);
  if (params.format === "xlsx" && normalizedOptions.includeDataValidation) {
    const dataStartRow =
      2 +
      (normalizedOptions.includeDescriptions ? 1 : 0) +
      (normalizedOptions.includeExamples ? 1 : 0);
    addDataValidation(sheet as Record<string, unknown>, params.definition, dataStartRow);
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
