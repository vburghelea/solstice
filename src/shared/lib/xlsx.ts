/**
 * XLSX Generation Helper
 *
 * Generates proper Excel .xlsx files using the xlsx library.
 * This replaces the previous CSV-only "excel" export path.
 */

import type { JsonValue } from "./json";

export type XlsxRow = Record<string, JsonValue>;

export type XlsxOptions = {
  sheetName?: string;
  /** If true, auto-size columns based on content */
  autoWidth?: boolean;
  /** Maximum column width in characters */
  maxColWidth?: number;
};

/**
 * Generate an XLSX file from an array of data rows.
 * Returns a Buffer containing the .xlsx file.
 */
export const generateXlsx = async (
  rows: XlsxRow[],
  options?: XlsxOptions,
): Promise<Buffer> => {
  const XLSX = await import("xlsx");

  const sheetName = options?.sheetName ?? "Export";
  const autoWidth = options?.autoWidth ?? true;
  const maxColWidth = options?.maxColWidth ?? 50;

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns if enabled
  if (autoWidth && rows.length > 0) {
    const columns = Object.keys(rows[0] ?? {});
    const colWidths: Array<{ wch: number }> = columns.map((col) => {
      // Start with header width
      let maxWidth = col.length;

      // Check data values
      for (const row of rows) {
        const value = row[col];
        if (value !== null && value !== undefined) {
          const strValue = String(value);
          maxWidth = Math.max(maxWidth, strValue.length);
        }
      }

      // Apply max width limit
      return { wch: Math.min(maxWidth + 2, maxColWidth) };
    });

    worksheet["!cols"] = colWidths;
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate buffer
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return buffer;
};

/**
 * Generate an XLSX file and return as base64 string.
 * Useful for embedding in JSON responses.
 */
export const generateXlsxBase64 = async (
  rows: XlsxRow[],
  options?: XlsxOptions,
): Promise<string> => {
  const buffer = await generateXlsx(rows, options);
  return buffer.toString("base64");
};

/**
 * Content type for XLSX files
 */
export const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * File extension for XLSX files
 */
export const XLSX_EXTENSION = ".xlsx";
