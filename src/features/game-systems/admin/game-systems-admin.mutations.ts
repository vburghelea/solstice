import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import type { BulkUpdateAdminSystemsInput } from "./game-systems-admin.schemas";
import { bulkUpdateAdminSystemsSchema } from "./game-systems-admin.schemas";

const bulkUpdateAdminSystemsHandler = async ({
  data,
}: {
  data: BulkUpdateAdminSystemsInput;
}) => {
  const [{ getDb }, { gameSystems }, { getAuth }, { inArray }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
    import("~/lib/auth/server-helpers"),
    import("drizzle-orm"),
  ]);

  const db = await getDb();
  const now = new Date();
  const updatePayload: Partial<typeof gameSystems.$inferInsert> = {
    updatedAt: now,
  };

  if (data.updates.isPublished !== undefined) {
    updatePayload.isPublished = data.updates.isPublished;
  }

  if (data.updates.cmsApproved !== undefined) {
    const auth = await getAuth();
    const { headers } = getWebRequest();
    const session = await auth.api.getSession({ headers });

    if (!session?.user?.id) {
      throw new Error("You must be signed in to manage CMS approval.");
    }

    updatePayload.cmsApproved = data.updates.cmsApproved;
    updatePayload.lastApprovedAt = data.updates.cmsApproved ? now : null;
    updatePayload.lastApprovedBy = data.updates.cmsApproved ? session.user.id : null;
  }

  const updated = await db
    .update(gameSystems)
    .set(updatePayload)
    .where(inArray(gameSystems.id, data.systemIds))
    .returning();

  if (updated.length === 0) {
    throw new Error("No matching game systems found for bulk update.");
  }

  return { updatedIds: updated.map((row) => row.id) };
};

export const bulkUpdateAdminSystems = createServerFn({ method: "POST" })
  .validator(bulkUpdateAdminSystemsSchema.parse)
  .handler(bulkUpdateAdminSystemsHandler);
