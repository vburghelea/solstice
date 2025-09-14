import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSystemBySlugSchema, listSystemsSchema } from "./game-systems.schemas";

export const listSystemsHandler = async ({
  data,
}: {
  data: z.infer<typeof listSystemsSchema>;
}) => {
  const [{ getDb }, { gameSystems, mediaAssets }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { and, eq, sql } = await import("drizzle-orm");
  const { alias } = await import("drizzle-orm/pg-core");

  const db = await getDb();
  const page = data.page ?? 1;
  const perPage = data.perPage ?? 20;
  const offset = (page - 1) * perPage;

  const heroImage = alias(mediaAssets, "heroImage") as typeof mediaAssets;

  const items = await db
    .select({ system: gameSystems, hero: heroImage })
    .from(gameSystems)
    .leftJoin(
      heroImage,
      and(
        eq(heroImage["gameSystemId"], gameSystems.id),
        eq(heroImage["orderIndex"], 0),
        eq(heroImage["moderated"], false),
      ),
    )
    .limit(perPage)
    .offset(offset);

  const [countRow] = await db.select({ count: sql<number>`count(*)` }).from(gameSystems);

  return { items, page, perPage, total: Number(countRow?.count ?? 0) };
};

export const listSystems = createServerFn({ method: "POST" })
  .validator(listSystemsSchema.parse)
  .handler(listSystemsHandler);

export const getSystemBySlugHandler = async ({
  data,
}: {
  data: z.infer<typeof getSystemBySlugSchema>;
}) => {
  const [{ getDb }, { gameSystems, mediaAssets, faqs }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/db/schema"),
  ]);
  const { and, asc, eq } = await import("drizzle-orm");

  const db = await getDb();
  const [system] = await db
    .select({ system: gameSystems })
    .from(gameSystems)
    .where(eq(gameSystems.slug, data.slug))
    .limit(1);

  if (!system) return null;

  const images = await db
    .select({ image: mediaAssets })
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.gameSystemId, system.system.id),
        eq(mediaAssets.moderated, false),
      ),
    )
    .orderBy(asc(mediaAssets.orderIndex));

  const faqsData = await db
    .select({ faq: faqs })
    .from(faqs)
    .where(eq(faqs.gameSystemId, system.system.id));

  return {
    ...system,
    heroImage: images[0]?.image ?? null,
    gallery: images.map((i) => i.image),
    faqs: faqsData.map((f) => f.faq),
  };
};

export const getSystemBySlug = createServerFn({ method: "POST" })
  .validator(getSystemBySlugSchema.parse)
  .handler(getSystemBySlugHandler);

export type ListSystemsResult = Awaited<ReturnType<typeof listSystems>>;
export type GetSystemBySlugResult = Awaited<ReturnType<typeof getSystemBySlug>>;
