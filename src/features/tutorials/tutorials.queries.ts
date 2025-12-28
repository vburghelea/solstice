import { createServerFn } from "@tanstack/react-start";
import { getAuthMiddleware, requireUser } from "~/lib/server/auth";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import { tutorialIds } from "./tutorials.config";
import { listTutorialProgressSchema } from "./tutorials.schemas";

export const listTutorialProgress = createServerFn({ method: "GET" })
  .middleware(getAuthMiddleware())
  .inputValidator(zod$(listTutorialProgressSchema))
  .handler(async ({ data, context }) => {
    await assertFeatureEnabled("sin_walkthroughs");
    const user = requireUser(context);

    const ids = data.tutorialIds ?? tutorialIds;
    if (ids.length === 0) return [];

    const { getDb } = await import("~/db/server-helpers");
    const { tutorialCompletions } = await import("~/db/schema");
    const { and, eq, inArray } = await import("drizzle-orm");

    const db = await getDb();
    const rows = await db
      .select()
      .from(tutorialCompletions)
      .where(
        and(
          eq(tutorialCompletions.userId, user.id),
          inArray(tutorialCompletions.tutorialId, ids),
        ),
      );

    const byId = new Map(rows.map((row) => [row.tutorialId, row]));

    return ids.map((id) => {
      const row = byId.get(id);
      return {
        tutorialId: id,
        status: row?.status ?? "not_started",
        startedAt: row?.startedAt ?? null,
        completedAt: row?.completedAt ?? null,
        dismissedAt: row?.dismissedAt ?? null,
      };
    });
  });
