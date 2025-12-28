import { runBatchImportJob } from "~/lib/imports/batch-runner";

const readArgValue = (flag: string) => {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
};

const readJobIdFromEvent = () => {
  const raw = process.env["SST_EVENT"];
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { detail?: { jobId?: string }; jobId?: string };
    return parsed.detail?.jobId ?? parsed.jobId ?? null;
  } catch {
    return null;
  }
};

const main = async () => {
  const jobId =
    readArgValue("--job-id") ??
    readArgValue("--jobId") ??
    process.env["SIN_IMPORT_JOB_ID"] ??
    readJobIdFromEvent();
  if (!jobId) {
    console.error("Missing import job id. Provide --job-id or set SIN_IMPORT_JOB_ID.");
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
