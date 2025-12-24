import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { getPrivacyExportUrlSchema, policyTypeSchema } from "./privacy.schemas";

const getSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });
  return session?.user?.id ?? null;
};

export const listPolicyDocuments = createServerFn({ method: "GET" }).handler(async () => {
  const { getDb } = await import("~/db/server-helpers");
  const { policyDocuments } = await import("~/db/schema");
  const { desc } = await import("drizzle-orm");

  const db = await getDb();
  return db.select().from(policyDocuments).orderBy(desc(policyDocuments.createdAt));
});

export const getLatestPolicyDocument = createServerFn({ method: "GET" })
  .inputValidator(zod$(policyTypeSchema))
  .handler(async ({ data }) => {
    const { getDb } = await import("~/db/server-helpers");
    const { policyDocuments } = await import("~/db/schema");
    const { desc, eq } = await import("drizzle-orm");

    const db = await getDb();
    const [policy] = await db
      .select()
      .from(policyDocuments)
      .where(eq(policyDocuments.type, data))
      .orderBy(desc(policyDocuments.effectiveDate))
      .limit(1);

    return policy ?? null;
  });

export const listUserPolicyAcceptances = createServerFn({ method: "GET" }).handler(
  async () => {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { userPolicyAcceptances } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    return db
      .select()
      .from(userPolicyAcceptances)
      .where(eq(userPolicyAcceptances.userId, userId));
  },
);

export const listPrivacyRequests = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await getSessionUserId();
  if (!userId) return [];

  const { getDb } = await import("~/db/server-helpers");
  const { privacyRequests } = await import("~/db/schema");
  const { desc, eq } = await import("drizzle-orm");

  const db = await getDb();
  return db
    .select()
    .from(privacyRequests)
    .where(eq(privacyRequests.userId, userId))
    .orderBy(desc(privacyRequests.createdAt));
});

export const listAllPrivacyRequests = createServerFn({ method: "GET" }).handler(
  async () => {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { privacyRequests } = await import("~/db/schema");
    const { desc } = await import("drizzle-orm");

    const db = await getDb();
    return db.select().from(privacyRequests).orderBy(desc(privacyRequests.createdAt));
  },
);

export const listRetentionPolicies = createServerFn({ method: "GET" }).handler(
  async () => {
    const userId = await getSessionUserId();
    if (!userId) return [];

    const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
    await requireAdmin(userId);

    const { getDb } = await import("~/db/server-helpers");
    const { retentionPolicies } = await import("~/db/schema");
    const { asc } = await import("drizzle-orm");

    const db = await getDb();
    return db.select().from(retentionPolicies).orderBy(asc(retentionPolicies.dataType));
  },
);

export const getPrivacyExportDownloadUrl = createServerFn({ method: "GET" })
  .inputValidator(zod$(getPrivacyExportUrlSchema))
  .handler(async ({ data }) => {
    const userId = await getSessionUserId();
    if (!userId) return null;

    const { getDb } = await import("~/db/server-helpers");
    const { privacyRequests } = await import("~/db/schema");
    const { eq } = await import("drizzle-orm");

    const db = await getDb();
    const [request] = await db
      .select()
      .from(privacyRequests)
      .where(eq(privacyRequests.id, data.requestId))
      .limit(1);

    if (!request?.resultUrl) return null;

    if (request.userId !== userId) {
      const { requireAdmin } = await import("~/lib/auth/utils/admin-check");
      await requireAdmin(userId);
    }

    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const { getArtifactsBucketName, getS3Client } =
      await import("~/lib/storage/artifacts");

    const bucket = request.resultUrl.startsWith("s3://")
      ? request.resultUrl.replace("s3://", "").split("/")[0]
      : await getArtifactsBucketName();
    const key = request.resultUrl.startsWith("s3://")
      ? request.resultUrl.replace(`s3://${bucket}/`, "")
      : request.resultUrl;

    const client = await getS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const url = await getSignedUrl(client, command, { expiresIn: 900 });
    return url;
  });
