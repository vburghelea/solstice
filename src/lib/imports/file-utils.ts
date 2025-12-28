import type { JsonRecord } from "~/shared/lib/json";

export type ImportFileType = "csv" | "excel";

export const streamToBuffer = async (body: unknown): Promise<Buffer> => {
  if (!body) return Buffer.alloc(0);
  if (body instanceof Uint8Array) return Buffer.from(body);
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (typeof body === "object" && "transformToByteArray" in (body as object)) {
    const byteArray = await (
      body as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(byteArray);
  }
  if (typeof body === "object" && "pipe" in (body as object)) {
    const stream = body as NodeJS.ReadableStream;
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }
  return Buffer.alloc(0);
};

export const loadImportFileBuffer = async (storageKey: string): Promise<Buffer> => {
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getArtifactsBucketName, getS3Client } = await import("~/lib/storage/artifacts");

  const bucket = await getArtifactsBucketName();
  const client = await getS3Client();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: storageKey,
    }),
  );

  return streamToBuffer(response.Body);
};

export const hashImportBuffer = async (buffer: Buffer): Promise<string> => {
  const { createHash } = await import("crypto");
  return createHash("sha256").update(buffer).digest("hex");
};

export const parseImportBuffer = async (
  buffer: Buffer,
  type: ImportFileType,
): Promise<JsonRecord[]> => {
  if (type === "csv") {
    const Papa = await import("papaparse");
    const parsed = Papa.parse(buffer.toString("utf8"), {
      header: true,
      skipEmptyLines: true,
    });
    return (parsed.data ?? []) as JsonRecord[];
  }

  const { read, utils } = await import("xlsx");
  const workbook = read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return utils.sheet_to_json(sheet, { defval: "" }) as JsonRecord[];
};

export const loadImportFile = async (
  storageKey: string,
  type: ImportFileType,
): Promise<{ rows: JsonRecord[]; hash: string }> => {
  const buffer = await loadImportFileBuffer(storageKey);
  const hash = await hashImportBuffer(buffer);
  const rows = await parseImportBuffer(buffer, type);
  return { rows, hash };
};
