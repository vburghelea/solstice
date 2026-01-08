import { createServerFn } from "@tanstack/react-start";
import {
  mapExternalTagSchema,
  moderateImageSchema,
  reorderImagesSchema,
  selectHeroImageSchema,
  triggerRecrawlSchema,
  updateCmsApprovalSchema,
  updatePublishStatusSchema,
  uploadImageSchema,
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
  .inputValidator(upsertCmsContentSchema.parse)
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
  .inputValidator(reorderImagesSchema.parse)
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
      gameSystemToCategory,
      gameSystemToMechanics,
    },
  ] = await Promise.all([import("~/db/server-helpers"), import("~/db/schema")]);
  const { and, eq } = await import("drizzle-orm");
  const db = await getDb();
  const confidence = Math.round(data.confidence * 100);

  if (data.targetType === "category") {
    const categoryLink = await db
      .select({ categoryId: gameSystemToCategory.categoryId })
      .from(gameSystemToCategory)
      .where(
        and(
          eq(gameSystemToCategory.gameSystemId, data.systemId),
          eq(gameSystemToCategory.categoryId, data.targetId),
        ),
      )
      .limit(1);

    if (categoryLink.length === 0) {
      throw new Error("Category is not associated with this system.");
    }

    await db
      .insert(externalCategoryMap)
      .values({
        source: data.source,
        externalTag: data.externalTag,
        categoryId: data.targetId,
        confidence,
      })
      .onConflictDoUpdate({
        target: [externalCategoryMap.source, externalCategoryMap.externalTag],
        set: {
          categoryId: data.targetId,
          confidence,
        },
      });

    return { mapped: "category" as const };
  }

  const mechanicLink = await db
    .select({ mechanicsId: gameSystemToMechanics.mechanicsId })
    .from(gameSystemToMechanics)
    .where(
      and(
        eq(gameSystemToMechanics.gameSystemId, data.systemId),
        eq(gameSystemToMechanics.mechanicsId, data.targetId),
      ),
    )
    .limit(1);

  if (mechanicLink.length === 0) {
    throw new Error("Mechanic is not associated with this system.");
  }

  await db
    .insert(externalMechanicMap)
    .values({
      source: data.source,
      externalTag: data.externalTag,
      mechanicId: data.targetId,
      confidence,
    })
    .onConflictDoUpdate({
      target: [externalMechanicMap.source, externalMechanicMap.externalTag],
      set: {
        mechanicId: data.targetId,
        confidence,
      },
    });

  return { mapped: "mechanic" as const };
};

export const mapExternalTag = createServerFn({ method: "POST" })
  .inputValidator(mapExternalTagSchema.parse)
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
  .inputValidator(triggerRecrawlSchema.parse)
  .handler(triggerRecrawlHandler);

export const updatePublishStatusHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").UpdatePublishStatusInput;
}) => {
  const [{ getDb }, { gameSystems }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  const [updated] = await db
    .update(gameSystems)
    .set({
      isPublished: data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(gameSystems.id, data.systemId))
    .returning();

  if (!updated) {
    throw new Error("Game system not found.");
  }

  return { ok: true };
};

export const updatePublishStatus = createServerFn({ method: "POST" })
  .inputValidator(updatePublishStatusSchema.parse)
  .handler(updatePublishStatusHandler);

export const updateCmsApprovalHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").UpdateCmsApprovalInput;
}) => {
  const [{ getDb }, { gameSystems }, { getAuth }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
    import("~/lib/auth/server-helpers"),
  ]);
  const { eq } = await import("drizzle-orm");
  const { getRequest } = await import("@tanstack/react-start/server");

  const db = await getDb();
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    throw new Error("You must be signed in to manage CMS approval.");
  }

  type GameSystemUpdate = typeof gameSystems.$inferInsert;
  const now = new Date();
  const updatePayload: Partial<GameSystemUpdate> = {
    cmsApproved: data.approved,
    updatedAt: now,
    lastApprovedAt: data.approved ? now : null,
    lastApprovedBy: data.approved ? session.user.id : null,
  };

  const [updated] = await db
    .update(gameSystems)
    .set(updatePayload)
    .where(eq(gameSystems.id, data.systemId))
    .returning();

  if (!updated) {
    throw new Error("Game system not found.");
  }

  return { ok: true };
};

export const updateCmsApproval = createServerFn({ method: "POST" })
  .inputValidator(updateCmsApprovalSchema.parse)
  .handler(updateCmsApprovalHandler);

export const uploadImageHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").UploadImageInput;
}) => {
  const [{ getDb }, { mediaAssets, gameSystems }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  type MediaAsset = typeof mediaAssets.$inferSelect;
  const db = await getDb();
  const { eq } = await import("drizzle-orm");

  // Get game system information for enhanced metadata
  const gameSystem = await db.query.gameSystems.findFirst({
    where: eq(gameSystems.id, data.systemId),
    columns: { name: true, slug: true, sourceOfTruth: true },
  });

  if (!gameSystem) {
    throw new Error(`Game system with ID ${data.systemId} not found`);
  }

  // Use enhanced upload function with proper metadata and folder structure
  const { uploadGameSystemMediaFromUrl } = await import("~/lib/storage/media-assets");
  const uploadOptions: import("~/lib/storage/media-assets").MediaUploadOptions = {
    type: data.kind as "thumbnail" | "hero" | "gallery" | "cover",
    gameSystemId: data.systemId,
    source: "manual", // Manual uploads
    moderated: false, // Manual uploads start as non-moderated
    originalUrl: data.url,
  };

  // Add optional license fields if provided
  if (data.license) {
    uploadOptions.license = data.license;
  }
  if (data.licenseUrl) {
    uploadOptions.licenseUrl = data.licenseUrl;
  }

  const uploaded = await uploadGameSystemMediaFromUrl(data.url, uploadOptions, db);

  const [asset] = (await db
    .insert(mediaAssets)
    .values({
      gameSystemId: data.systemId,
      orderIndex: 0,
      publicId: uploaded.publicId,
      secureUrl: uploaded.secureUrl,
      width: uploaded.width,
      height: uploaded.height,
      format: uploaded.format,
      license: uploaded.license,
      licenseUrl: uploaded.licenseUrl,
      kind: uploaded.kind,
      moderated: uploaded.moderated,
      checksum: uploaded.checksum,
    })
    .returning()) as MediaAsset[];

  return { asset };
};

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator(uploadImageSchema.parse)
  .handler(uploadImageHandler);

export const moderateImageHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").ModerateImageInput;
}) => {
  const [{ getDb }, { mediaAssets }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { and, eq } = await import("drizzle-orm");
  const db = await getDb();

  const [updated] = await db
    .update(mediaAssets)
    .set({ moderated: data.moderated })
    .where(
      and(eq(mediaAssets.id, data.mediaId), eq(mediaAssets.gameSystemId, data.systemId)),
    )
    .returning();

  if (!updated) {
    throw new Error("Media asset not found for this system.");
  }

  return { assetId: updated.id, moderated: updated.moderated };
};

export const moderateImage = createServerFn({ method: "POST" })
  .inputValidator(moderateImageSchema.parse)
  .handler(moderateImageHandler);

export const selectHeroImageHandler = async ({
  data,
}: {
  data: import("./game-systems.schemas").SelectHeroImageInput;
}) => {
  const [{ getDb }, { gameSystems, mediaAssets }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { and, eq } = await import("drizzle-orm");
  const db = await getDb();

  const asset = await db
    .select({ id: mediaAssets.id })
    .from(mediaAssets)
    .where(
      and(eq(mediaAssets.id, data.mediaId), eq(mediaAssets.gameSystemId, data.systemId)),
    )
    .limit(1);

  if (asset.length === 0) {
    throw new Error("Media asset not found for this system.");
  }

  await db
    .update(gameSystems)
    .set({ heroImageId: data.mediaId })
    .where(eq(gameSystems.id, data.systemId));

  return { heroImageId: data.mediaId };
};

export const selectHeroImage = createServerFn({ method: "POST" })
  .inputValidator(selectHeroImageSchema.parse)
  .handler(selectHeroImageHandler);
