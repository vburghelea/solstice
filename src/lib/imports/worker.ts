import { createServerOnlyFn } from "@tanstack/react-start";

export const processImportJob = createServerOnlyFn(async (jobId: string) => {
  const { runBatchImportJob } = await import("~/lib/imports/batch-runner");
  return runBatchImportJob({ jobId });
});
