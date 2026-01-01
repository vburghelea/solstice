/**
 * BI Audit Logger
 *
 * Logs BI queries and exports to the bi_query_log table.
 * Maintains its own tamper-evident chain.
 *
 * @see src/features/bi/docs/SPEC-bi-platform.md
 */

import type { PivotQuery } from "../bi.schemas";
import type { BiQueryLogEntry, QueryContext } from "../bi.types";
import type { JsonRecord } from "~/shared/lib/json";

export type QueryType = "pivot" | "sql" | "export";

export interface LogQueryParams {
  context: QueryContext;
  queryType: QueryType;
  datasetId?: string;
  pivotQuery?: PivotQuery;
  sqlQuery?: string;
  parameters?: JsonRecord | null;
  rowsReturned: number;
  executionTimeMs: number;
}

export async function computeQueryHash(query: PivotQuery | string): Promise<string> {
  const queryString = typeof query === "string" ? query : JSON.stringify(query);
  const encoder = new TextEncoder();
  const data = encoder.encode(queryString);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

export async function logQuery(params: LogQueryParams): Promise<string> {
  const {
    context,
    queryType,
    datasetId,
    pivotQuery,
    sqlQuery,
    parameters,
    rowsReturned,
    executionTimeMs,
  } = params;
  const normalizedDatasetId =
    datasetId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      datasetId,
    )
      ? datasetId
      : null;

  const { getDb } = await import("~/db/server-helpers");
  const { biQueryLog } = await import("~/db/schema");
  const { desc, eq, isNull } = await import("drizzle-orm");
  const { getAuthSecret } = await import("~/lib/env.server");

  const db = await getDb();

  const [previous] = await db
    .select({ id: biQueryLog.id, checksum: biQueryLog.checksum })
    .from(biQueryLog)
    .where(
      context.organizationId
        ? eq(biQueryLog.organizationId, context.organizationId)
        : isNull(biQueryLog.organizationId),
    )
    .orderBy(desc(biQueryLog.createdAt), desc(biQueryLog.id))
    .limit(1);

  const id = crypto.randomUUID();
  const queryHash = await computeQueryHash(
    sqlQuery ?? pivotQuery ?? `${queryType}:${datasetId ?? "unknown"}`,
  );

  const entry: Omit<BiQueryLogEntry, "checksum"> = {
    id,
    userId: context.userId,
    organizationId: context.organizationId ?? null,
    queryType,
    queryHash,
    datasetId: normalizedDatasetId,
    sqlQuery: sqlQuery ?? null,
    parameters: parameters ?? null,
    pivotConfig: pivotQuery
      ? {
          rows: pivotQuery.rows,
          columns: pivotQuery.columns,
          measures: pivotQuery.measures.map((measure) => ({
            field: measure.field ?? null,
            aggregation: measure.aggregation,
            ...(measure.label ? { label: measure.label } : {}),
          })),
        }
      : null,
    rowsReturned,
    executionTimeMs,
    previousLogId: previous?.id ?? null,
    createdAt: new Date(),
  };

  const checksum = await computeChecksum(
    entry,
    previous?.checksum ?? null,
    getAuthSecret(),
  );

  await db.insert(biQueryLog).values({
    ...entry,
    checksum,
  });

  return id;
}

export async function logExport(
  params: LogQueryParams & {
    format: "csv" | "xlsx" | "json";
    includesPii: boolean;
    stepUpAuthUsed: boolean;
  },
): Promise<string> {
  return logQuery({
    ...params,
    queryType: "export",
  });
}

export async function verifyAuditChain(
  organizationId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  valid: boolean;
  entriesChecked: number;
  firstBrokenEntry: string | null;
}> {
  const { getDb } = await import("~/db/server-helpers");
  const { biQueryLog } = await import("~/db/schema");
  const { and, asc, between, eq } = await import("drizzle-orm");
  const { getAuthSecret } = await import("~/lib/env.server");

  const db = await getDb();
  const rows = await db
    .select()
    .from(biQueryLog)
    .where(
      and(
        eq(biQueryLog.organizationId, organizationId),
        between(biQueryLog.createdAt, startDate, endDate),
      ),
    )
    .orderBy(asc(biQueryLog.createdAt), asc(biQueryLog.id));

  let previousChecksum: string | null = null;
  let entriesChecked = 0;

  for (const row of rows) {
    const expected = await computeChecksum(
      {
        id: row.id,
        userId: row.userId,
        organizationId: row.organizationId ?? null,
        queryType: row.queryType as QueryType,
        queryHash: row.queryHash,
        datasetId: row.datasetId ?? null,
        sqlQuery: row.sqlQuery ?? null,
        parameters: row.parameters ?? null,
        pivotConfig: row.pivotConfig ?? null,
        rowsReturned: row.rowsReturned ?? 0,
        executionTimeMs: row.executionTimeMs ?? 0,
        previousLogId: row.previousLogId ?? null,
        createdAt: row.createdAt,
      },
      previousChecksum,
      getAuthSecret(),
    );

    entriesChecked += 1;
    if (row.checksum !== expected) {
      return { valid: false, entriesChecked, firstBrokenEntry: row.id };
    }
    previousChecksum = row.checksum ?? null;
  }

  return { valid: true, entriesChecked, firstBrokenEntry: null };
}
