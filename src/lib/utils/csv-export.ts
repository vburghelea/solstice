/**
 * Utility for exporting data to CSV format
 */

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: { [K in keyof T]?: string },
) {
  if (data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Get all unique keys from the data
  const keys = Object.keys(data[0]) as (keyof T)[];

  // Create header row
  const headerRow = keys
    .map((key) => {
      const headerLabel = headers?.[key] || String(key);
      // Escape quotes and wrap in quotes if needed
      return `"${String(headerLabel).replace(/"/g, '""')}"`;
    })
    .join(",");

  // Create data rows
  const dataRows = data.map((row) => {
    return keys
      .map((key) => {
        const value = row[key];

        // Handle different value types
        if (value === null || value === undefined) {
          return "";
        }

        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }

        if (typeof value === "object") {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        // Convert to string and escape quotes
        const stringValue = String(value);

        // Wrap in quotes if contains comma, newline, or quotes
        if (
          stringValue.includes(",") ||
          stringValue.includes("\n") ||
          stringValue.includes('"')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(",");
  });

  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
