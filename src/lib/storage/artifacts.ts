import { createServerOnlyFn } from "@tanstack/react-start";

export const getArtifactsBucketName = createServerOnlyFn(async () => {
  const { env } = await import("~/lib/env.server");
  const bucket = env.SIN_ARTIFACTS_BUCKET;

  if (!bucket) {
    throw new Error("SIN_ARTIFACTS_BUCKET is not configured.");
  }

  return bucket;
});

export const getS3Client = createServerOnlyFn(async () => {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const region = process.env["AWS_REGION"] ?? "ca-central-1";

  return new S3Client({ region });
});
