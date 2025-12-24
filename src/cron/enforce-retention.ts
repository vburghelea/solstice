import type { Context } from "aws-lambda";

export async function handler(_event: unknown, context?: Context) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const { applyRetentionPolicies } = await import("~/lib/privacy/retention");

  return applyRetentionPolicies();
}
