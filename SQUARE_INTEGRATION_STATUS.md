# Square Integration Testing Status

## Current Issue

The Square checkout integration is failing on the deployed Netlify site despite having correct configuration.

## What We've Done

### 1. Fixed Configuration

- ✅ Updated `SQUARE_LOCATION_ID` from `test-location-id` to `LVDXQH3JBZ5EK`
- ✅ Deployed to Netlify with correct environment variables
- ✅ Verified configuration via test endpoint:
  ```json
  {
    "status": "Square Config Check",
    "hasAccessToken": true,
    "hasLocationId": true,
    "locationId": "LVDXQ...BZ5EK",
    "environment": "sandbox",
    "isValidLocationId": true
  }
  ```

### 2. Environment Variables (Confirmed in Netlify)

```
SQUARE_ACCESS_TOKEN=EAAAl7sNNDgjJXDRXFQT_tDsrJDpFZdb2OyqXGFfg5DjQLyRhblF8KB2ZwfiSp_S
SQUARE_APPLICATION_ID=sandbox-sq0idb-2rFEfy0tewRrL-80ecSSdg
SQUARE_ENV=sandbox
SQUARE_LOCATION_ID=LVDXQH3JBZ5EK
```

### 3. Test User Created

- Email: `squaretest@example.com`
- Password: `testpassword123`
- Status: No active membership (ready for purchase test)

### 4. Test Scripts Created

- `/scripts/get-square-location.ts` - Retrieves valid Square sandbox location IDs
- `/scripts/test-square-sandbox.ts` - Tests Square API connectivity
- `/src/routes/api/test-square.ts` - API endpoint to verify Square config in production

## Current Problem

When clicking "Purchase" on the membership page at https://snazzy-twilight-39e1e9.netlify.app/dashboard/membership:

- The checkout session creation fails with "Failed to create checkout session"
- The `/api/health` endpoint shows Square is configured
- The test endpoint confirms correct environment variables

## Files Involved

### Core Square Integration

- `/src/lib/payments/square.ts` - Main Square service wrapper
- `/src/lib/payments/square-real.ts` - Real Square API implementation
- `/src/features/membership/membership.mutations.ts` - Contains `createCheckoutSession` server function
- `/src/routes/api/payments/square/callback.ts` - Square payment callback handler

### Database Schema

- `/src/db/schema/membership.schema.ts` - Membership and payment session tables

### Environment Configuration

- `/.env` - Local environment variables
- `/src/lib/env.server.ts` - Server environment validation

## Testing Steps

1. **Local Testing** (Working)

   ```bash
   pnpm dev
   # Navigate to http://localhost:5173
   # Login as squaretest@example.com
   # Go to Dashboard > Membership
   # Click Purchase
   ```

2. **Production Testing** (Failing)
   ```
   # Navigate to https://snazzy-twilight-39e1e9.netlify.app
   # Login as squaretest@example.com
   # Go to Dashboard > Membership
   # Click Purchase
   # Error: "Failed to create checkout session"
   ```

## Square Sandbox Test Cards

- **Success**: `4111 1111 1111 1111` (any CVV, any future expiry)
- **Decline**: `4000 0000 0000 0002`
- **SCA Required**: `5333 3300 7777 0019`

## Debugging Needed

1. Check the actual error returned from Square API in production
2. Verify the Square SDK is correctly initializing with sandbox credentials
3. Check if there are any CORS or network issues in production
4. Verify the payment link creation request format

## API Endpoints

- Health Check: `GET /api/health`
- Test Square Config: `GET /api/test-square`
- Create Checkout: `POST /_serverFn/src_features_membership_membership_mutations_ts--createCheckoutSession_createServerFn_handler?createServerFn`
- Square Callback: `GET /api/payments/square/callback`

## Next Steps

1. Add more detailed error logging to the checkout creation
2. Test the Square API directly from the Netlify environment
3. Check Netlify function logs for the actual error
4. Verify the payment link creation parameters match Square's requirements
