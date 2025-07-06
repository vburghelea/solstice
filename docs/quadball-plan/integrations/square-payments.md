# Square Payment Integration Guide

## Overview

Square provides a comprehensive payment processing solution with excellent Canadian support. This guide covers the integration approach for the Quadball Canada platform.

## Integration Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Client App    │────▶│  Server Function │────▶│   Square API    │
│                 │     │                  │     │                 │
│ - Select items  │     │ - Create order   │     │ - Process pay   │
│ - Choose method │     │ - Generate link  │     │ - Send webhook  │
│ - E-transfer    │     │ - Handle manual  │     │ - Card process  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │    Database      │◀────│ Webhook Handler │
                        │                  │     │                 │
                        │ - Payment record │     │ - Verify sig    │
                        │ - Update status  │     │ - Update DB     │
                        └──────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │ E-transfer Flow  │
                        │                  │
                        │ - Manual email   │
                        │ - Admin confirm  │
                        └──────────────────┘
```

## Setup & Configuration

### 1. Square Account Setup

```typescript
// src/lib/payments/square.config.ts
export const squareConfig = {
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
  applicationId: process.env.SQUARE_APPLICATION_ID,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  locationId: process.env.SQUARE_LOCATION_ID,
  webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
};
```

### 2. Square Client Initialization

```typescript
// src/lib/payments/square.client.ts
import { Client, Environment } from "square";

export const squareClient = new Client({
  accessToken: squareConfig.accessToken,
  environment:
    squareConfig.environment === "production"
      ? Environment.Production
      : Environment.Sandbox,
});

export const { checkoutApi, paymentsApi, refundsApi, customersApi, webhooksApi } =
  squareClient;
```

## Payment Flow Implementation

### 1. Create Checkout Session

```typescript
// src/lib/payments/square.service.ts
export async function createCheckoutSession({
  userId,
  items,
  returnUrl,
  metadata,
}: CreateCheckoutParams) {
  // Create line items
  const lineItems = items.map((item) => ({
    name: item.description,
    quantity: String(item.quantity),
    basePriceMoney: {
      amount: BigInt(item.unitPriceCents),
      currency: "CAD",
    },
  }));

  // Create order
  const orderRequest = {
    order: {
      locationId: squareConfig.locationId,
      lineItems,
      metadata: {
        userId,
        ...metadata,
      },
    },
    idempotencyKey: crypto.randomUUID(),
  };

  const { result: orderResult } = await checkoutApi.createOrder(orderRequest);

  // Create payment link
  const paymentLinkRequest = {
    paymentLink: {
      orderId: orderResult.order.id,
      checkoutOptions: {
        redirectUrl: returnUrl,
        acceptedPaymentMethods: {
          applePay: true,
          googlePay: true,
          cashApp: true,
          afterpayClearpay: false,
        },
      },
    },
    idempotencyKey: crypto.randomUUID(),
  };

  const { result: linkResult } = await checkoutApi.createPaymentLink(paymentLinkRequest);

  return {
    checkoutUrl: linkResult.paymentLink.url,
    orderId: orderResult.order.id,
    paymentLinkId: linkResult.paymentLink.id,
  };
}
```

### 2. Handle Membership Purchase

```typescript
// src/features/membership/membership.service.ts
export async function purchaseMembership({
  userId,
  membershipTypeId,
}: PurchaseMembershipParams) {
  // Get membership type and pricing
  const membershipType = await getMembershipType(membershipTypeId);
  const pricing = await calculatePricing(userId, membershipType);

  // Create payment record
  const payment = await db
    .insert(payments)
    .values({
      userId,
      amountCents: pricing.finalPrice,
      currency: "CAD",
      status: "pending",
      providerId: "square",
    })
    .returning();

  // Create payment items
  await db.insert(paymentItems).values({
    paymentId: payment[0].id,
    itemType: "membership",
    itemId: membershipTypeId,
    description: membershipType.name,
    quantity: 1,
    unitPriceCents: pricing.finalPrice,
    totalPriceCents: pricing.finalPrice,
  });

  // Create Square checkout
  const checkout = await createCheckoutSession({
    userId,
    items: [
      {
        description: membershipType.name,
        quantity: 1,
        unitPriceCents: pricing.finalPrice,
      },
    ],
    returnUrl: `${process.env.VITE_BASE_URL}/payments/success`,
    metadata: {
      paymentId: payment[0].id,
      membershipTypeId,
    },
  });

  // Update payment with Square IDs
  await db
    .update(payments)
    .set({
      providerOrderId: checkout.orderId,
      checkoutUrl: checkout.checkoutUrl,
    })
    .where(eq(payments.id, payment[0].id));

  return {
    paymentId: payment[0].id,
    checkoutUrl: checkout.checkoutUrl,
  };
}
```

### 3. Handle Event Registration with Payment

```typescript
// src/features/events/registration.service.ts
export async function registerForEvent({
  userId,
  eventId,
  teamId,
  registrationData,
}: RegisterEventParams) {
  const event = await getEvent(eventId);
  const user = await getUserWithMembership(userId);

  // Check if membership required
  const items = [];
  let totalCents = 0;

  // Add event fee
  if (event.feeCents > 0) {
    items.push({
      description: `Registration: ${event.name}`,
      quantity: 1,
      unitPriceCents: event.feeCents,
    });
    totalCents += event.feeCents;
  }

  // Add membership if needed
  if (event.requiresMembership && !user.hasActiveMembership) {
    const membershipType = await getCurrentMembershipType();
    items.push({
      description: membershipType.name,
      quantity: 1,
      unitPriceCents: membershipType.priceCents,
    });
    totalCents += membershipType.priceCents;
  }

  // Create registration
  const registration = await db
    .insert(eventRegistrations)
    .values({
      eventId,
      userId,
      teamId,
      registrationData,
      status: totalCents > 0 ? "pending_payment" : "confirmed",
    })
    .returning();

  // If payment required
  if (totalCents > 0) {
    const checkout = await createCheckoutWithItems({
      userId,
      items,
      metadata: {
        registrationId: registration[0].id,
        eventId,
      },
    });

    return {
      registrationId: registration[0].id,
      requiresPayment: true,
      checkoutUrl: checkout.checkoutUrl,
    };
  }

  return {
    registrationId: registration[0].id,
    requiresPayment: false,
  };
}
```

## Webhook Handler

### 1. Webhook Endpoint Setup

```typescript
// src/routes/api/webhooks/square.ts
import { createAPIFileRoute } from "@tanstack/start/api";
import { verifyWebhookSignature } from "~/lib/payments/square.utils";

export const Route = createAPIFileRoute("/api/webhooks/square")({
  POST: async ({ request }) => {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get("x-square-signature");

    // Verify webhook signature
    const isValid = await verifyWebhookSignature({
      body,
      signature,
      webhookSignatureKey: squareConfig.webhookSignatureKey,
    });

    if (!isValid) {
      return new Response("Invalid signature", { status: 401 });
    }

    // Parse event
    const event = JSON.parse(body);

    // Process webhook
    try {
      await processWebhookEvent(event);
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("Webhook processing error:", error);
      return new Response("Processing error", { status: 500 });
    }
  },
});
```

### 2. Webhook Processing

```typescript
// src/lib/payments/webhook.processor.ts
export async function processWebhookEvent(event: SquareWebhookEvent) {
  // Store webhook event
  await db.insert(webhookEvents).values({
    provider: "square",
    eventType: event.type,
    eventId: event.event_id,
    payload: event,
    status: "processing",
  });

  try {
    switch (event.type) {
      case "payment.created":
        await handlePaymentCreated(event.data);
        break;

      case "payment.updated":
        await handlePaymentUpdated(event.data);
        break;

      case "order.updated":
        await handleOrderUpdated(event.data);
        break;

      case "refund.created":
        await handleRefundCreated(event.data);
        break;

      default:
        console.log(`Unhandled webhook type: ${event.type}`);
    }

    // Mark as processed
    await db
      .update(webhookEvents)
      .set({ status: "completed", processedAt: new Date() })
      .where(eq(webhookEvents.eventId, event.event_id));
  } catch (error) {
    // Mark as failed
    await db
      .update(webhookEvents)
      .set({
        status: "failed",
        errorMessage: error.message,
        retryCount: sql`retry_count + 1`,
      })
      .where(eq(webhookEvents.eventId, event.event_id));

    throw error;
  }
}
```

### 3. Payment Status Updates

```typescript
// src/lib/payments/handlers.ts
async function handlePaymentUpdated(data: SquarePayment) {
  const { payment } = data;

  // Find our payment record
  const paymentRecord = await db.query.payments.findFirst({
    where: eq(payments.providerPaymentId, payment.id),
  });

  if (!paymentRecord) {
    console.error(`Payment not found: ${payment.id}`);
    return;
  }

  // Update payment status
  const newStatus = mapSquareStatus(payment.status);
  await db
    .update(payments)
    .set({
      status: newStatus,
      providerPaymentId: payment.id,
      receiptUrl: payment.receipt_url,
      metadata: {
        ...paymentRecord.metadata,
        squarePayment: payment,
      },
    })
    .where(eq(payments.id, paymentRecord.id));

  // Handle successful payment
  if (newStatus === "completed") {
    await processSuccessfulPayment(paymentRecord.id);
  }
}

async function processSuccessfulPayment(paymentId: string) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      items: true,
    },
  });

  // Process each item
  for (const item of payment.items) {
    switch (item.itemType) {
      case "membership":
        await activateMembership({
          userId: payment.userId,
          membershipTypeId: item.itemId,
          paymentId,
        });
        break;

      case "event_fee":
        await confirmEventRegistration({
          registrationId: item.itemId,
          paymentId,
        });
        break;
    }
  }

  // Send confirmation email
  await sendPaymentConfirmation({
    userId: payment.userId,
    paymentId,
    receiptUrl: payment.receiptUrl,
  });
}
```

## Refund Processing

```typescript
// src/lib/payments/refunds.ts
export async function processRefund({ paymentId, amountCents, reason }: RefundParams) {
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
  });

  if (!payment.providerPaymentId) {
    throw new Error("Cannot refund - no provider payment ID");
  }

  // Create Square refund
  const refundRequest = {
    refund: {
      paymentId: payment.providerPaymentId,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: "CAD",
      },
      reason,
    },
    idempotencyKey: crypto.randomUUID(),
  };

  const { result } = await refundsApi.refundPayment(refundRequest);

  // Update payment status
  await db
    .update(payments)
    .set({
      status: "refunded",
      metadata: {
        ...payment.metadata,
        refund: {
          id: result.refund.id,
          amount: amountCents,
          reason,
          timestamp: new Date(),
        },
      },
    })
    .where(eq(payments.id, paymentId));

  // Handle refund side effects
  await handleRefundSideEffects(payment);

  return result.refund;
}
```

## Testing

### 1. Sandbox Testing

```typescript
// src/tests/payments/square.test.ts
describe("Square Integration", () => {
  beforeAll(() => {
    // Use sandbox credentials
    process.env.SQUARE_ENVIRONMENT = "sandbox";
  });

  test("creates checkout session", async () => {
    const checkout = await createCheckoutSession({
      userId: "test-user",
      items: [
        {
          description: "Test Membership",
          quantity: 1,
          unitPriceCents: 5000,
        },
      ],
      returnUrl: "http://localhost:3000/success",
    });

    expect(checkout.checkoutUrl).toMatch(/squareupsandbox.com/);
    expect(checkout.orderId).toBeDefined();
  });
});
```

### 2. Webhook Testing

```typescript
// scripts/test-square-webhook.ts
const testWebhook = {
  merchant_id: "MERCHANT_ID",
  type: "payment.updated",
  event_id: "test-event-123",
  created_at: new Date().toISOString(),
  data: {
    type: "payment",
    id: "PAYMENT_ID",
    object: {
      payment: {
        id: "PAYMENT_ID",
        status: "COMPLETED",
        amount_money: {
          amount: 5000,
          currency: "CAD",
        },
      },
    },
  },
};

// Send test webhook
const response = await fetch("http://localhost:8888/api/webhooks/square", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-square-signature": generateTestSignature(testWebhook),
  },
  body: JSON.stringify(testWebhook),
});
```

## Security Considerations

### 1. PCI Compliance

- Never store card details
- Use Square's hosted checkout
- Implement proper HTTPS
- Regular security audits

### 2. Webhook Security

```typescript
export async function verifyWebhookSignature({
  body,
  signature,
  webhookSignatureKey,
}: VerifySignatureParams): Promise<boolean> {
  const hmac = crypto.createHmac("sha256", webhookSignatureKey);
  hmac.update(body);
  const expectedSignature = hmac.digest("base64");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
```

### 3. Idempotency

```typescript
// Prevent duplicate charges
const idempotencyKey = crypto
  .createHash("sha256")
  .update(`${userId}-${membershipTypeId}-${Date.now()}`)
  .digest("hex");
```

## Error Handling

```typescript
// src/lib/payments/errors.ts
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any,
  ) {
    super(message);
  }
}

export async function handleSquareError(error: any) {
  if (error.errors) {
    const squareError = error.errors[0];
    throw new PaymentError(squareError.detail, squareError.code, squareError);
  }

  throw new PaymentError("Payment processing failed", "UNKNOWN_ERROR", error);
}
```

## Monitoring & Analytics

```typescript
// Track payment metrics
export async function trackPaymentMetrics(payment: Payment) {
  await analytics.track({
    event: "payment_completed",
    userId: payment.userId,
    properties: {
      amount: payment.amountCents / 100,
      currency: payment.currency,
      provider: "square",
      itemTypes: payment.items.map((i) => i.itemType),
    },
  });
}
```

## Migration from Other Providers

If migrating from Stripe or another provider:

1. **Dual-write period**: Write to both systems
2. **Customer migration**: Import customer records
3. **Subscription handling**: Map recurring payments
4. **Historical data**: Preserve transaction history
5. **Gradual cutover**: Route percentage of traffic

## Best Practices

1. **Always use idempotency keys**
2. **Log all payment events**
3. **Handle webhook retries**
4. **Implement proper error handling**
5. **Test refund flows thoroughly**
6. **Monitor payment success rates**
7. **Keep audit trail of all transactions**
8. **Regular reconciliation with Square**
