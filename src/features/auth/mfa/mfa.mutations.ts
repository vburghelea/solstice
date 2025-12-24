import { createServerFn } from "@tanstack/react-start";

export const markMfaEnrolled = createServerFn({ method: "POST" }).handler(async () => {
  const { getAuth } = await import("~/lib/auth/server-helpers");
  const { getRequest } = await import("@tanstack/react-start/server");
  const auth = await getAuth();
  const { headers } = getRequest();
  const session = await auth.api.getSession({ headers });

  if (!session?.user?.id) return null;

  const { getDb } = await import("~/db/server-helpers");
  const { user } = await import("~/db/schema");
  const { eq } = await import("drizzle-orm");
  const db = await getDb();

  const [updated] = await db
    .update(user)
    .set({ mfaEnrolledAt: new Date() })
    .where(eq(user.id, session.user.id))
    .returning();

  if (updated) {
    const { logAuthEvent } = await import("~/lib/audit");
    await logAuthEvent({
      action: "AUTH.MFA_ENROLL",
      actorUserId: session.user.id,
      targetType: "user",
      targetId: session.user.id,
    });
  }

  return updated ?? null;
});
