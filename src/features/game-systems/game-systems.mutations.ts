import { createServerFn } from "@tanstack/react-start";
import {
  mapExternalTagSchema,
  reorderImagesSchema,
  triggerRecrawlSchema,
  upsertCmsContentSchema,
} from "./game-systems.schemas";

export const upsertCmsContentHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").UpsertCmsContentInput;
}) => {
  const [{ getDb }, { gameSystems, faqs }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { and, eq, sql } = await import("drizzle-orm");
  const db = await getDb();
  const { systemId, description, faqs: faqItems } = data;

  if (description !== undefined) {
    await db
      .update(gameSystems)
      .set({
        descriptionCms: description,
        cmsApproved: false,
        cmsVersion: sql`${gameSystems.cmsVersion} + 1`,
      })
      .where(eq(gameSystems.id, systemId));
  }

  if (faqItems) {
    await db
      .delete(faqs)
      .where(and(eq(faqs.gameSystemId, systemId), eq(faqs.isCmsOverride, true)));

    if (faqItems.length > 0) {
      await db.insert(faqs).values(
        faqItems.map((f) => ({
          gameSystemId: systemId,
          question: f.question,
          answer: f.answer,
          source: "cms",
          isCmsOverride: true,
        })),
      );
    }
  }

  return { ok: true };
};

export const upsertCmsContent = createServerFn({ method: "POST" })
  .validator(upsertCmsContentSchema.parse)
  .handler(upsertCmsContentHandler);

export const reorderImagesHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").ReorderImagesInput;
}) => {
  const [{ getDb }, { mediaAssets }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  await Promise.all(
    data.imageIds.map((id, index) =>
      db.update(mediaAssets).set({ orderIndex: index }).where(eq(mediaAssets.id, id)),
    ),
  );

  return { ok: true };
};

export const reorderImages = createServerFn({ method: "POST" })
  .validator(reorderImagesSchema.parse)
  .handler(reorderImagesHandler);

export const mapExternalTagHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").MapExternalTagInput;
}) => {
  const [
    { getDb },
    {
      externalCategoryMap,
      externalMechanicMap,
      gameSystemCategories,
      gameSystemMechanics,
    },
  ] = await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { eq } = await import("drizzle-orm");
  const db = await getDb();
  const confidence = Math.round(data.confidence * 100);

  const category = await db.query.gameSystemCategories.findFirst({
    where: eq(gameSystemCategories.id, data.systemId),
  });
  if (category) {
    await db.insert(externalCategoryMap).values({
      source: data.source,
      externalTag: data.externalId,
      categoryId: category.id,
      confidence,
    });
    return { mapped: "category" as const };
  }

  const mechanic = await db.query.gameSystemMechanics.findFirst({
    where: eq(gameSystemMechanics.id, data.systemId),
  });
  if (mechanic) {
    await db.insert(externalMechanicMap).values({
      source: data.source,
      externalTag: data.externalId,
      mechanicId: mechanic.id,
      confidence,
    });
    return { mapped: "mechanic" as const };
  }

  return { mapped: false as const };
};

export const mapExternalTag = createServerFn({ method: "POST" })
  .validator(mapExternalTagSchema.parse)
  .handler(mapExternalTagHandler);

export const triggerRecrawlHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").TriggerRecrawlInput;
}) => {
  const [{ getDb }, { gameSystems, systemCrawlEvents }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  await db
    .update(gameSystems)
    .set({ crawlStatus: "queued" })
    .where(eq(gameSystems.id, data.systemId));

  await db.insert(systemCrawlEvents).values({
    gameSystemId: data.systemId,
    source: data.source ?? "manual",
    status: "queued",
    startedAt: new Date(),
    finishedAt: new Date(),
  });

  return { enqueued: true };
};

export const triggerRecrawl = createServerFn({ method: "POST" })
  .validator(triggerRecrawlSchema.parse)
  .handler(triggerRecrawlHandler);
