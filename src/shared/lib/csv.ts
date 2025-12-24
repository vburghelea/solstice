const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const stringValue =
    typeof value === "string" ? value : JSON.stringify(value, (_key, val) => val);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};

export const toCsv = (rows: Array<Record<string, unknown>>) => {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((header) => escapeCsvValue(row[header])).join(","),
  );

  return [headers.join(","), ...lines].join("\n");
};
