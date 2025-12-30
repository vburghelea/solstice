import { eq } from "drizzle-orm";
import {
  checkoutItems,
  checkoutSessions,
  eventPaymentSessions,
  membershipPaymentSessions,
  membershipPurchases,
  membershipTypes,
} from "~/db/schema";
import type { getDb } from "~/db/server-helpers";

type DbClient = Awaited<ReturnType<typeof getDb>>;

type LegacyCheckoutResult = {
  session: typeof checkoutSessions.$inferSelect | null;
  legacyType: "event_payment_session" | "membership_payment_session" | null;
};

type EnsureLegacyCheckoutParams = {
  db: DbClient;
  checkoutId: string | null;
  paymentId: string | null;
  orderId: string | null;
  now: Date;
};

const legacyStatusMap: Record<string, (typeof checkoutSessions.$inferSelect)["status"]> =
  {
    pending: "pending",
    completed: "completed",
    cancelled: "cancelled",
    failed: "failed",
  };

function mapLegacyStatus(status: string | null | undefined) {
  if (!status) return "pending";
  return legacyStatusMap[status] ?? "pending";
}

async function findLegacyEventSession({
  db,
  checkoutId,
  paymentId,
  orderId,
}: EnsureLegacyCheckoutParams) {
  if (checkoutId) {
    const [session] = await db
      .select()
      .from(eventPaymentSessions)
      .where(eq(eventPaymentSessions.squareCheckoutId, checkoutId))
      .limit(1);
    if (session) return session;
  }

  if (paymentId) {
    const [session] = await db
      .select()
      .from(eventPaymentSessions)
      .where(eq(eventPaymentSessions.squarePaymentId, paymentId))
      .limit(1);
    if (session) return session;
  }

  if (orderId) {
    const [session] = await db
      .select()
      .from(eventPaymentSessions)
      .where(eq(eventPaymentSessions.squareOrderId, orderId))
      .limit(1);
    if (session) return session;
  }

  return null;
}

async function findLegacyMembershipSession({
  db,
  checkoutId,
  paymentId,
  orderId,
}: EnsureLegacyCheckoutParams) {
  if (checkoutId) {
    const [session] = await db
      .select()
      .from(membershipPaymentSessions)
      .where(eq(membershipPaymentSessions.squareCheckoutId, checkoutId))
      .limit(1);
    if (session) return session;
  }

  if (paymentId) {
    const [session] = await db
      .select()
      .from(membershipPaymentSessions)
      .where(eq(membershipPaymentSessions.squarePaymentId, paymentId))
      .limit(1);
    if (session) return session;
  }

  if (orderId) {
    const [session] = await db
      .select()
      .from(membershipPaymentSessions)
      .where(eq(membershipPaymentSessions.squareOrderId, orderId))
      .limit(1);
    if (session) return session;
  }

  return null;
}

async function ensureCheckoutSession({
  db,
  providerCheckoutId,
}: {
  db: DbClient;
  providerCheckoutId: string;
}) {
  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.providerCheckoutId, providerCheckoutId))
    .limit(1);
  return session ?? null;
}

async function ensureSessionItems({
  db,
  sessionId,
}: {
  db: DbClient;
  sessionId: string;
}) {
  const [item] = await db
    .select()
    .from(checkoutItems)
    .where(eq(checkoutItems.checkoutSessionId, sessionId))
    .limit(1);
  return item ?? null;
}

export async function ensureLegacyCheckoutSession({
  db,
  checkoutId,
  paymentId,
  orderId,
  now,
}: EnsureLegacyCheckoutParams): Promise<LegacyCheckoutResult> {
  if (!checkoutId && !paymentId && !orderId) {
    return { session: null, legacyType: null };
  }

  const legacyEventSession = await findLegacyEventSession({
    db,
    checkoutId,
    paymentId,
    orderId,
    now,
  });

  if (legacyEventSession) {
    await db
      .insert(checkoutSessions)
      .values({
        userId: legacyEventSession.userId,
        provider: "square",
        providerCheckoutId: legacyEventSession.squareCheckoutId,
        providerCheckoutUrl: legacyEventSession.squarePaymentLinkUrl,
        providerOrderId: legacyEventSession.squareOrderId ?? null,
        providerPaymentId: legacyEventSession.squarePaymentId ?? null,
        status: mapLegacyStatus(legacyEventSession.status),
        amountTotalCents: legacyEventSession.amountCents,
        currency: legacyEventSession.currency,
        expiresAt: legacyEventSession.expiresAt,
        metadata: {
          ...(legacyEventSession.metadata ?? {}),
          legacySessionId: legacyEventSession.id,
          legacySessionType: "event_payment_session",
        },
      })
      .onConflictDoNothing();

    const session = await ensureCheckoutSession({
      db,
      providerCheckoutId: legacyEventSession.squareCheckoutId,
    });

    if (!session) {
      return { session: null, legacyType: "event_payment_session" };
    }

    const existingItem = await ensureSessionItems({ db, sessionId: session.id });
    if (!existingItem) {
      await db.insert(checkoutItems).values({
        checkoutSessionId: session.id,
        itemType: "event_registration",
        description: "Event registration (legacy)",
        quantity: 1,
        amountCents: legacyEventSession.amountCents,
        currency: legacyEventSession.currency,
        eventRegistrationId: legacyEventSession.registrationId,
        metadata: {
          legacySessionId: legacyEventSession.id,
        },
      });
    }

    return { session, legacyType: "event_payment_session" };
  }

  const legacyMembershipSession = await findLegacyMembershipSession({
    db,
    checkoutId,
    paymentId,
    orderId,
    now,
  });

  if (!legacyMembershipSession) {
    return { session: null, legacyType: null };
  }

  const [membershipType] = await db
    .select()
    .from(membershipTypes)
    .where(eq(membershipTypes.id, legacyMembershipSession.membershipTypeId))
    .limit(1);

  if (!membershipType) {
    return { session: null, legacyType: "membership_payment_session" };
  }

  await db
    .insert(checkoutSessions)
    .values({
      userId: legacyMembershipSession.userId,
      provider: "square",
      providerCheckoutId: legacyMembershipSession.squareCheckoutId,
      providerCheckoutUrl: legacyMembershipSession.squarePaymentLinkUrl,
      providerOrderId: legacyMembershipSession.squareOrderId ?? null,
      providerPaymentId: legacyMembershipSession.squarePaymentId ?? null,
      status: mapLegacyStatus(legacyMembershipSession.status),
      amountTotalCents: legacyMembershipSession.amountCents,
      currency: legacyMembershipSession.currency,
      expiresAt: legacyMembershipSession.expiresAt,
      metadata: {
        ...(legacyMembershipSession.metadata ?? {}),
        legacySessionId: legacyMembershipSession.id,
        legacySessionType: "membership_payment_session",
      },
    })
    .onConflictDoNothing();

  const session = await ensureCheckoutSession({
    db,
    providerCheckoutId: legacyMembershipSession.squareCheckoutId,
  });

  if (!session) {
    return { session: null, legacyType: "membership_payment_session" };
  }

  const existingItem = await ensureSessionItems({ db, sessionId: session.id });
  if (!existingItem) {
    const startDate = now.toISOString().split("T")[0];
    const endDate = (() => {
      const end = new Date(now);
      end.setMonth(end.getMonth() + membershipType.durationMonths);
      return end.toISOString().split("T")[0];
    })();

    const [purchase] = await db
      .insert(membershipPurchases)
      .values({
        membershipTypeId: membershipType.id,
        userId: legacyMembershipSession.userId,
        startDate,
        endDate,
        status: "pending",
        metadata: {
          membershipName: membershipType.name,
          legacySessionId: legacyMembershipSession.id,
          legacySessionType: "membership_payment_session",
          ...(legacyMembershipSession.metadata ?? {}),
        },
      })
      .returning();

    await db.insert(checkoutItems).values({
      checkoutSessionId: session.id,
      itemType: "membership_purchase",
      description: membershipType.name,
      quantity: 1,
      amountCents: legacyMembershipSession.amountCents,
      currency: legacyMembershipSession.currency,
      membershipPurchaseId: purchase.id,
      metadata: {
        legacySessionId: legacyMembershipSession.id,
      },
    });
  }

  return { session, legacyType: "membership_payment_session" };
}
