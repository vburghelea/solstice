import type { Context } from "aws-lambda";

export async function handler(_event: unknown, context?: Context) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const { runDataQualityCheck } =
    await import("~/features/data-quality/data-quality.monitor");

  return runDataQualityCheck();
}
