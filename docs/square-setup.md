# Square Payment Integration Setup

## Overview

This document explains how to set up Square payment processing for the Quadball Canada platform.

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
