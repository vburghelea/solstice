export const extractNumericValue = (value: unknown): number | null => {
  if (typeof value === "number") return value;
  if (Array.isArray(value)) {
    const numeric = value.find((entry) => typeof entry === "number");
    return typeof numeric === "number" ? numeric : null;
  }
  return null;
};
