/**
 * BI Audit Logger
 *
 * Logs all BI queries and exports to the bi_query_log table.
 * Maintains its own tamper-evident chain with periodic anchoring to main audit log.
 *
 * @see docs/sin-rfp/decisions/bi/SPEC-bi-platform.md (Audit Model)
 */

import type { PivotQuery } from "../bi.schemas";
import type { BiQueryLogEntry, QueryContext } from "../bi.types";

/**
 * Query type for audit logging
 */
export type QueryType = "pivot" | "sql" | "export";

/**
 * Parameters for logging a BI query
 */
export interface LogQueryParams {
  context: QueryContext;
  queryType: QueryType;
  datasetId?: string;
  pivotQuery?: PivotQuery;
  sqlQuery?: string;
  rowsReturned: number;
  executionTimeMs: number;
}

/**
 * Compute SHA-256 hash of query for deduplication and integrity
 */
export async function computeQueryHash(query: PivotQuery | string): Promise<string> {
  const queryString = typeof query === "string" ? query : JSON.stringify(query);
  const encoder = new TextEncoder();
  const data = encoder.encode(queryString);

  // Use Web Crypto API (available in Node 18+ and browsers)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Compute HMAC-SHA256 checksum for tamper-evident chain
 *
 * @param logEntry - Log entry to compute checksum for
 * @param previousChecksum - Checksum of previous entry (null for first entry)
 * @param secret - HMAC secret key
 */
export async function computeChecksum(
  logEntry: Omit<BiQueryLogEntry, "checksum">,
  previousChecksum: string | null,
  secret: string,
): Promise<string> {
  const payload = JSON.stringify({
    id: logEntry.id,
    userId: logEntry.userId,
    organizationId: logEntry.organizationId,
    queryType: logEntry.queryType,
    queryHash: logEntry.queryHash,
    rowsReturned: logEntry.rowsReturned,
    executionTimeMs: logEntry.executionTimeMs,
    previousLogId: logEntry.previousLogId,
    createdAt: logEntry.createdAt.toISOString(),
    previousChecksum: previousChecksum ?? "",
  });

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Log a BI query to the audit log
 *
 * TODO: Implement database interaction in Slice 2
 *
 * @param params - Query logging parameters
 * @returns Log entry ID
 */
export async function logQuery(params: LogQueryParams): Promise<string> {
  const {
    context,
    queryType,
    datasetId,
    pivotQuery,
    sqlQuery,
    rowsReturned,
    executionTimeMs,
  } = params;

  // Compute query hash
  const queryHash = await computeQueryHash(
    sqlQuery ?? pivotQuery ?? `${queryType}:${datasetId ?? "unknown"}`,
  );

  // TODO: Implement in Slice 2
  // 1. Get previous log entry for this org (for chain linking)
  // 2. Create log entry with tamper-evident checksum
  // 3. Insert into bi_query_log table

  const logId = crypto.randomUUID();

  console.log("[BI Audit]", {
    logId,
    userId: context.userId,
    organizationId: context.organizationId,
    queryType,
    queryHash: queryHash.substring(0, 16) + "...",
    datasetId,
    rowsReturned,
    executionTimeMs,
    timestamp: context.timestamp.toISOString(),
  });

  return logId;
}

/**
 * Log an export operation
 *
 * Exports require additional logging for compliance.
 *
 * @param params - Export logging parameters
 * @returns Log entry ID
 */
export async function logExport(
  params: LogQueryParams & {
    format: "csv" | "xlsx" | "json";
    includesPii: boolean;
    stepUpAuthUsed: boolean;
  },
): Promise<string> {
  const logId = await logQuery({
    ...params,
    queryType: "export",
  });

  // TODO: Add export-specific metadata
  console.log("[BI Audit - Export]", {
    logId,
    format: params.format,
    includesPii: params.includesPii,
    stepUpAuthUsed: params.stepUpAuthUsed,
  });

  return logId;
}

/**
 * Verify integrity of audit chain
 *
 * TODO: Implement in Slice 2
 *
 * @param organizationId - Organization to verify
 * @param startDate - Start of verification range
 * @param endDate - End of verification range
 * @returns Verification result
 */
export async function verifyAuditChain(
  organizationId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  valid: boolean;
  entriesChecked: number;
  firstBrokenEntry: string | null;
}> {
  // TODO: Implement chain verification in Slice 2
  void organizationId;
  void startDate;
  void endDate;
  return {
    valid: true,
    entriesChecked: 0,
    firstBrokenEntry: null,
  };
}
