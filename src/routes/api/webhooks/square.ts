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
import { getSquarePaymentService } from "~/lib/payments/square";

const PAYMENT_SUCCESS_STATUSES = new Set(["COMPLETED", "APPROVED"]);
const PAYMENT_CANCELLED_STATUSES = new Set([
  "CANCELED",
  "CANCELED_BY_CUSTOMER",
  "FAILED",
]);

function normalizeSquareStatus(status: string | undefined | null) {
  return (status ?? "").toUpperCase();
}

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

  const now = new Date();
  const finalizeResult = await finalizeMembershipForSession({
    db,
    paymentSession: session,
    membershipType,
    paymentId: paymentId ?? session.squarePaymentId ?? "",
    orderId: orderId ?? session.squareOrderId ?? null,
    sessionId: session.squareCheckoutId,
    now,
  });

  const [freshSession] = await db
    .select()
    .from(membershipPaymentSessions)
    .where(eq(membershipPaymentSessions.id, session.id))
    .limit(1);

  const sessionMetadata = freshSession?.metadata ?? session.metadata ?? {};

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
      metadata: {
        ...sessionMetadata,
        membershipId: finalizeResult.membership.id,
        lastWebhookFinalizeAt: now.toISOString(),
        lastWebhookEvent: eventType,
      },
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
      metadata: {
        ...(session.metadata ?? {}),
        lastWebhookFinalizeAt: nowIso,
        lastWebhookEvent: eventType,
      },
      updatedAt: now,
    })
    .where(eq(eventPaymentSessions.id, session.id));

  const existingMetadata = (registration.paymentMetadata ?? {}) as Record<
    string,
    unknown
  >;

  await db
    .update(eventRegistrations)
    .set({
      paymentStatus: "paid",
      status: registration.status === "cancelled" ? registration.status : "confirmed",
      paymentCompletedAt: now,
      paymentId: paymentIdentifier,
      amountPaidCents: resolvedAmount,
      paymentMetadata: {
        ...existingMetadata,
        squareTransactionId: paymentIdentifier,
        lastWebhookFinalizeAt: nowIso,
        lastWebhookEvent: eventType,
      },
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
      metadata: {
        ...(membershipRecord.metadata ?? {}),
        lastRefundStatus: status,
        lastRefundId: refundId,
        lastRefundedAt: nowIso,
      },
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
  normalizeSquareStatus,
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

          // Get the payment service
          const paymentService = await getSquarePaymentService();

          // Process the webhook
          const result = await paymentService.processWebhook(payload, signature);

          if (!result.processed) {
            console.error("Failed to process webhook:", result.error);
            return json({ error: result.error || "Processing failed" }, { status: 400 });
          }

          // Handle specific event types
          const event = payload as { type: string; data: unknown };
          const eventType = event.type;
          const eventData = event.data as Record<string, unknown>;

          switch (eventType) {
            case "payment.created":
            case "payment.updated": {
              // Extract payment information
              const paymentObj = eventData?.["object"] as
                | Record<string, unknown>
                | undefined;
              const payment = paymentObj?.["payment"] as
                | Record<string, unknown>
                | undefined;
              if (!payment) break;

              const orderId = payment["order_id"] as string | undefined;
              const paymentId = payment["id"] as string | undefined;
              const statusRaw = payment["status"] as string | undefined;
              const status = normalizeSquareStatus(statusRaw);
              const amountMoney = payment["amount_money"] as
                | Record<string, unknown>
                | undefined;
              const amount = amountMoney?.["amount"] as number | undefined;

              console.log("Payment webhook received:", {
                orderId,
                paymentId,
                status,
                amount,
              });

              if (PAYMENT_SUCCESS_STATUSES.has(status)) {
                await finalizeMembershipFromWebhook({
                  paymentId,
                  orderId,
                  eventType,
                });
                await finalizeEventRegistrationFromWebhook({
                  paymentId,
                  orderId,
                  eventType,
                  amount,
                });
              } else if (PAYMENT_CANCELLED_STATUSES.has(status)) {
                console.warn("[Square webhook] Payment moved to cancelled state", {
                  paymentId,
                  orderId,
                  status,
                });
              }

              break;
            }

            case "refund.created":
            case "refund.updated": {
              // Handle refund events
              const refundObj = eventData?.["object"] as
                | Record<string, unknown>
                | undefined;
              const refund = refundObj?.["refund"] as Record<string, unknown> | undefined;
              if (!refund) break;

              const refundId = refund["id"] as string | undefined;
              const paymentId = refund["payment_id"] as string | undefined;
              const status = normalizeSquareStatus(
                refund["status"] as string | undefined,
              );
              const amountMoney = refund["amount_money"] as
                | Record<string, unknown>
                | undefined;
              const amount = amountMoney?.["amount"] as number | undefined;

              console.log("Refund webhook received:", {
                refundId,
                paymentId,
                status,
                amount,
              });

              await handleRefundEvent({
                paymentId,
                refundId,
                status,
                eventType,
              });

              break;
            }

            default:
              console.log("Unhandled webhook event type:", eventType);
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
