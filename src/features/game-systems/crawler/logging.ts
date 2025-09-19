export enum CrawlSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
}

export interface CrawlEventLog {
  systemSlug: string;
  source: "startplaying" | "bgg" | "wikipedia";
  status: "success" | "partial" | "error";
  startedAt: Date;
  finishedAt: Date;
  httpStatus?: number;
  errorMessage?: string;
  severity: CrawlSeverity;
  details?: Record<string, unknown>;
}
