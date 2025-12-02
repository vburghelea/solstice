# Update Square Location ID in Netlify

## Issue

The Square checkout is failing because `SQUARE_LOCATION_ID` is set to "test-location-id" in the Netlify environment.

## Fix Required

Update the following environment variable in Netlify:

1. Go to https://app.netlify.com
2. Select your site: `snazzy-twilight-39e1e9`
3. Navigate to: Site configuration → Environment variables
4. Update the following variable:
   - **SQUARE_LOCATION_ID**: Change from `test-location-id` to `LVDXQH3JBZ5EK`

## Current Square Sandbox Configuration

These values should already be correct in Netlify:

- **SQUARE_ACCESS_TOKEN**: `EAAAl7sNNDgjJXDRXFQT_tDsrJDpFZdb2OyqXGFfg5DjQLyRhblF8KB2ZwfiSp_S`
- **SQUARE_APPLICATION_ID**: `sandbox-sq0idb-2rFEfy0tewRrL-80ecSSdg`
- **SQUARE_ENV**: `sandbox`
- **SQUARE_LOCATION_ID**: Should be `LVDXQH3JBZ5EK` (not `test-location-id`)

## After Update

1. Trigger a new deploy or clear build cache and redeploy
2. The Square checkout should work with the sandbox

## Testing Square Sandbox Payments

Once the location ID is updated, you can test with these Square sandbox test cards:

- **Success**: `4111 1111 1111 1111` (any CVV, any future expiry)
- **Decline**: `4000 0000 0000 0002`
- **SCA Required**: `5333 3300 7777 0019`

## Test User

Login with: `squaretest@example.com` / `testpassword123`
