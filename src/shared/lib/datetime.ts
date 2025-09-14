export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

// 24-hour time HH:mm with leading zeros
export function formatTimeHHmm(value: string | Date): string {
  const d = toDate(value);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Localized date + 24-hour time HH:mm
export function formatDateAndTime(value: string | Date): string {
  const d = toDate(value);
  const date = d.toLocaleDateString();
  const time = formatTimeHHmm(d);
  return `${date} ${time}`;
}
