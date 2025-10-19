const DEFAULT_RELATIVE_FALLBACK = "unknown";
const RELATIVE_TIME_DIVISIONS = [
  { amount: 60, unit: "minute" },
  { amount: 60, unit: "hour" },
  { amount: 24, unit: "day" },
  { amount: 7, unit: "week" },
  { amount: 4.348, unit: "month" },
  { amount: 12, unit: "year" },
] as const;

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function formatSystemRelativeTime(
  isoString: string | null | undefined,
  {
    fallback = DEFAULT_RELATIVE_FALLBACK,
    t,
  }: {
    fallback?: string;
    t?: (key: string, params?: Record<string, unknown>) => string;
  } = {},
) {
  if (!isoString) return fallback;

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime()))
    return t ? t("formatters.relative_time.invalid_date") : "invalid date";

  const deltaMs = Date.now() - date.getTime();
  const deltaSeconds = Math.round(deltaMs / 1000);
  if (Math.abs(deltaSeconds) < 60)
    return t ? t("formatters.relative_time.just_now") : "just now";

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  let duration = deltaSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) break;
    duration /= division.amount;
    unit = division.unit as Intl.RelativeTimeFormatUnit;
  }

  return formatter.format(Math.round(duration * -1), unit);
}

const CRAWL_VARIANT_MAP: Record<string, BadgeVariant> = {
  success: "secondary",
  partial: "outline",
  queued: "outline",
  processing: "outline",
  inactive: "outline",
  error: "destructive",
};

export function getSystemCrawlBadgeVariant(
  status: string | null | undefined,
): BadgeVariant {
  if (!status) return "outline";
  return CRAWL_VARIANT_MAP[status.toLowerCase()] ?? "outline";
}

export function formatSystemCrawlStatus(
  status: string | null | undefined,
  t?: (key: string, params?: Record<string, unknown>) => string,
) {
  if (!status) return t ? t("formatters.crawl_status.unknown") : "Unknown";

  const normalized = status.toLowerCase();
  switch (normalized) {
    case "success":
      return t ? t("formatters.crawl_status.success") : "Success";
    case "partial":
      return t ? t("formatters.crawl_status.partial") : "Partial";
    case "error":
      return t ? t("formatters.crawl_status.error") : "Error";
    case "queued":
      return t ? t("formatters.crawl_status.queued") : "Queued";
    case "processing":
      return t ? t("formatters.crawl_status.processing") : "Processing";
    case "inactive":
      return t ? t("formatters.crawl_status.inactive") : "Inactive";
    case "unknown":
      return t ? t("formatters.crawl_status.unknown") : "Unknown";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}
