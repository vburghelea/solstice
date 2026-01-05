import { createServerOnlyFn } from "@tanstack/react-start";

type LegalHoldTarget = {
  objectKey: string;
  bucket?: string;
  versionId?: string;
};

const resolveTarget = ({ objectKey, bucket, versionId }: LegalHoldTarget) => {
  if (objectKey.startsWith("s3://")) {
    const trimmed = objectKey.replace("s3://", "");
    const [parsedBucket, ...keyParts] = trimmed.split("/");
    const key = keyParts.join("/");

    if (!parsedBucket || !key) {
      throw new Error("Invalid S3 object URL for legal hold.");
    }

    return { bucket: parsedBucket, key, versionId };
  }

  if (!bucket) {
    throw new Error("Bucket is required when objectKey is not an s3:// URL.");
  }

  return { bucket, key: objectKey, versionId };
};

export const applyLegalHold = createServerOnlyFn(async (target: LegalHoldTarget) => {
  const { PutObjectLegalHoldCommand } = await import("@aws-sdk/client-s3");
  const { getS3Client } = await import("~/lib/storage/artifacts");

  const { bucket, key, versionId } = resolveTarget(target);
  const client = await getS3Client();

  await client.send(
    new PutObjectLegalHoldCommand({
      Bucket: bucket,
      Key: key,
      ...(versionId ? { VersionId: versionId } : {}),
      LegalHold: { Status: "ON" },
    }),
  );

  return { bucket, key };
});

export const releaseLegalHold = createServerOnlyFn(async (target: LegalHoldTarget) => {
  const { PutObjectLegalHoldCommand } = await import("@aws-sdk/client-s3");
  const { getS3Client } = await import("~/lib/storage/artifacts");

  const { bucket, key, versionId } = resolveTarget(target);
  const client = await getS3Client();

  await client.send(
    new PutObjectLegalHoldCommand({
      Bucket: bucket,
      Key: key,
      ...(versionId ? { VersionId: versionId } : {}),
      LegalHold: { Status: "OFF" },
    }),
  );

  return { bucket, key };
});
