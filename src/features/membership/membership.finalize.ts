import { eq } from "drizzle-orm";
import type { Membership, MembershipType } from "~/db/schema";
import { membershipPurchases, memberships } from "~/db/schema";
import type { getDb } from "~/db/server-helpers";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";

export type MembershipTypeRow = MembershipType;
export type MembershipRow = Membership;
export type MembershipPurchaseRow = typeof membershipPurchases.$inferSelect;

export type MembershipDbClient = Awaited<ReturnType<typeof getDb>>;

export interface FinalizeMembershipPurchaseParams {
  db: MembershipDbClient;
  purchase: MembershipPurchaseRow;
  membershipType: MembershipTypeRow;
  paymentId: string;
  orderId?: string | null;
  sessionId: string;
  now: Date;
}

export interface FinalizeMembershipPurchaseResult {
  membership: MembershipRow | null;
  wasCreated: boolean;
}

export async function finalizeMembershipPurchase({
  db,
  purchase,
  membershipType,
  paymentId,
  orderId,
  sessionId,
  now,
}: FinalizeMembershipPurchaseParams): Promise<FinalizeMembershipPurchaseResult> {
  const nowIso = now.toISOString();
  const resolvedOrderId = orderId ?? null;

  return db.transaction(async (tx) => {
    if (purchase.eventId) {
      await tx
        .update(membershipPurchases)
        .set({
          status: "active",
          paymentProvider: "square",
          paymentId,
          metadata: atomicJsonbMerge(membershipPurchases.metadata, {
            sessionId,
            paymentConfirmedAt: nowIso,
            squareOrderId: resolvedOrderId,
            squareTransactionId: paymentId,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPurchases.id, purchase.id));

      return {
        membership: null,
        wasCreated: false,
      } satisfies FinalizeMembershipPurchaseResult;
    }

    const [existingMembershipByPayment] = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, paymentId))
      .limit(1);

    if (existingMembershipByPayment) {
      await tx
        .update(membershipPurchases)
        .set({
          status: "active",
          membershipId: existingMembershipByPayment.id,
          paymentProvider: "square",
          paymentId,
          metadata: atomicJsonbMerge(membershipPurchases.metadata, {
            membershipId: existingMembershipByPayment.id,
            paymentConfirmedAt: nowIso,
            squareOrderId: resolvedOrderId,
            squareTransactionId: paymentId,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPurchases.id, purchase.id));

      return {
        membership: existingMembershipByPayment,
        wasCreated: false,
      } satisfies FinalizeMembershipPurchaseResult;
    }

    if (!purchase.userId) {
      await tx
        .update(membershipPurchases)
        .set({
          status: "cancelled",
          metadata: atomicJsonbMerge(membershipPurchases.metadata, {
            lastError: "Missing user for membership purchase",
            lastErrorAt: nowIso,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPurchases.id, purchase.id));

      return {
        membership: null,
        wasCreated: false,
      } satisfies FinalizeMembershipPurchaseResult;
    }

    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + membershipType.durationMonths);

    const membershipMetadata: Record<string, unknown> = {
      ...purchase.metadata,
      sessionId,
      purchasedAt: nowIso,
      squareTransactionId: paymentId,
    };

    if (resolvedOrderId) {
      membershipMetadata["squareOrderId"] = resolvedOrderId;
    }

    const [newMembership] = await tx
      .insert(memberships)
      .values({
        userId: purchase.userId,
        membershipTypeId: membershipType.id,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        status: "active",
        paymentProvider: "square",
        paymentId,
        metadata: membershipMetadata,
      })
      .returning();

    await tx
      .update(membershipPurchases)
      .set({
        status: "active",
        membershipId: newMembership.id,
        paymentProvider: "square",
        paymentId,
        metadata: atomicJsonbMerge(membershipPurchases.metadata, {
          membershipId: newMembership.id,
          paymentConfirmedAt: nowIso,
          squareOrderId: resolvedOrderId,
          squareTransactionId: paymentId,
        }),
        updatedAt: now,
      })
      .where(eq(membershipPurchases.id, purchase.id));

    return {
      membership: newMembership,
      wasCreated: true,
    } satisfies FinalizeMembershipPurchaseResult;
  });
}
