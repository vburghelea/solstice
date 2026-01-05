import { createServerOnlyFn } from "@tanstack/react-start";

export const getArtifactsBucketName = createServerOnlyFn(async () => {
  const { env } = await import("~/lib/env.server");
  const bucket = env.SIN_ARTIFACTS_BUCKET;

  if (!bucket) {
    throw new Error("SIN_ARTIFACTS_BUCKET is not configured.");
  }

  return bucket;
});

export const getAuditArchiveBucketName = createServerOnlyFn(async () => {
  const { env } = await import("~/lib/env.server");
  const bucket = env.SIN_AUDIT_ARCHIVE_BUCKET ?? env.SIN_ARTIFACTS_BUCKET;

  if (!bucket) {
    throw new Error("SIN_AUDIT_ARCHIVE_BUCKET is not configured.");
  }

  return bucket;
});

export const getS3Client = createServerOnlyFn(async () => {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const region = process.env["AWS_REGION"] ?? "ca-central-1";

  return new S3Client({ region });
});
