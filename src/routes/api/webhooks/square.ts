import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import {
  checkoutItems,
  checkoutSessions,
  eventRegistrations,
  events,
  membershipPurchases,
  membershipTypes,
  memberships,
} from "~/db/schema";
import { user } from "~/db/schema/auth.schema";
import { finalizeMembershipPurchase } from "~/features/membership/membership.finalize";
import { atomicJsonbMerge } from "~/lib/db/jsonb-utils";
import { assertFeatureEnabled } from "~/tenant/feature-gates";

async function finalizeCheckoutFromWebhook({
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

  const [{ getDb }] = await Promise.all([import("~/db/server-helpers")]);
  const db = await getDb();

  let session = null as typeof checkoutSessions.$inferSelect | null;

  if (paymentId) {
    const [byPaymentId] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.providerPaymentId, paymentId))
      .limit(1);
    session = byPaymentId ?? session;
  }

  if (!session && orderId) {
    const [byOrderId] = await db
      .select()
      .from(checkoutSessions)
      .where(eq(checkoutSessions.providerOrderId, orderId))
      .limit(1);
    session = byOrderId ?? session;
  }

  const now = new Date();

  if (!session) {
    const { ensureLegacyCheckoutSession } =
      await import("~/lib/payments/legacy-checkout");
    const legacyResult = await ensureLegacyCheckoutSession({
      db,
      checkoutId: null,
      paymentId: paymentId ?? null,
      orderId: orderId ?? null,
      now,
    });
    session = legacyResult.session;

    if (legacyResult.legacyType) {
      console.warn("[Square webhook] Legacy checkout session migrated", {
        paymentId,
        orderId,
        eventType,
        legacyType: legacyResult.legacyType,
      });
    }
  }

  if (!session) {
    console.warn("[Square webhook] No checkout session found for finalize", {
      paymentId,
      orderId,
      eventType,
    });
    return;
  }

  const rows = await db
    .select({
      item: checkoutItems,
      registration: eventRegistrations,
      event: events,
      purchase: membershipPurchases,
      membershipType: membershipTypes,
    })
    .from(checkoutItems)
    .leftJoin(
      eventRegistrations,
      eq(checkoutItems.eventRegistrationId, eventRegistrations.id),
    )
    .leftJoin(events, eq(eventRegistrations.eventId, events.id))
    .leftJoin(
      membershipPurchases,
      eq(checkoutItems.membershipPurchaseId, membershipPurchases.id),
    )
    .leftJoin(
      membershipTypes,
      eq(membershipPurchases.membershipTypeId, membershipTypes.id),
    )
    .where(eq(checkoutItems.checkoutSessionId, session.id));

  if (rows.length === 0) {
    console.warn("[Square webhook] No checkout items found for finalize", {
      sessionId: session.id,
      eventType,
    });
    return;
  }

  const nowIso = now.toISOString();
  const paymentIdentifier = paymentId ?? session.providerPaymentId ?? "";

  await db
    .update(checkoutSessions)
    .set({
      status: "completed",
      providerPaymentId: paymentIdentifier || session.providerPaymentId,
      providerOrderId: orderId ?? session.providerOrderId ?? null,
      metadata: atomicJsonbMerge(checkoutSessions.metadata, {
        lastWebhookFinalizeAt: nowIso,
        lastWebhookEvent: eventType,
      }),
      updatedAt: now,
    })
    .where(eq(checkoutSessions.id, session.id));

  for (const row of rows) {
    if (row.registration) {
      const existingMetadata = (row.registration.paymentMetadata ?? {}) as Record<
        string,
        unknown
      >;
      const amountCents = row.item.amountCents * (row.item.quantity ?? 1);

      await db
        .update(eventRegistrations)
        .set({
          paymentStatus: "paid",
          status:
            row.registration.status === "cancelled"
              ? row.registration.status
              : "confirmed",
          paymentCompletedAt: now,
          paymentId: paymentIdentifier,
          amountPaidCents: amountCents,
          paymentMetadata: {
            ...existingMetadata,
            squareTransactionId: paymentIdentifier,
            lastWebhookFinalizeAt: nowIso,
            lastWebhookEvent: eventType,
          },
          updatedAt: now,
        })
        .where(eq(eventRegistrations.id, row.registration.id));
    }

    if (row.purchase && row.membershipType) {
      const finalizeResult = await finalizeMembershipPurchase({
        db,
        purchase: row.purchase,
        membershipType: row.membershipType,
        paymentId: paymentIdentifier,
        orderId: orderId ?? session.providerOrderId ?? null,
        sessionId: session.providerCheckoutId,
        now,
      });

      if (finalizeResult.wasCreated && finalizeResult.membership) {
        const [member] = await db
          .select({
            email: user.email,
            name: user.name,
          })
          .from(user)
          .where(eq(user.id, row.purchase.userId ?? ""))
          .limit(1);

        if (member?.email) {
          try {
            const { sendMembershipPurchaseReceipt } =
              await import("~/lib/email/sendgrid");

            await sendMembershipPurchaseReceipt({
              to: {
                email: member.email,
                name: member.name ?? undefined,
              },
              membershipType: row.membershipType.name,
              amount: row.membershipType.priceCents,
              paymentId: finalizeResult.membership.paymentId ?? paymentIdentifier,
              expiresAt: new Date(finalizeResult.membership.endDate),
            });
          } catch (emailError) {
            console.error("[Square webhook] Failed to send membership receipt", {
              paymentId: paymentIdentifier,
              email: member.email,
              error: emailError,
            });
          }
        }
      }
    }
  }
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

  const now = new Date();
  const nowIso = now.toISOString();

  const [session] = await db
    .select()
    .from(checkoutSessions)
    .where(eq(checkoutSessions.providerPaymentId, paymentId))
    .limit(1);

  let membershipRecord: typeof memberships.$inferSelect | null = null;
  let purchaseRecord: typeof membershipPurchases.$inferSelect | null = null;
  let registrationRecords: Array<typeof eventRegistrations.$inferSelect> = [];

  if (session) {
    const rows = await db
      .select({
        item: checkoutItems,
        registration: eventRegistrations,
        purchase: membershipPurchases,
        membership: memberships,
      })
      .from(checkoutItems)
      .leftJoin(
        eventRegistrations,
        eq(checkoutItems.eventRegistrationId, eventRegistrations.id),
      )
      .leftJoin(
        membershipPurchases,
        eq(checkoutItems.membershipPurchaseId, membershipPurchases.id),
      )
      .leftJoin(memberships, eq(membershipPurchases.membershipId, memberships.id))
      .where(eq(checkoutItems.checkoutSessionId, session.id));

    registrationRecords = rows
      .map((row) => row.registration)
      .filter((row): row is typeof eventRegistrations.$inferSelect => Boolean(row));
    membershipRecord = rows.find((row) => row.membership)?.membership ?? membershipRecord;
    purchaseRecord = rows.find((row) => row.purchase)?.purchase ?? purchaseRecord;

    await db
      .update(checkoutSessions)
      .set({
        status: "refunded",
        metadata: atomicJsonbMerge(checkoutSessions.metadata, {
          lastRefundStatus: status,
          lastRefundId: refundId,
          lastRefundedAt: nowIso,
          lastRefundEvent: eventType,
        }),
        updatedAt: now,
      })
      .where(eq(checkoutSessions.id, session.id));

    for (const registration of registrationRecords) {
      const existingMetadata = (registration.paymentMetadata ?? {}) as Record<
        string,
        unknown
      >;

      await db
        .update(eventRegistrations)
        .set({
          paymentStatus: "refunded",
          paymentMetadata: {
            ...existingMetadata,
            lastRefundStatus: status,
            lastRefundId: refundId,
            lastRefundedAt: nowIso,
            lastRefundEvent: eventType,
          },
          updatedAt: now,
        })
        .where(eq(eventRegistrations.id, registration.id));
    }

    if (purchaseRecord) {
      await db
        .update(membershipPurchases)
        .set({
          status: "refunded",
          metadata: atomicJsonbMerge(membershipPurchases.metadata, {
            lastRefundStatus: status,
            lastRefundId: refundId,
            lastRefundedAt: nowIso,
            lastRefundEvent: eventType,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPurchases.id, purchaseRecord.id));
    }

    if (membershipRecord) {
      await db
        .update(memberships)
        .set({
          status: "cancelled",
          metadata: atomicJsonbMerge(memberships.metadata, {
            lastRefundStatus: status,
            lastRefundId: refundId,
            lastRefundedAt: nowIso,
            lastRefundEvent: eventType,
          }),
          updatedAt: now,
        })
        .where(eq(memberships.id, membershipRecord.id));
    }
  }

  if (!membershipRecord && !purchaseRecord && registrationRecords.length === 0) {
    const [legacyMembership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.paymentId, paymentId))
      .limit(1);

    const [legacyPurchase] = await db
      .select()
      .from(membershipPurchases)
      .where(eq(membershipPurchases.paymentId, paymentId))
      .limit(1);

    membershipRecord = legacyMembership ?? membershipRecord;
    purchaseRecord = legacyPurchase ?? purchaseRecord;

    if (!membershipRecord && !purchaseRecord) {
      console.warn("[Square webhook] Refund received for unknown payment", {
        paymentId,
        refundId,
      });
      return;
    }

    if (membershipRecord) {
      await db
        .update(memberships)
        .set({
          status: "cancelled",
          metadata: atomicJsonbMerge(memberships.metadata, {
            lastRefundStatus: status,
            lastRefundId: refundId,
            lastRefundedAt: nowIso,
            lastRefundEvent: eventType,
          }),
          updatedAt: now,
        })
        .where(eq(memberships.id, membershipRecord.id));
    }

    if (purchaseRecord) {
      await db
        .update(membershipPurchases)
        .set({
          status: "refunded",
          metadata: atomicJsonbMerge(membershipPurchases.metadata, {
            lastRefundStatus: status,
            lastRefundId: refundId,
            lastRefundedAt: nowIso,
            lastRefundEvent: eventType,
          }),
          updatedAt: now,
        })
        .where(eq(membershipPurchases.id, purchaseRecord.id));
    }
  }

  const supportEmail = process.env["SUPPORT_EMAIL"];
  if (!supportEmail) {
    return;
  }

  if (!membershipRecord && !purchaseRecord) {
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
      subject: `Refund processed (${paymentId})`,
      text: `A refund event was received from Square.

Payment ID: ${paymentId}
Refund ID: ${refundId ?? "unknown"}
Status: ${status ?? "unknown"}
Membership ID: ${membershipRecord?.id ?? purchaseRecord?.membershipId ?? "unknown"}
Membership Purchase ID: ${purchaseRecord?.id ?? "unknown"}
User ID: ${membershipRecord?.userId ?? purchaseRecord?.userId ?? "unknown"}
Event Registrations: ${registrationRecords.map((row) => row.id).join(", ") || "none"}
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
  finalizeCheckoutFromWebhook,
  handleRefundEvent,
};

export const Route = createFileRoute("/api/webhooks/square")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        await assertFeatureEnabled("payments_square");
        try {
          // Get the raw body for signature verification
          const body = await request.text();

          // Get the signature from headers
          const signature = request.headers.get("x-square-signature") || "";

          if (!signature) {
            console.error("Missing Square webhook signature");
            return Response.json({ error: "Missing signature" }, { status: 401 });
          }

          // Parse the body
          let payload: unknown;
          try {
            payload = JSON.parse(body);
          } catch (error) {
            console.error("Invalid webhook payload:", error);
            return Response.json({ error: "Invalid payload" }, { status: 400 });
          }

          // Get the payment service and verify the webhook
          const { getSquarePaymentService } = await import("~/lib/payments/square");
          const paymentService = await getSquarePaymentService();
          const { valid, event, error } = await paymentService.verifyAndParseWebhook(
            payload,
            signature,
          );

          if (!valid) {
            console.error("Webhook verification failed:", error);
            return Response.json(
              { error: error || "Verification failed" },
              { status: 401 },
            );
          }

          if (!event) {
            console.error("No event parsed from webhook");
            return Response.json({ error: "No event parsed" }, { status: 400 });
          }

          // Handle normalized event types
          switch (event.type) {
            case "payment.success": {
              console.log("[Square webhook] Payment success:", {
                paymentId: event.paymentId,
                orderId: event.orderId,
                amount: event.amount,
              });

              await finalizeCheckoutFromWebhook({
                paymentId: event.paymentId,
                orderId: event.orderId,
                eventType: event.rawType,
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
          return Response.json({ received: true });
        } catch (error) {
          console.error("Webhook handler error:", error);
          return Response.json({ error: "Internal server error" }, { status: 500 });
        }
      },
    },
  },
});
