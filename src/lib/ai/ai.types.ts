import type { JsonRecord } from "~/shared/lib/json";

export type AiProvider = "bedrock";

export type AiUsageOperation = "text" | "structured" | "embedding";
export type AiUsageStatus = "success" | "error";

export type AiTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type AiQuotaConfig = {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerDay: number;
  dailyWindowMs: number;
};

export type AiModelDefaults = {
  provider: AiProvider;
  model: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  modelOptions?: JsonRecord;
};

export type AiRequestContext = {
  templateId?: string | null;
  promptVersionId?: string | null;
  organizationId?: string | null;
  userId?: string | null;
  requestId?: string | null;
  metadata?: JsonRecord;
};
