import { eq } from "drizzle-orm";
import type {
  Membership,
  MembershipPaymentSession,
  MembershipType,
} from "~/db/schema/membership.schema";
import { membershipPaymentSessions, memberships } from "~/db/schema/membership.schema";
import type { getDb } from "~/db/server-helpers";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";

export type MembershipPaymentSessionRow = MembershipPaymentSession;
export type MembershipTypeRow = MembershipType;
export type MembershipRow = Membership;

export type MembershipDbClient = Awaited<ReturnType<typeof getDb>>;

export interface FinalizeMembershipParams {
  db: MembershipDbClient;
  paymentSession: MembershipPaymentSessionRow;
  membershipType: MembershipTypeRow;
  paymentId: string;
  orderId?: string | null;
  sessionId: string;
  now: Date;
}

export interface FinalizeMembershipResult {
  membership: MembershipRow;
  wasCreated: boolean;
}

export async function finalizeMembershipForSession({
  db,
  paymentSession,
  membershipType,
  paymentId,
  orderId,
  sessionId,
  now,
}: FinalizeMembershipParams): Promise<FinalizeMembershipResult> {
  const nowIso = now.toISOString();
  const resolvedOrderId = orderId ?? paymentSession.squareOrderId ?? null;

  return db.transaction(async (tx) => {
    const [existingMembershipByPayment] = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, paymentId))
      .limit(1);

    if (existingMembershipByPayment) {
      await tx
        .update(membershipPaymentSessions)
        .set({
          status: "completed",
          squarePaymentId: paymentId,
          squareOrderId: resolvedOrderId,
          metadata: atomicJsonbMerge(membershipPaymentSessions.metadata, {
            membershipId: existingMembershipByPayment.id,
            paymentConfirmedAt: nowIso,
            squareOrderId: resolvedOrderId,
            squareTransactionId: paymentId,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPaymentSessions.id, paymentSession.id));

      return {
        membership: existingMembershipByPayment,
        wasCreated: false,
      } satisfies FinalizeMembershipResult;
    }

    const startDate = new Date(now);
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + membershipType.durationMonths);

    const membershipMetadata: Record<string, unknown> = {
      ...(paymentSession.metadata ?? {}),
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
        userId: paymentSession.userId,
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
      .update(membershipPaymentSessions)
      .set({
        status: "completed",
        squarePaymentId: paymentId,
        squareOrderId: resolvedOrderId,
        metadata: atomicJsonbMerge(membershipPaymentSessions.metadata, {
          membershipId: newMembership.id,
          paymentConfirmedAt: nowIso,
          squareOrderId: resolvedOrderId,
          squareTransactionId: paymentId,
        }),
        updatedAt: now,
      })
      .where(eq(membershipPaymentSessions.id, paymentSession.id));

    return {
      membership: newMembership,
      wasCreated: true,
    } satisfies FinalizeMembershipResult;
  });
}
