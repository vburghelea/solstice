import { createServerOnlyFn } from "@tanstack/react-start";

type DeleteResult = {
  attempted: number;
  deleted: number;
  errors: Array<{ bucket: string; key: string; code?: string; message?: string }>;
};

type SubmissionFileS3Like = {
  bucket?: string | null;
  key?: string | null;

  // common patterns we might already have in the table
  storageKey?: string | null;
  s3Key?: string | null;
  url?: string | null;
  location?: string | null;
};

const normalizeKey = (value: string) => value.trim().replace(/^\/+/, "");

const parseS3Pointer = (value: string): { bucket: string; key: string } | null => {
  const trimmed = value.trim();

  if (trimmed.startsWith("s3://")) {
    const rest = trimmed.slice("s3://".length);
    const [bucket, ...keyParts] = rest.split("/");
    const key = keyParts.join("/");
    if (!bucket || !key) return null;
    return { bucket, key };
  }

  if (trimmed.startsWith("arn:aws:s3:::")) {
    const rest = trimmed.slice("arn:aws:s3:::".length);
    const [bucket, ...keyParts] = rest.split("/");
    const key = keyParts.join("/");
    if (!bucket || !key) return null;
    return { bucket, key };
  }

  return null;
};

const getString = (value: unknown) =>
  typeof value === "string" && value.trim().length ? value.trim() : null;

const resolveS3Ref = (
  item: unknown,
  defaultBucket: string,
): { bucket: string; key: string } | null => {
  if (typeof item === "string") {
    const parsed = parseS3Pointer(item);
    if (parsed) return parsed;

    const key = normalizeKey(item);
    return key ? { bucket: defaultBucket, key } : null;
  }

  if (!item || typeof item !== "object") return null;
  const obj = item as SubmissionFileS3Like;

  const bucket = getString(obj.bucket) ?? defaultBucket;

  const directKey = getString(obj.key);
  if (directKey) {
    const key = normalizeKey(directKey);
    return key ? { bucket, key } : null;
  }

  const candidate =
    getString(obj.storageKey) ??
    getString(obj.s3Key) ??
    getString(obj.url) ??
    getString(obj.location);

  if (!candidate) return null;

  const parsed = parseS3Pointer(candidate);
  if (parsed) return parsed;

  const key = normalizeKey(candidate);
  return key ? { bucket, key } : null;
};

export const deleteFormSubmissionFiles = createServerOnlyFn(
  async (params: {
    items: unknown[];
    defaultBucket?: string;
    throwOnErrors?: boolean;
  }): Promise<DeleteResult> => {
    const { DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const defaultBucket = params.defaultBucket ?? (await getArtifactsBucketName());
    const throwOnErrors = params.throwOnErrors ?? true;

    const refs = params.items
      .map((item) => resolveS3Ref(item, defaultBucket))
      .filter(Boolean) as Array<{ bucket: string; key: string }>;

    if (refs.length === 0) return { attempted: 0, deleted: 0, errors: [] };

    // de-dupe + group by bucket
    const grouped = new Map<string, Set<string>>();
    for (const ref of refs) {
      if (!grouped.has(ref.bucket)) grouped.set(ref.bucket, new Set());
      grouped.get(ref.bucket)!.add(ref.key);
    }

    const client = await getS3Client();

    let deleted = 0;
    const errors: DeleteResult["errors"] = [];

    for (const [bucket, keySet] of grouped.entries()) {
      const keys = Array.from(keySet);
      const batchSize = 1000;

      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);

        const resp = await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
          }),
        );

        deleted += resp.Deleted?.length ?? 0;

        for (const err of resp.Errors ?? []) {
          if (!err.Key) continue;
          errors.push({
            bucket,
            key: err.Key,
            ...(err.Code ? { code: err.Code } : {}),
            ...(err.Message ? { message: err.Message } : {}),
          });
        }
      }
    }

    if (errors.length && throwOnErrors) {
      const example = errors[0]!;
      throw new Error(
        `Failed to delete ${errors.length} S3 object(s) (e.g., s3://${example.bucket}/${example.key} ${example.code ?? ""})`,
      );
    }

    return { attempted: refs.length, deleted, errors };
  },
);
