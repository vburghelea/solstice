import { runBatchImportJob } from "~/lib/imports/batch-runner";

const readArgValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
};

const main = async () => {
  const jobId = readArgValue("--job-id") ?? readArgValue("--jobId");
  if (!jobId) {
    console.error("Missing --job-id argument.");
    process.exit(1);
  }

  const actorUserId = process.env["SIN_IMPORT_ACTOR_USER_ID"] ?? null;

  try {
    const result = await runBatchImportJob(
      actorUserId ? { jobId, actorUserId } : { jobId },
    );
    console.log("Batch import completed:", result);
  } catch (error) {
    console.error("Batch import failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

void main();
