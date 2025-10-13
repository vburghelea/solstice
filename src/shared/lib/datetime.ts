export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

// 24-hour time HH:mm with leading zeros
const padTwoDigits = (value: number) => value.toString().padStart(2, "0");

export function formatTimeHHmm(value: string | Date): string {
  const d = toDate(value);
  const hours = padTwoDigits(d.getHours());
  const minutes = padTwoDigits(d.getMinutes());
  return `${hours}:${minutes}`;
}

// Calendar date in DD/MM/YYYY + 24-hour time HH:mm
export function formatDateAndTime(value: string | Date): string {
  const d = toDate(value);
  const day = padTwoDigits(d.getDate());
  const month = padTwoDigits(d.getMonth() + 1);
  const year = d.getFullYear();
  const date = `${day}/${month}/${year}`;
  const time = formatTimeHHmm(d);
  return `${date} ${time}`;
}
