import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

const listSavedReportsSchema = z
  .object({
    organizationId: z.uuid().optional(),
  })
  .nullish()
  .transform((value) => value ?? {});

export const listSavedReports = createServerFn({ method: "GET" })
  .inputValidator(zod$(listSavedReportsSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_analytics");
    const { getDb } = await import("~/db/server-helpers");
    const { savedReports } = await import("~/db/schema");
    const { eq, or } = await import("drizzle-orm");

    const db = await getDb();

    if (data.organizationId) {
      return db
        .select()
        .from(savedReports)
        .where(
          or(
            eq(savedReports.organizationId, data.organizationId),
            eq(savedReports.isOrgWide, true),
          ),
        );
    }

    return db.select().from(savedReports);
  });
