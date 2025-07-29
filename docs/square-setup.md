# Square Payment Integration

## Overview

This document explains the Square payment integration for the Quadball Canada platform, including setup instructions, implementation details, and API reference.

## Implementation Status

- **Status**: ✅ Complete (January 2025)
- **SDK Version**: Square SDK v43.0.0
- **API**: Payment Links API (replaced deprecated Checkout API)
- **Environments**: Mock (development), Sandbox (testing), Production

## Environment Variables

The following environment variables are required for Square integration:

### Required Variables

- `SQUARE_ENV` - Either "sandbox" or "production"
- `SQUARE_APPLICATION_ID` - Your Square application ID
- `SQUARE_ACCESS_TOKEN` - Your Square access token
- `SQUARE_LOCATION_ID` - Your Square location ID (create in Square Dashboard)

### Optional Variables

- `SQUARE_WEBHOOK_SIGNATURE_KEY` - For webhook verification (set up in Square Dashboard)
- `SQUARE_WEBHOOK_URL` - Your webhook endpoint URL
- `SUPPORT_EMAIL` - Email shown during checkout for support

## Current Configuration

### Sandbox (Development/Testing)

- Application ID: `sandbox-sq0idb-2rFEfy0tewRrL-80ecSSdg`
- Access Token: `EAAAl7sNNDgjJXDRXFQT_tDsrJDpFZdb2OyqXGFfg5DjQLyRhblF8KB2ZwfiSp_S`
- Environment: `sandbox`

### Production

- Application ID: `sq0idp-NRiP6Cx6neVh9hvGrccCIg`
- Access Token: `EAAAl1BXd7DxhAmHqMXEu9eM4tsQyQCK-iBxUPK4KqUeZinwlLSPSiahTZP4NNrS`
- Environment: `production`

## Setup Steps

### 1. Create a Location

1. Log in to your Square Dashboard
2. Navigate to Locations
3. Create a new location or select existing
4. Copy the Location ID
5. Add to environment variables as `SQUARE_LOCATION_ID`

### 2. Configure Webhooks (Optional but Recommended)

1. In Square Dashboard, go to Webhooks
2. Create a new webhook endpoint
3. Set the URL to: `https://your-domain.com/api/webhooks/square`
4. Subscribe to these events:
   - `payment.created`
   - `payment.updated`
   - `refund.created`
   - `refund.updated`
5. Copy the Signature Key
6. Add to environment variables as `SQUARE_WEBHOOK_SIGNATURE_KEY`

### 3. Test in Sandbox

Before going live:

1. Use Square's test card numbers:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`
2. Test the full payment flow
3. Verify webhook handling

### 4. Switch to Production

1. Change `SQUARE_ENV` to "production"
2. Update `SQUARE_APPLICATION_ID` and `SQUARE_ACCESS_TOKEN` to production values
3. Update webhook URL if different
4. Test with a real card (small amount)

## Verification

Check the configuration status at: `/api/health`

```json
{
  "services": {
    "square": {
      "status": "configured",
      "environment": "sandbox",
      "hasApplicationId": true,
      "hasLocationId": false,
      "hasWebhookKey": false
    }
  }
}
```

## Security Notes

- **Never commit credentials to git**
- Use environment variables for all sensitive data
- Keep production and sandbox credentials separate
- Rotate access tokens regularly
- Use webhook signatures to verify authenticity

## Troubleshooting

### Payment Failed

- Check Square Dashboard for detailed error
- Verify all environment variables are set
- Ensure location ID is valid

### Webhook Not Received

- Verify webhook URL is accessible
- Check signature key configuration
- Review Square webhook logs

### Sandbox vs Production Issues

- Ensure SQUARE_ENV matches your credentials
- Sandbox and production use different endpoints
- Test cards only work in sandbox

## Code Architecture

### Service Implementation

The Square integration uses a service pattern with environment-based switching:

```typescript
// src/lib/payments/square.ts - Main service interface
interface PaymentService {
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>;
  confirmPurchase(params: ConfirmPurchaseParams): Promise<ConfirmPurchaseResult>;
  refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult>;
}

// src/lib/payments/square-mock.ts - Mock service for development
// src/lib/payments/square-real.ts - Real Square implementation
```

### Key Files

- **Service Layer**:
  - `src/lib/payments/square.ts` - Service factory and interface
  - `src/lib/payments/square-real.ts` - Square SDK implementation
  - `src/lib/payments/square-mock.ts` - Mock implementation

- **API Routes**:
  - `src/routes/api/webhooks/square.ts` - Webhook handler
  - `src/routes/api/payments/square/callback.ts` - Payment callback

- **Server Functions**:
  - `src/features/membership/membership.mutations.ts` - `createCheckoutSession()`, `confirmMembershipPurchase()`

### Payment Flow

1. **Checkout Creation**:
   - User clicks "Buy Membership"
   - `createCheckoutSession()` server function called
   - Square Payment Link created with return URLs
   - User redirected to Square checkout

2. **Payment Processing**:
   - User completes payment on Square
   - Square redirects to callback URL with payment ID
   - Callback handler verifies payment status
   - Membership record created/updated

3. **Webhook Handling** (optional):
   - Square sends webhook for payment events
   - Signature verified using WebhooksHelper
   - Payment status synchronized

### Testing

#### Unit Tests

```bash
pnpm test src/lib/payments/__tests__/
```

#### Integration Testing

1. Set `SQUARE_ENV=sandbox`
2. Use test cards:
   - Success: `4111 1111 1111 1111`
   - Decline: `4000 0000 0000 0002`
3. Test full flow including callbacks

### Migration from v42 to v43

The implementation was updated to use Square SDK v43 best practices:

- Replaced deprecated Checkout API with Payment Links API
- Updated to new namespace imports (`Square.PaymentLink`)
- Added proper TypeScript types for all Square objects
- Implemented WebhooksHelper for signature verification

### Security Considerations

1. **Environment Isolation**: Credentials never exposed to client
2. **Webhook Verification**: All webhooks verified with signature
3. **Payment Validation**: Server-side verification of all payments
4. **Error Handling**: Graceful fallback to mock service if misconfigured
