# E-transfer Payment Integration

## Overview

The platform supports e-transfer payments as an alternative to card payments through Square. E-transfers are processed manually with email notifications and admin confirmation.

## E-transfer Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User          │────▶│  Payment System  │────▶│   Admin Panel   │
│                 │     │                  │     │                 │
│ - Select items  │     │ - Create order   │     │ - View pending  │
│ - Choose e-tfer │     │ - Send email     │     │ - Confirm paid  │
│ - Send payment  │     │ - Track status   │     │ - Update system │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │   Email to       │     │   Database      │
                        │ soleil@qbc.ca    │     │                 │
                        │                  │     │ - Payment record│
                        │ - Order details  │     │ - Status update │
                        │ - Amount & ref   │     │ - Member update │
                        └──────────────────┘     └─────────────────┘
```

## Implementation

### 1. Payment Method Selection

```typescript
// src/components/checkout/payment-method-selector.tsx
interface PaymentMethod {
  id: 'square' | 'etransfer'
  name: string
  description: string
  icon: React.ReactNode
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'square',
    name: 'Credit/Debit Card',
    description: 'Pay securely with your card',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    id: 'etransfer',
    name: 'E-transfer',
    description: 'Send payment via Interac e-transfer',
    icon: <Mail className="h-5 w-5" />
  }
]

export function PaymentMethodSelector({ onSelect }: { onSelect: (method: string) => void }) {
  const [selected, setSelected] = useState<string>()

  return (
    <div className="space-y-3">
      <Label>Payment Method</Label>
      {paymentMethods.map((method) => (
        <div
          key={method.id}
          className={cn(
            'flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors',
            selected === method.id ? 'border-primary bg-primary/5' : 'border-gray-200'
          )}
          onClick={() => {
            setSelected(method.id)
            onSelect(method.id)
          }}
        >
          <div className="flex-shrink-0">{method.icon}</div>
          <div className="flex-1">
            <div className="font-medium">{method.name}</div>
            <div className="text-sm text-muted-foreground">{method.description}</div>
          </div>
          <div className="flex-shrink-0">
            {selected === method.id && <Check className="h-5 w-5 text-primary" />}
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 2. E-transfer Order Creation

```typescript
// src/lib/payments/etransfer.service.ts
export interface ETransferOrder {
  id: string;
  userId: string;
  items: PaymentItem[];
  totalCents: number;
  instructions: string;
  referenceNumber: string;
  status: "pending" | "sent" | "confirmed" | "expired";
  createdAt: Date;
  expiresAt: Date;
}

export async function createETransferOrder({
  userId,
  items,
  totalCents,
}: {
  userId: string;
  items: PaymentItem[];
  totalCents: number;
}): Promise<ETransferOrder> {
  // Generate reference number
  const referenceNumber = generateReferenceNumber();

  // Create payment record
  const payment = await db
    .insert(payments)
    .values({
      userId,
      amountCents: totalCents,
      currency: "CAD",
      status: "pending",
      paymentMethod: "etransfer",
      providerId: "etransfer",
      metadata: {
        referenceNumber,
        etransferEmail: "soleil@quadballcanada.ca",
      },
    })
    .returning();

  // Create payment items
  await db.insert(paymentItems).values(
    items.map((item) => ({
      paymentId: payment[0].id,
      itemType: item.itemType,
      itemId: item.itemId,
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalPriceCents: item.totalPriceCents,
    })),
  );

  // Send notification email to admin
  await sendETransferNotificationEmail({
    payment: payment[0],
    items,
    user: await getUserById(userId),
  });

  // Send instructions to user
  await sendETransferInstructionsEmail({
    payment: payment[0],
    items,
    user: await getUserById(userId),
  });

  return {
    id: payment[0].id,
    userId,
    items,
    totalCents,
    instructions: generateInstructions(payment[0], totalCents),
    referenceNumber,
    status: "pending",
    createdAt: payment[0].createdAt,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };
}

function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `QBC-${timestamp}-${random}`.toUpperCase();
}

function generateInstructions(payment: Payment, totalCents: number): string {
  return `
Please send an e-transfer for $${(totalCents / 100).toFixed(2)} CAD to:

Email: soleil@quadballcanada.ca
Reference: ${payment.metadata.referenceNumber}
Message: Payment for ${payment.metadata.referenceNumber}

Your payment will be confirmed within 1-2 business days.
Please keep your e-transfer receipt for your records.
  `.trim();
}
```

### 3. E-transfer Email Notifications

```typescript
// src/lib/payments/etransfer.emails.ts
export async function sendETransferInstructionsEmail({
  payment,
  items,
  user,
}: {
  payment: Payment;
  items: PaymentItem[];
  user: User;
}) {
  const totalAmount = (payment.amountCents / 100).toFixed(2);
  const itemsList = items
    .map((item) => `- ${item.description}: $${(item.totalPriceCents / 100).toFixed(2)}`)
    .join("\n");

  await emailService.sendEmail({
    to: user.email,
    templateId: EMAIL_TEMPLATES.ETRANSFER_INSTRUCTIONS,
    dynamicTemplateData: {
      name: user.name,
      totalAmount,
      items: itemsList,
      referenceNumber: payment.metadata.referenceNumber,
      etransferEmail: "soleil@quadballcanada.ca",
      instructions: generateInstructions(payment, payment.amountCents),
      paymentUrl: `${process.env.VITE_BASE_URL}/payments/${payment.id}`,
    },
  });
}

export async function sendETransferNotificationEmail({
  payment,
  items,
  user,
}: {
  payment: Payment;
  items: PaymentItem[];
  user: User;
}) {
  const totalAmount = (payment.amountCents / 100).toFixed(2);
  const itemsList = items
    .map((item) => `- ${item.description}: $${(item.totalPriceCents / 100).toFixed(2)}`)
    .join("\n");

  await emailService.sendEmail({
    to: "soleil@quadballcanada.ca",
    templateId: EMAIL_TEMPLATES.ETRANSFER_ADMIN_NOTIFICATION,
    dynamicTemplateData: {
      userName: user.name,
      userEmail: user.email,
      totalAmount,
      items: itemsList,
      referenceNumber: payment.metadata.referenceNumber,
      paymentId: payment.id,
      adminUrl: `${process.env.VITE_BASE_URL}/admin/payments/${payment.id}`,
    },
  });
}
```

### 4. Admin Confirmation Interface

```typescript
// src/routes/admin/payments/[id].tsx
export function AdminPaymentConfirmation() {
  const { id } = useParams()
  const [payment, setPayment] = useState<Payment>()
  const [confirmAmount, setConfirmAmount] = useState('')
  const [notes, setNotes] = useState('')

  const confirmPayment = async () => {
    if (!payment) return

    try {
      await confirmETransferPayment({
        paymentId: payment.id,
        confirmedAmountCents: Math.round(parseFloat(confirmAmount) * 100),
        adminNotes: notes
      })

      toast.success('Payment confirmed successfully')
      // Refresh payment data
    } catch (error) {
      toast.error('Failed to confirm payment')
    }
  }

  if (!payment) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Confirm E-transfer Payment"
        description={`Payment ${payment.metadata.referenceNumber}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Reference Number</Label>
              <p className="font-mono">{payment.metadata.referenceNumber}</p>
            </div>
            <div>
              <Label>Expected Amount</Label>
              <p className="font-semibold">${(payment.amountCents / 100).toFixed(2)} CAD</p>
            </div>
            <div>
              <Label>User</Label>
              <p>{payment.user.name} ({payment.user.email})</p>
            </div>
            <div>
              <Label>Status</Label>
              <StatusBadge variant={payment.status === 'pending' ? 'warning' : 'success'}>
                {payment.status}
              </StatusBadge>
            </div>
          </div>

          <div>
            <Label>Items</Label>
            <ul className="mt-1 space-y-1">
              {payment.items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.description}</span>
                  <span>${(item.totalPriceCents / 100).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {payment.status === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Payment Received</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="amount">Received Amount (CAD)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={confirmAmount}
                onChange={(e) => setConfirmAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="notes">Admin Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this payment..."
              />
            </div>

            <Button onClick={confirmPayment} className="w-full">
              Confirm Payment Received
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

### 5. Payment Confirmation Server Function

```typescript
// src/lib/payments/etransfer.confirm.ts
export async function confirmETransferPayment({
  paymentId,
  confirmedAmountCents,
  adminNotes,
}: {
  paymentId: string;
  confirmedAmountCents: number;
  adminNotes?: string;
}) {
  await requireRole("global_admin");

  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, paymentId),
    with: {
      items: true,
      user: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "pending") {
    throw new Error("Payment already processed");
  }

  // Update payment status
  await db
    .update(payments)
    .set({
      status: "completed",
      metadata: {
        ...payment.metadata,
        confirmedAmountCents,
        adminNotes,
        confirmedAt: new Date().toISOString(),
        confirmedBy: getCurrentUserId(),
      },
    })
    .where(eq(payments.id, paymentId));

  // Process payment side effects (activate membership, confirm registration, etc.)
  await processSuccessfulPayment(paymentId);

  // Send confirmation email to user
  await sendPaymentConfirmationEmail({
    payment,
    confirmedAmount: confirmedAmountCents,
  });

  // Log admin action
  await createAuditLog({
    userId: getCurrentUserId(),
    action: "PAYMENT_CONFIRMED",
    entityType: "payment",
    entityId: paymentId,
    changes: {
      status: "completed",
      confirmedAmountCents,
      adminNotes,
    },
  });
}
```

## Email Templates

### User Instructions Template

```html
<!-- SendGrid Template: E-transfer Instructions -->
<div>
  <h1>Payment Instructions</h1>

  <p>Hi {{name}},</p>

  <p>Thank you for your order! Please send an e-transfer with the following details:</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>E-transfer Details</h3>
    <p><strong>Email:</strong> soleil@quadballcanada.ca</p>
    <p><strong>Amount:</strong> ${{totalAmount}} CAD</p>
    <p><strong>Reference:</strong> {{referenceNumber}}</p>
    <p><strong>Message:</strong> Payment for {{referenceNumber}}</p>
  </div>

  <h3>Your Order</h3>
  <pre>{{items}}</pre>

  <p>
    Your payment will be confirmed within 1-2 business days. You'll receive an email
    confirmation once your payment is processed.
  </p>

  <p>Please keep your e-transfer receipt for your records.</p>

  <p>Questions? Contact us at support@quadballcanada.ca</p>
</div>
```

### Admin Notification Template

```html
<!-- SendGrid Template: E-transfer Admin Notification -->
<div>
  <h1>New E-transfer Payment Pending</h1>

  <p>A new e-transfer payment is pending confirmation:</p>

  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
    <h3>Payment Details</h3>
    <p><strong>User:</strong> {{userName}} ({{userEmail}})</p>
    <p><strong>Amount:</strong> ${{totalAmount}} CAD</p>
    <p><strong>Reference:</strong> {{referenceNumber}}</p>
  </div>

  <h3>Items</h3>
  <pre>{{items}}</pre>

  <p><a href="{{adminUrl}}">Confirm Payment in Admin Panel</a></p>
</div>
```

## Admin Dashboard Integration

### Pending Payments Widget

```typescript
// src/components/admin/pending-etransfers.tsx
export function PendingETransfers() {
  const { data: pendingPayments } = useQuery({
    queryKey: ['admin', 'pending-etransfers'],
    queryFn: () => getPendingETransferPayments()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending E-transfers</CardTitle>
        <CardDescription>
          {pendingPayments?.length || 0} payments awaiting confirmation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {pendingPayments?.length ? (
          <div className="space-y-3">
            {pendingPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{payment.user.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ${(payment.amountCents / 100).toFixed(2)} • {payment.metadata.referenceNumber}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/payments/${payment.id}`}>
                    Confirm
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No pending e-transfers</p>
        )}
      </CardContent>
    </Card>
  )
}
```

## Security Considerations

1. **Reference Number Validation**: Ensure reference numbers are unique and hard to guess
2. **Admin Verification**: Only global admins can confirm payments
3. **Amount Verification**: Admin must confirm actual received amount
4. **Audit Trail**: All confirmations logged with admin user and timestamp
5. **Email Security**: Use secure email templates and validate recipients

## Testing

```typescript
// src/tests/payments/etransfer.test.ts
describe("E-transfer Payment Flow", () => {
  test("creates e-transfer order correctly", async () => {
    const order = await createETransferOrder({
      userId: "user-123",
      items: [{ description: "Membership", totalCents: 5000 }],
      totalCents: 5000,
    });

    expect(order.referenceNumber).toMatch(/^QBC-/);
    expect(order.status).toBe("pending");
  });

  test("admin can confirm payment", async () => {
    const payment = await createTestETransferPayment();

    await confirmETransferPayment({
      paymentId: payment.id,
      confirmedAmountCents: 5000,
      adminNotes: "Test confirmation",
    });

    const updated = await getPayment(payment.id);
    expect(updated.status).toBe("completed");
  });
});
```
