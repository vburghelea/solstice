import { createServerOnlyFn } from "@tanstack/react-start";

export const processImportJob = createServerOnlyFn(async (jobId: string) => {
  console.warn("[Imports] Worker not yet implemented for job:", jobId);
  return { status: "skipped" };
});
