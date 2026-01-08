# TOTP Verification - RESOLVED

## Summary

~~TOTP (Time-based One-Time Password) verification fails with "Invalid code" when using seeded MFA data, while backup code verification works correctly.~~

**RESOLVED**: The issue was a mismatch between how the secret is stored vs. how to generate codes.

### Root Cause

Better Auth stores the **raw secret string** (e.g., `<RAW_TOTP_SECRET>`) but
authenticator apps expect the **base32 encoding of that string** (e.g.,
`<BASE32_TOTP_SECRET>`).

### Solution

When generating TOTP codes for testing, use the base32-encoded version:

```bash
# CORRECT - use base32-encoded secret
npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"

# WRONG - raw secret produces different codes
npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"
```

`SIN_UI_TOTP_SECRET` is stored in SST secrets (sin-dev).

---

## Original Issue (for reference)

## Environment

- **Stage**: sin-dev (viaSport)
- **Database**: AWS RDS PostgreSQL via SST tunnel
- **Auth Library**: Better Auth with `twoFactor` plugin
- **Test User**: `admin@example.com` / `testpassword123`
- **TOTP Secret**: `<RAW_TOTP_SECRET>` (base32-encoded)

## Symptoms

### What Works

- Email/password login: ✅
- Backup code MFA verification: ✅ (e.g., `backup-testcode1`)
- User redirected to 2FA prompt after password auth: ✅

### What Fails

- TOTP code verification: ❌ "Invalid code" / 401 UNAUTHORIZED
- Codes generated with `otplib.authenticator.generate(<RAW_TOTP_SECRET>)` are rejected

## Technical Details

### How Backup Codes Are Stored (Working)

From `scripts/seed-sin-data.ts`:

```typescript
import { symmetricEncrypt } from "@better-auth/utils/encryption";

const backupCodes = [
  "backup-testcode1",
  "backup-testcode2", // ... etc
];

// Encrypt each backup code individually, then JSON stringify
const encryptedBackupCodes = JSON.stringify(
  await Promise.all(
    backupCodes.map((code) => symmetricEncrypt({ data: code, key: authSecret })),
  ),
);

await db.insert(twoFactor).values({
  backupCodes: encryptedBackupCodes, // ✅ This works
});
```

### How TOTP Secret Is Stored (Failing)

```typescript
const FAKE_MFA_SECRET = "<RAW_TOTP_SECRET>"; // Base32 string

// Encrypt the base32 string directly
const encryptedSecret = await symmetricEncrypt({
  data: FAKE_MFA_SECRET,
  key: authSecret,
});

await db.insert(twoFactor).values({
  secret: encryptedSecret, // ❌ Verification fails
});
```

### Better Auth's Verification Flow

From Better Auth source (`two-factor/totp/index.ts`):

```typescript
// Decrypt the stored secret
const decrypted = await symmetricDecrypt({
  key: ctx.context.secret,
  data: twoFactor.secret,
});

// Verify the TOTP code
const status = await createOTP(decrypted, {
  period: opts.period, // 30 seconds
  digits: opts.digits, // 6 digits
}).verify(ctx.body.code);
```

### The Question

What format does `createOTP()` expect for the `decrypted` secret?

**Possibilities:**

1. **Base32 string** (what we're storing): `"<RAW_TOTP_SECRET>"`
2. **Raw bytes** (decoded from base32): `Buffer.from(base32Decode('<RAW_TOTP_SECRET>'))`
3. **Hex string**: The hex representation of the raw bytes
4. **Something else**: Better Auth may generate secrets in a specific format

## Investigation Attempts

### Attempt 1: Store Base32 String Directly

```typescript
const encryptedSecret = await symmetricEncrypt({
  data: "<RAW_TOTP_SECRET>",
  key: authSecret,
});
```

**Result**: ❌ Invalid code

### Attempt 2: Base32 Decode Before Encrypting

```typescript
function base32Decode(input: string): Uint8Array {
  // ... decode base32 to raw bytes
}
const rawBytes = base32Decode("<RAW_TOTP_SECRET>");
const encryptedSecret = await symmetricEncrypt({
  data: Buffer.from(rawBytes).toString(), // or .toString('hex')?
  key: authSecret,
});
```

**Result**: ❌ Reverted (didn't fix the issue)

## What We Need To Know

1. **How does Better Auth generate TOTP secrets during normal enrollment?**
   - What does `auth.twoFactor.enable({ password })` store in the `secret` field?
   - Is it base32-encoded or raw bytes?

2. **What does `@better-auth/utils/otp` `createOTP()` expect?**
   - Does it expect base32 input and decode internally?
   - Or does it expect raw bytes?

3. **Is there a mismatch between `otplib` and Better Auth's OTP library?**
   - We generate codes with `otplib.authenticator.generate()`
   - Better Auth verifies with `createOTP().verify()`
   - Are these compatible?

## Reproduction Steps

1. Start SST dev mode:

   ```bash
   AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono
   ```

2. Run seed script:

   ```bash
   source .env && npx tsx scripts/seed-sin-data.ts --force
   ```

3. Navigate to http://localhost:5173/auth/login

4. Login with `admin@example.com` / `testpassword123`

5. When prompted for 2FA, try:
   - **Backup code**: `backup-testcode1` → ✅ Works
   - **TOTP code**: Generate with `npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"` → ❌ Fails

## Potential Solutions

### Option A: Trace Better Auth's Enable Flow

Enable MFA through the UI for a real user, then inspect what's stored in the `two_factor.secret` field. Compare the format to what we're seeding.

### Option B: Use Better Auth's Internal Secret Generation

If Better Auth exports a secret generation function, use that in the seed script instead of a hardcoded base32 string.

### Option C: Check OTP Library Compatibility

Verify that `otplib` and `@better-auth/utils/otp` use the same algorithm and expect the same secret format.

### Option D: Skip TOTP in Seeds, Use Backup Codes Only

For E2E testing, backup codes work reliably. Document that TOTP testing requires manual MFA enrollment.

## Related Files

- `scripts/seed-sin-data.ts` - Seed script with MFA secret encryption
- `src/lib/auth/server-helpers.ts` - Better Auth configuration
- `src/features/auth/mfa/mfa-enrollment.tsx` - UI for enabling MFA
- `src/db/schema/auth.schema.ts` - Database schema for `two_factor` table
- `docs/sin-rfp/archive/streams/stream-a.md` - Original MFA implementation notes

## References

- [Better Auth 2FA Plugin Docs](https://www.better-auth.com/docs/plugins/2fa)
- [Better Auth GitHub - two-factor plugin](https://github.com/better-auth/better-auth/tree/main/packages/better-auth/src/plugins/two-factor)
