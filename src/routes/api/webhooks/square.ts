import { createFileRoute } from "@tanstack/react-router";
import { json } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import {
  eventPaymentSessions,
  eventRegistrations,
  events,
  membershipPaymentSessions,
  membershipTypes,
  memberships,
} from "~/db/schema";
import { user } from "~/db/schema/auth.schema";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";
import { getSquarePaymentService } from "~/lib/payments/square";

async function finalizeMembershipFromWebhook({
  paymentId,
  orderId,
  eventType,
}: {
  paymentId: string | undefined;
  orderId: string | undefined;
  eventType: string;
}) {
  if (!paymentId && !orderId) {
    console.warn("[Square webhook] Missing payment identifiers for finalize", {
      eventType,
    });
    return;
  }

  const [{ getDb }, { finalizeMembershipForSession }] = await Promise.all([
    import("~/db/server-helpers"),
    import("~/features/membership/membership.finalize"),
  ]);

  const db = await getDb();

  let session = null as typeof membershipPaymentSessions.$inferSelect | null;

  if (paymentId) {
    const [byPaymentId] = await db
      .select()
      .from(membershipPaymentSessions)
      .where(eq(membershipPaymentSessions.squarePaymentId, paymentId))
      .limit(1);
    session = byPaymentId ?? session;
  }

  if (!session && orderId) {
    const [byOrderId] = await db
      .select()
      .from(membershipPaymentSessions)
      .where(eq(membershipPaymentSessions.squareOrderId, orderId))
      .limit(1);
    session = byOrderId ?? session;
  }

  if (!session) {
    console.warn("[Square webhook] No payment session found for finalize", {
      paymentId,
      orderId,
      eventType,
    });
    return;
  }

  const [membershipType] = await db
    .select()
    .from(membershipTypes)
    .where(eq(membershipTypes.id, session.membershipTypeId))
    .limit(1);

  if (!membershipType) {
    console.error("[Square webhook] Membership type missing during finalize", {
      membershipTypeId: session.membershipTypeId,
      sessionId: session.id,
    });
    return;
  }

  // Ensure we have a valid payment ID before finalizing
  const resolvedPaymentId = paymentId ?? session.squarePaymentId;
  if (!resolvedPaymentId) {
    console.warn("[Square webhook] Skipping finalize - missing paymentId", {
      orderId,
      sessionId: session.id,
      eventType,
    });
    return;
  }

  const now = new Date();
  const finalizeResult = await finalizeMembershipForSession({
    db,
    paymentSession: session,
    membershipType,
    paymentId: resolvedPaymentId,
    orderId: orderId ?? session.squareOrderId ?? null,
    sessionId: session.squareCheckoutId,
    now,
  });

  const [{ sendMembershipPurchaseReceipt }] = await Promise.all([
    import("~/lib/email/sendgrid"),
  ]);

  if (finalizeResult.wasCreated) {
    const [member] = await db
      .select({
        email: user.email,
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, session.userId))
      .limit(1);

    if (member?.email) {
      try {
        await sendMembershipPurchaseReceipt({
          to: {
            email: member.email,
            name: member.name ?? undefined,
          },
          membershipType: membershipType.name,
          amount: membershipType.priceCents,
          paymentId: finalizeResult.membership.paymentId ?? paymentId ?? "",
          expiresAt: new Date(finalizeResult.membership.endDate),
        });
      } catch (emailError) {
        console.error("[Square webhook] Failed to send membership receipt", {
          paymentId,
          email: member.email,
          error: emailError,
        });
      }
    }
  }

  await db
    .update(membershipPaymentSessions)
    .set({
      metadata: atomicJsonbMerge(membershipPaymentSessions.metadata, {
        membershipId: finalizeResult.membership.id,
        lastWebhookFinalizeAt: now.toISOString(),
        lastWebhookEvent: eventType,
      }),
      updatedAt: now,
    })
    .where(eq(membershipPaymentSessions.id, session.id));
}

async function finalizeEventRegistrationFromWebhook({
  paymentId,
  orderId,
  eventType,
  amount,
}: {
  paymentId: string | undefined;
  orderId: string | undefined;
  eventType: string;
  amount: number | undefined;
}) {
  if (!paymentId && !orderId) {
    return;
  }

  const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
  const db = await getDb();

  let session = null as typeof eventPaymentSessions.$inferSelect | null;

  if (paymentId) {
    const [byPaymentId] = await db
      .select()
      .from(eventPaymentSessions)
      .where(eq(eventPaymentSessions.squarePaymentId, paymentId))
      .limit(1);
    session = byPaymentId ?? session;
  }

  if (!session && orderId) {
    const [byOrderId] = await db
      .select()
      .from(eventPaymentSessions)
      .where(eq(eventPaymentSessions.squareOrderId, orderId))
      .limit(1);
    session = byOrderId ?? session;
  }

  if (!session) {
    return;
  }

  const [registrationResult] = await db
    .select({
      registration: eventRegistrations,
      event: events,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.id, session.registrationId))
    .limit(1);

  if (!registrationResult) {
    console.warn("[Square webhook] Event registration not found for payment", {
      registrationId: session.registrationId,
      paymentId,
      orderId,
    });
    return;
  }

  const { registration, event } = registrationResult;

  const now = new Date();
  const nowIso = now.toISOString();
  const paymentIdentifier = paymentId ?? session.squarePaymentId ?? "";
  const resolvedAmount = typeof amount === "number" ? amount : session.amountCents;

  await db
    .update(eventPaymentSessions)
    .set({
      status: "completed",
      squarePaymentId: paymentIdentifier,
      metadata: atomicJsonbMerge(eventPaymentSessions.metadata, {
        lastWebhookFinalizeAt: nowIso,
        lastWebhookEvent: eventType,
      }),
      updatedAt: now,
    })
    .where(eq(eventPaymentSessions.id, session.id));

  await db
    .update(eventRegistrations)
    .set({
      paymentStatus: "paid",
      status: registration.status === "cancelled" ? registration.status : "confirmed",
      paymentCompletedAt: now,
      paymentId: paymentIdentifier,
      amountPaidCents: resolvedAmount,
      paymentMetadata: atomicJsonbMerge(eventRegistrations.paymentMetadata, {
        squareTransactionId: paymentIdentifier,
        lastWebhookFinalizeAt: nowIso,
        lastWebhookEvent: eventType,
      }),
      updatedAt: now,
    })
    .where(eq(eventRegistrations.id, registration.id));

  console.log("[Square webhook] Event registration finalized", {
    registrationId: registration.id,
    eventId: event.id,
    paymentId: paymentIdentifier,
    amount: resolvedAmount,
  });
}

async function handleRefundEvent({
  paymentId,
  refundId,
  status,
  eventType,
}: {
  paymentId: string | undefined;
  refundId: string | undefined;
  status: string | undefined;
  eventType: string;
}) {
  if (!paymentId) {
    console.warn("[Square webhook] Refund event missing payment id", { eventType });
    return;
  }

  const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
  const db = await getDb();

  const [membershipRecord] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.paymentId, paymentId))
    .limit(1);

  if (!membershipRecord) {
    console.warn("[Square webhook] Refund received for unknown membership", {
      paymentId,
      refundId,
    });
    return;
  }

  const now = new Date();
  const nowIso = now.toISOString();

  await db
    .update(memberships)
    .set({
      status: "cancelled",
      metadata: atomicJsonbMerge(memberships.metadata, {
        lastRefundStatus: status,
        lastRefundId: refundId,
        lastRefundedAt: nowIso,
      }),
      updatedAt: now,
    })
    .where(eq(memberships.id, membershipRecord.id));

  const supportEmail = process.env["SUPPORT_EMAIL"];
  if (!supportEmail) {
    return;
  }

  try {
    const [{ getEmailService }] = await Promise.all([import("~/lib/email/sendgrid")]);
    const emailService = await getEmailService();
    const fromEmail = process.env["SENDGRID_FROM_EMAIL"] || "noreply@quadballcanada.com";
    const fromName = process.env["SENDGRID_FROM_NAME"] || "Quadball Canada";

    await emailService.send({
      to: { email: supportEmail },
      from: { email: fromEmail, name: fromName },
      subject: `Membership refund processed (${paymentId})`,
      text: `A refund event was received from Square.

Payment ID: ${paymentId}
Refund ID: ${refundId ?? "unknown"}
Status: ${status ?? "unknown"}
Membership ID: ${membershipRecord.id}
User ID: ${membershipRecord.userId}
Event Type: ${eventType}
Processed At: ${nowIso}
`,
    });
  } catch (emailError) {
    console.error("[Square webhook] Failed to send refund notification", {
      paymentId,
      refundId,
      error: emailError,
    });
  }
}

export const __squareWebhookTestUtils = {
  finalizeMembershipFromWebhook,
  finalizeEventRegistrationFromWebhook,
  handleRefundEvent,
};

export const Route = createFileRoute("/api/webhooks/square")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Get the raw body for signature verification
          const body = await request.text();

          // Get the signature from headers
          const signature = request.headers.get("x-square-signature") || "";

          if (!signature) {
            console.error("Missing Square webhook signature");
            return json({ error: "Missing signature" }, { status: 401 });
          }

          // Parse the body
          let payload: unknown;
          try {
            payload = JSON.parse(body);
          } catch (error) {
            console.error("Invalid webhook payload:", error);
            return json({ error: "Invalid payload" }, { status: 400 });
          }

          // Get the payment service and verify the webhook
          const paymentService = await getSquarePaymentService();
          const { valid, event, error } = await paymentService.verifyAndParseWebhook(
            payload,
            signature,
          );

          if (!valid) {
            console.error("Webhook verification failed:", error);
            return json({ error: error || "Verification failed" }, { status: 401 });
          }

          if (!event) {
            console.error("No event parsed from webhook");
            return json({ error: "No event parsed" }, { status: 400 });
          }

          // Handle normalized event types
          switch (event.type) {
            case "payment.success": {
              console.log("[Square webhook] Payment success:", {
                paymentId: event.paymentId,
                orderId: event.orderId,
                amount: event.amount,
              });

              await finalizeMembershipFromWebhook({
                paymentId: event.paymentId,
                orderId: event.orderId,
                eventType: event.rawType,
              });
              await finalizeEventRegistrationFromWebhook({
                paymentId: event.paymentId,
                orderId: event.orderId,
                eventType: event.rawType,
                amount: event.amount,
              });
              break;
            }

            case "payment.failed":
            case "payment.cancelled": {
              console.warn("[Square webhook] Payment not successful:", {
                type: event.type,
                paymentId: event.paymentId,
                orderId: event.orderId,
                status: event.status,
              });
              break;
            }

            case "refund": {
              console.log("[Square webhook] Refund received:", {
                refundId: event.refundId,
                paymentId: event.paymentId,
                status: event.status,
                amount: event.amount,
              });

              await handleRefundEvent({
                paymentId: event.paymentId,
                refundId: event.refundId,
                status: event.status,
                eventType: event.rawType,
              });
              break;
            }

            case "unknown":
            default:
              console.log("[Square webhook] Unhandled event type:", event.rawType);
          }

          // Return success
          return json({ received: true });
        } catch (error) {
          console.error("Webhook handler error:", error);
          return json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
