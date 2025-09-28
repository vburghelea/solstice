import { createServerFn } from "@tanstack/react-start";
import type {
  BulkUpdateAdminSystemsInput,
  CreateManualGameSystemInput,
} from "./game-systems-admin.schemas";
import {
  bulkUpdateAdminSystemsSchema,
  createManualGameSystemSchema,
} from "./game-systems-admin.schemas";

const bulkUpdateAdminSystemsHandler = async ({
  data,
}: {
  data: BulkUpdateAdminSystemsInput;
}) => {
  const uniqueSystemIds = Array.from(new Set(data.systemIds));
  if (uniqueSystemIds.length === 0) {
    throw new Error("No game systems provided for bulk action.");
  }

  const [{ getDb }, schema, { inArray }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
    import("drizzle-orm"),
  ]);

  const db = await getDb();
  const now = new Date();
  const {
    gameSystems,
    mediaAssets,
    systemCrawlEvents,
    faqs,
    gameSystemToCategory,
    gameSystemToMechanics,
    userGameSystemPreferences,
  } = schema;

  switch (data.action.type) {
    case "set-publish": {
      const updated = await db
        .update(gameSystems)
        .set({
          isPublished: data.action.isPublished,
          updatedAt: now,
        })
        .where(inArray(gameSystems.id, uniqueSystemIds))
        .returning();

      if (updated.length === 0) {
        throw new Error("No matching game systems found for publish update.");
      }

      return { updatedIds: updated.map((row) => row.id) };
    }
    case "set-approval": {
      const [{ getAuth }, { getWebRequest }] = await Promise.all([
        import("~/lib/auth/server-helpers"),
        import("@tanstack/react-start/server"),
      ]);
      const auth = await getAuth();
      const { headers } = getWebRequest();
      const session = await auth.api.getSession({ headers });

      if (!session?.user?.id) {
        throw new Error("You must be signed in to manage CMS approval.");
      }

      const updated = await db
        .update(gameSystems)
        .set({
          cmsApproved: data.action.cmsApproved,
          lastApprovedAt: data.action.cmsApproved ? now : null,
          lastApprovedBy: data.action.cmsApproved ? session.user.id : null,
          updatedAt: now,
        })
        .where(inArray(gameSystems.id, uniqueSystemIds))
        .returning();

      if (updated.length === 0) {
        throw new Error("No matching game systems found for approval update.");
      }

      return { updatedIds: updated.map((row) => row.id) };
    }
    case "set-hero-moderation": {
      const heroRows = await db
        .select({ heroImageId: gameSystems.heroImageId })
        .from(gameSystems)
        .where(inArray(gameSystems.id, uniqueSystemIds));

      const heroIds = heroRows
        .map((row) => row.heroImageId)
        .filter((id): id is number => id != null);

      if (heroIds.length === 0) {
        throw new Error("None of the selected systems have a hero image to update.");
      }

      await db
        .update(mediaAssets)
        .set({ moderated: data.action.moderated, updatedAt: now })
        .where(inArray(mediaAssets.id, Array.from(new Set(heroIds))));

      await db
        .update(gameSystems)
        .set({ updatedAt: now })
        .where(inArray(gameSystems.id, uniqueSystemIds));

      return { moderatedHeroIds: heroIds };
    }
    case "queue-recrawl": {
      const source = data.action.source ?? "manual-bulk";
      let queuedIds: number[] = [];

      await db.transaction(async (tx) => {
        const updated = await tx
          .update(gameSystems)
          .set({ crawlStatus: "queued", updatedAt: now })
          .where(inArray(gameSystems.id, uniqueSystemIds))
          .returning();

        if (updated.length === 0) {
          throw new Error("No matching game systems found to queue for recrawl.");
        }

        const eventPayload = updated.map((row) => ({
          gameSystemId: row.id,
          source,
          status: "queued",
          severity: "info" as const,
          startedAt: now,
          finishedAt: now,
        }));

        await tx.insert(systemCrawlEvents).values(eventPayload);
        queuedIds = updated.map((row) => row.id);
      });

      return { queuedIds };
    }
    case "deactivate": {
      const updated = await db
        .update(gameSystems)
        .set({
          isPublished: false,
          cmsApproved: false,
          lastApprovedAt: null,
          lastApprovedBy: null,
          crawlStatus: "inactive",
          updatedAt: now,
        })
        .where(inArray(gameSystems.id, uniqueSystemIds))
        .returning();

      if (updated.length === 0) {
        throw new Error("No matching game systems found to deactivate.");
      }

      return { deactivatedIds: updated.map((row) => row.id) };
    }
    case "delete": {
      let deletedIds: number[] = [];

      await db.transaction(async (tx) => {
        await tx
          .delete(mediaAssets)
          .where(inArray(mediaAssets.gameSystemId, uniqueSystemIds));
        await tx.delete(faqs).where(inArray(faqs.gameSystemId, uniqueSystemIds));
        await tx
          .delete(gameSystemToCategory)
          .where(inArray(gameSystemToCategory.gameSystemId, uniqueSystemIds));
        await tx
          .delete(gameSystemToMechanics)
          .where(inArray(gameSystemToMechanics.gameSystemId, uniqueSystemIds));
        await tx
          .delete(systemCrawlEvents)
          .where(inArray(systemCrawlEvents.gameSystemId, uniqueSystemIds));
        await tx
          .delete(userGameSystemPreferences)
          .where(inArray(userGameSystemPreferences.gameSystemId, uniqueSystemIds));

        const deleted = await tx
          .delete(gameSystems)
          .where(inArray(gameSystems.id, uniqueSystemIds))
          .returning();

        if (deleted.length === 0) {
          throw new Error("No matching game systems found to delete.");
        }

        deletedIds = deleted.map((row) => row.id);
      });

      return { deletedIds };
    }
    default:
      throw new Error("Unsupported bulk action requested.");
  }
};

export const bulkUpdateAdminSystems = createServerFn({ method: "POST" })
  .validator(bulkUpdateAdminSystemsSchema.parse)
  .handler(bulkUpdateAdminSystemsHandler);

const createManualGameSystemHandler = async ({
  data,
}: {
  data: CreateManualGameSystemInput;
}) => {
  const name = data.name.trim();
  if (name.length === 0) {
    throw new Error("Name is required.");
  }

  const [{ getDb }, schema, { eq }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
    import("drizzle-orm"),
  ]);

  const db = await getDb();
  const { gameSystems, systemCrawlEvents } = schema;

  const existing = await db
    .select({ id: gameSystems.id })
    .from(gameSystems)
    .where(eq(gameSystems.name, name))
    .limit(1);

  if (existing.length > 0) {
    throw new Error("A game system with this name already exists.");
  }

  const baseSlug = slugify(name);

  const ensureUniqueSlug = async (base: string) => {
    const sanitized = base.length > 0 ? base : `system-${Date.now().toString(36)}`;
    let slug = sanitized;
    let counter = 1;

    const slugExists = async (candidate: string) => {
      const duplicate = await db
        .select({ id: gameSystems.id })
        .from(gameSystems)
        .where(eq(gameSystems.slug, candidate))
        .limit(1);
      return duplicate.length > 0;
    };

    while (await slugExists(slug)) {
      slug = `${sanitized}-${counter}`.slice(0, 255);
      counter += 1;
    }

    return slug;
  };

  const slug = await ensureUniqueSlug(baseSlug);
  const now = new Date();

  const externalRefs = (() => {
    if (!data.externalSource) return null;
    const key =
      data.externalSource.kind === "custom"
        ? data.externalSource.customKey?.trim()?.toLowerCase()
        : data.externalSource.kind;

    if (!key) return null;

    const value = data.externalSource.value.trim();
    return { [key]: value } as Record<string, string>;
  })();

  const sourceOfTruth = data.externalSource?.kind ?? "cms";

  const created = await db.transaction(async (tx) => {
    const [system] = await tx
      .insert(gameSystems)
      .values({
        name,
        slug,
        externalRefs,
        sourceOfTruth,
        crawlStatus: data.queueRecrawl ? "queued" : null,
        isPublished: false,
        cmsApproved: false,
        updatedAt: now,
      })
      .returning();

    if (!system) {
      throw new Error("Failed to create the game system.");
    }

    if (data.queueRecrawl) {
      const source = data.externalSource?.kind ?? "manual-seed";
      await tx.insert(systemCrawlEvents).values({
        gameSystemId: system.id,
        source,
        status: "queued",
        severity: "info",
        startedAt: now,
        finishedAt: now,
      });
    }

    return { id: system.id, slug: system.slug ?? slug };
  });

  return created;
};

export const createManualGameSystem = createServerFn({ method: "POST" })
  .validator(createManualGameSystemSchema.parse)
  .handler(createManualGameSystemHandler);

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 60);
}
