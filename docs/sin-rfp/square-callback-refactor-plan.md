# Square Callback Refactor Plan (Checkout Sessions)

**Date:** 2025-12-29
**Target:** `src/routes/api/payments/square/callback.ts`
**Goal:** Process unified checkout sessions and line items (event registrations +
membership purchases).

## Summary

Replace the current "membership first, else event" lookup with a single
`checkout_sessions` lookup by `provider_checkout_id`. Process each checkout
item to finalize registrations and memberships in one pass.

## Pseudocode (Aligned to Current Route)

```ts
// 1) Parse query params -> checkoutId, success, paymentId, orderId
// 2) Look up checkout session by provider_checkout_id
const session = await db
  .select()
  .from(checkoutSessions)
  .where(eq(checkoutSessions.providerCheckoutId, checkoutId))
  .limit(1);

if (!session) {
  // During transition, attempt to migrate legacy sessions into checkout_sessions.
  session = await ensureLegacyCheckoutSession({ checkoutId, paymentId, orderId });
  if (!session) throw notFound();
}

// 3) Verify payment with Square, update checkout session status
const payment = await squareService.verifyPayment({
  checkoutId,
  paymentId,
  orderId,
});

await db
  .update(checkoutSessions)
  .set({
    status: "completed",
    providerOrderId: payment.orderId,
    providerPaymentId: payment.paymentId,
    metadata: atomicJsonbMerge(checkoutSessions.metadata, {
      square: payment.raw,
    }),
  })
  .where(eq(checkoutSessions.id, session.id));

// 4) Load checkout items
const items = await db
  .select()
  .from(checkoutItems)
  .where(eq(checkoutItems.checkoutSessionId, session.id));

// 5) Process each item
for (const item of items) {
  if (item.itemType === "event_registration") {
    await db
      .update(eventRegistrations)
      .set({
        paymentStatus: "paid",
        status: "confirmed",
        paymentId: payment.paymentId,
        paymentCompletedAt: new Date(),
      })
      .where(eq(eventRegistrations.id, item.eventRegistrationId));
  }

  if (item.itemType === "membership_purchase") {
    // Annual membership: create memberships row and attach membership_purchases
    // Day pass: create membership_purchases row scoped to event_id
    await finalizeMembershipFromCheckoutItem({
      checkoutItemId: item.id,
      payment,
    });
  }
}

// 6) Redirect to a unified success page
return redirect({ to: "/dashboard/payments/complete", search: { session: session.id } });
```

## Notes

- The `finalizeMembershipFromCheckoutItem` helper should be idempotent, similar
  to the current `membership.finalize` path.
- `checkout_items` is the source of truth for what to finalize; legacy tables
  should only be used for migration shims, not active flows.
- For failures, set `checkout_sessions.status = "failed"` and expose a retry
  path.
