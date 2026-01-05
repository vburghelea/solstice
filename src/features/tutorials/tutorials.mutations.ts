import { createServerFn } from "@tanstack/react-start";
import { zod$ } from "~/lib/server/fn-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";
import {
  completeTutorialSchema,
  dismissTutorialSchema,
  startTutorialSchema,
} from "./tutorials.schemas";

const requireSessionUserId = async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) {
    const { unauthorized } = await import("~/lib/server/errors");
    throw unauthorized("User not authenticated");
  }

  return session.user.id;
};

export const startTutorial = createServerFn({ method: "POST" })
  .inputValidator(zod$(startTutorialSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_walkthroughs");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { tutorialCompletions } = await import("~/db/schema");
    const db = await getDb();

    const [row] = await db
      .insert(tutorialCompletions)
      .values({
        userId,
        tutorialId: data.tutorialId,
        status: "started",
        startedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tutorialCompletions.userId, tutorialCompletions.tutorialId],
        set: {
          status: "started",
          startedAt: new Date(),
          completedAt: null,
          dismissedAt: null,
        },
      })
      .returning();

    return row;
  });

export const completeTutorial = createServerFn({ method: "POST" })
  .inputValidator(zod$(completeTutorialSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_walkthroughs");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { tutorialCompletions } = await import("~/db/schema");
    const db = await getDb();

    const [row] = await db
      .insert(tutorialCompletions)
      .values({
        userId,
        tutorialId: data.tutorialId,
        status: "completed",
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tutorialCompletions.userId, tutorialCompletions.tutorialId],
        set: {
          status: "completed",
          completedAt: new Date(),
          dismissedAt: null,
        },
      })
      .returning();

    return row;
  });

export const dismissTutorial = createServerFn({ method: "POST" })
  .inputValidator(zod$(dismissTutorialSchema))
  .handler(async ({ data }) => {
    await assertFeatureEnabled("sin_walkthroughs");
    const userId = await requireSessionUserId();

    const { getDb } = await import("~/db/server-helpers");
    const { tutorialCompletions } = await import("~/db/schema");
    const db = await getDb();

    const [row] = await db
      .insert(tutorialCompletions)
      .values({
        userId,
        tutorialId: data.tutorialId,
        status: "dismissed",
        dismissedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [tutorialCompletions.userId, tutorialCompletions.tutorialId],
        set: {
          status: "dismissed",
          dismissedAt: new Date(),
          completedAt: null,
        },
      })
      .returning();

    return row;
  });
