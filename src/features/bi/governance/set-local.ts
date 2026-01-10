export const escapeSetLocalValue = (value: string): string =>
  `'${value.replace(/'/g, "''")}'`;

export const formatSetLocalValue = (value: string | number | boolean): string => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "0";
  }
  if (typeof value === "boolean") {
    return value ? "'true'" : "'false'";
  }
  return escapeSetLocalValue(value);
};
