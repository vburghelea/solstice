import type { QueryContext } from "../bi.types";
import type { QueryIntent } from "./nl-query.schemas";
import type { JsonRecord } from "~/shared/lib/json";

export type NlQueryStage = "interpret" | "execute" | "error";

export type LogNlQueryParams = {
  context: QueryContext;
  stage: NlQueryStage;
  question?: string | null;
  intent?: QueryIntent | null;
  confidence?: number | null;
  approved?: boolean;
  provider?: string | null;
  model?: string | null;
  latencyMs?: number | null;
  executionTimeMs?: number | null;
  rowsReturned?: number | null;
  errorMessage?: string | null;
};

type NlQueryLogEntry = {
  id: string;
  userId: string;
  organizationId: string | null;
  datasetId: string | null;
  question: string | null;
  intent: JsonRecord | null;
  confidence: number | null;
  approved: boolean;
  stage: NlQueryStage;
  provider: string | null;
  model: string | null;
  latencyMs: number | null;
  executionTimeMs: number | null;
  rowsReturned: number | null;
  queryHash: string;
  previousLogId: string | null;
  createdAt: Date;
  errorMessage: string | null;
};

const computeHash = async (payload: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const computeChecksum = async (
  entry: NlQueryLogEntry,
  previousChecksum: string | null,
  secret: string,
): Promise<string> => {
  const payload = JSON.stringify({
    id: entry.id,
    userId: entry.userId,
    organizationId: entry.organizationId,
    datasetId: entry.datasetId,
    stage: entry.stage,
    queryHash: entry.queryHash,
    question: entry.question,
    intent: entry.intent,
    confidence: entry.confidence,
    approved: entry.approved,
    provider: entry.provider,
    model: entry.model,
    latencyMs: entry.latencyMs,
    executionTimeMs: entry.executionTimeMs,
    rowsReturned: entry.rowsReturned,
    previousLogId: entry.previousLogId,
    createdAt: entry.createdAt.toISOString(),
    errorMessage: entry.errorMessage,
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
};

export const logNlQueryEvent = async (params: LogNlQueryParams): Promise<string> => {
  const { getDb } = await import("~/db/server-helpers");
  const { biNlQueryLog } = await import("~/db/schema");
  const { desc, eq, isNull } = await import("drizzle-orm");
  const { getAuthSecret } = await import("~/lib/env.server");

  const db = await getDb();
  const organizationId = params.context.organizationId ?? null;

  const [previous] = await db
    .select({ id: biNlQueryLog.id, checksum: biNlQueryLog.checksum })
    .from(biNlQueryLog)
    .where(
      organizationId
        ? eq(biNlQueryLog.organizationId, organizationId)
        : isNull(biNlQueryLog.organizationId),
    )
    .orderBy(desc(biNlQueryLog.createdAt), desc(biNlQueryLog.id))
    .limit(1);

  const id = crypto.randomUUID();
  const intentPayload = params.intent ? JSON.stringify(params.intent) : null;
  const queryHash = await computeHash(
    intentPayload ?? params.question ?? `${params.stage}:${organizationId ?? "none"}`,
  );
  const approved = params.approved ?? false;

  const entry: NlQueryLogEntry = {
    id,
    userId: params.context.userId,
    organizationId,
    datasetId: params.intent?.datasetId ?? null,
    question: params.question ?? null,
    intent: (params.intent as JsonRecord | undefined) ?? null,
    confidence: params.confidence ?? null,
    approved,
    stage: params.stage,
    provider: params.provider ?? null,
    model: params.model ?? null,
    latencyMs: params.latencyMs ?? null,
    executionTimeMs: params.executionTimeMs ?? null,
    rowsReturned: params.rowsReturned ?? null,
    queryHash,
    previousLogId: previous?.id ?? null,
    createdAt: new Date(),
    errorMessage: params.errorMessage ?? null,
  };

  const checksum = await computeChecksum(
    entry,
    previous?.checksum ?? null,
    getAuthSecret(),
  );

  await db.insert(biNlQueryLog).values({
    id: entry.id,
    userId: entry.userId,
    organizationId: entry.organizationId,
    datasetId: entry.datasetId,
    question: entry.question,
    intent: entry.intent,
    confidence: entry.confidence,
    approved: entry.approved,
    stage: entry.stage,
    provider: entry.provider,
    model: entry.model,
    latencyMs: entry.latencyMs,
    executionTimeMs: entry.executionTimeMs,
    rowsReturned: entry.rowsReturned,
    queryHash: entry.queryHash,
    previousLogId: entry.previousLogId,
    checksum,
    createdAt: entry.createdAt,
    errorMessage: entry.errorMessage,
  });

  return id;
};
