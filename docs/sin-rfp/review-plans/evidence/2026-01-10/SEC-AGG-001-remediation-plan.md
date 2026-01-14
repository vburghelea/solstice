# SEC-AGG-001 Remediation Plan

**Video:** SEC-AGG-001-auth-mfa-login-flow-FINAL.mp4
**Analysis Date:** 2026-01-12
**Frames Analyzed:** 49 frames (24.5 seconds at 2fps)
**Recording Script:** `scripts/record-sin-uat-sec-agg-001.ts`

---

## Executive Summary

The video successfully demonstrates MFA login but the Settings page contradicts this by showing MFA as "unavailable" instead of "enabled". This is a **critical data issue** that must be fixed before the video accurately showcases security features.

**Current Score:** 4/10
**Target Score:** 9/10

---

## Issues Found

### Critical Issues (Must Fix)

| #   | Issue                                              | Frames | Category      | Impact                      |
| --- | -------------------------------------------------- | ------ | ------------- | --------------------------- |
| 1   | MFA shows "unavailable" after successful MFA login | 29-49  | **Data**      | Contradicts video evidence  |
| 2   | "Enable MFA" button instead of "MFA Enabled" badge | 41-49  | **Data**      | Core feature looks broken   |
| 3   | "Passkeys unavailable" message shown               | 30-49  | **Data**      | Cannot demo passkey feature |
| 4   | Active Sessions section not visible                | 30-49  | **Code/Data** | Security feature missing    |

### Script Issues (Should Fix)

| #   | Issue                                               | Frames | Impact                              |
| --- | --------------------------------------------------- | ------ | ----------------------------------- |
| 5   | Excessive static time on Settings (20 frames = 10s) | 30-49  | Boring, shows broken state too long |
| 6   | No explicit navigation to Settings via UI click     | 22-29  | Abrupt transition, not realistic    |
| 7   | No scrolling to show all sections                   | 30-49  | Only partial Settings visible       |
| 8   | No passkey registration demo                        | -      | Key differentiator not shown        |
| 9   | No session revocation demo                          | -      | Security feature not shown          |

### Minor Issues (Nice to Fix)

| #   | Issue                                           | Frames | Impact                   |
| --- | ----------------------------------------------- | ------ | ------------------------ |
| 10  | Dashboard shown for 7 frames before Settings    | 22-28  | Unnecessary static time  |
| 11  | Onboarding modal may appear (per other reviews) | -      | Could distract from flow |

---

## Issue Details & Root Causes

### Issue 1-2: MFA Status Mismatch (CRITICAL)

**Observed:** Settings page shows "Multi-factor authentication unavailable" and "Enable MFA" button despite user completing MFA login successfully.

**Root Cause Analysis:**

- The `twoFactor` table in Better Auth stores MFA enrollments
- The user `viasport-staff@example.com` likely has MFA working for auth but the Settings UI queries a different field
- Settings page checks `user.twoFactorEnabled` flag which may not be set correctly

**Verification Steps:**

```sql
-- Check twoFactor enrollment
SELECT * FROM "twoFactor" WHERE "userId" = (
  SELECT id FROM "user" WHERE email = 'viasport-staff@example.com'
);

-- Check user MFA flag
SELECT id, email, "twoFactorEnabled" FROM "user"
WHERE email = 'viasport-staff@example.com';
```

**Fix Location:** `scripts/seed-sin-data.ts`

- Ensure `twoFactorEnabled: true` is set when seeding the user
- Ensure `twoFactor` table has valid enrollment record

### Issue 3: Passkeys Unavailable (CRITICAL)

**Observed:** "Passkeys unavailable" message instead of registered passkeys.

**Root Cause:** No passkeys seeded for the test user.

**Verification:**

```sql
SELECT * FROM "passkey" WHERE "userId" = (
  SELECT id FROM "user" WHERE email = 'viasport-staff@example.com'
);
```

**Fix:** Cannot programmatically seed WebAuthn passkeys (requires browser attestation). Script should either:

1. Show the "Add passkey" flow instead of expecting existing passkeys
2. Mock the passkey display somehow (not recommended)

**Alternative:** Accept that passkeys section will show "Add passkey" and update the video script to demonstrate registration instead.

### Issue 4: Active Sessions Missing

**Observed:** Active Sessions section not visible in Settings page frames.

**Root Cause Possibilities:**

1. Section is below the fold and script didn't scroll
2. Session records not being created in database
3. UI component conditionally hidden

**Verification:**

```sql
SELECT * FROM "session" WHERE "userId" = (
  SELECT id FROM "user" WHERE email = 'viasport-staff@example.com'
) ORDER BY "createdAt" DESC LIMIT 5;
```

**Fix Location:** `scripts/record-sin-uat-sec-agg-001.ts`

- Add scroll to "Active Sessions" section
- Verify section heading selector: `page.getByText("Active Sessions", { exact: true })`

### Issue 5-7: Script Timing/Navigation

**Observed:** 20 frames (10 seconds) static on Settings page with no interaction.

**Fix Location:** `scripts/record-sin-uat-sec-agg-001.ts`

Current script:

```typescript
// Current: Direct navigation (not shown in video)
await page.goto(`${config.baseUrl}/dashboard/settings`);
```

Should be:

```typescript
// Better: Click Settings in sidebar
await page.getByRole('link', { name: /Settings/i }).click();
await waitForIdle(page);
```

---

## Remediation Actions

### Phase 1: Data Fixes (Priority: CRITICAL)

**File:** `scripts/seed-sin-data.ts`

1. **Ensure MFA is properly enabled for viasport-staff:**

   ```typescript
   // In Phase 4 (MFA enrollment section)
   // Verify the user's twoFactorEnabled field is set
   await db.update(users)
     .set({ twoFactorEnabled: true })
     .where(eq(users.id, IDS.viasportStaffId));
   ```

2. **Verify twoFactor table has enrollment:**
   ```typescript
   // Ensure TOTP secret is stored
   await db.insert(twoFactor).values({
     id: IDS.viasportStaffMfaId,
     userId: IDS.viasportStaffId,
     secret: encryptedTotpSecret,
     backupCodes: encryptedBackupCodes,
   }).onConflictDoNothing();
   ```

**Estimated Effort:** 30 minutes
**Owner:** TBD

### Phase 2: Script Fixes (Priority: HIGH)

**File:** `scripts/record-sin-uat-sec-agg-001.ts`

1. **Reduce static time after login:**

   ```typescript
   // After dashboard loads, navigate immediately to Settings
   await wait(1000); // Brief pause only
   await page.getByRole('link', { name: /Settings/i }).click();
   ```

2. **Add scroll to show all sections:**

   ```typescript
   // After Settings loads, scroll to show each section
   await page.getByText('Two-Factor Authentication').scrollIntoViewIfNeeded();
   await wait(800);
   await takeScreenshot('03-mfa-section.png');

   await page.getByText('Passkeys').scrollIntoViewIfNeeded();
   await wait(800);
   await takeScreenshot('04-passkeys-section.png');

   await page.getByText('Active Sessions').scrollIntoViewIfNeeded();
   await wait(800);
   await takeScreenshot('05-active-sessions.png');
   ```

3. **Passkey section - SHOW ONLY, do not attempt registration:**

   > **⚠️ WebAuthn Limitation:** Passkey registration requires either:
   >
   > - Headed browser mode with real user gesture, OR
   > - Virtual authenticator setup via `cdpSession.send('WebAuthn.enable')` + `addVirtualAuthenticator`
   >
   > Neither is worth the complexity for this demo. **Recommendation: Skip passkey registration entirely.** Just scroll to show the Passkeys section exists.

   ```typescript
   // Show passkeys section exists (will show "Add passkey" button)
   await page.getByText('Passkeys').scrollIntoViewIfNeeded();
   await wait(800);
   await takeScreenshot('04-passkeys-section.png');
   // DO NOT click "Add passkey" - will fail in headless mode
   ```

**Estimated Effort:** 1 hour
**Owner:** TBD

### Phase 3: Re-recording (Priority: HIGH)

After fixing data and script:

```bash
# 1. Re-run seed script (with tunnel to sin-uat)
DATABASE_URL="..." BETTER_AUTH_SECRET="..." npx tsx scripts/seed-sin-data.ts --force

# 2. Verify MFA status
# Via psql:
# SELECT email, "twoFactorEnabled" FROM "user" WHERE email = 'viasport-staff@example.com';

# 3. Re-record video
npx tsx scripts/record-sin-uat-sec-agg-001.ts

# 4. Extract frames and re-review
ffmpeg -i docs/sin-rfp/review-plans/evidence/2026-01-10/videos/SEC-AGG-001-auth-mfa-login-flow-*.mp4 \
  -vf "fps=2" /tmp/sec-agg-001-review/frame_%03d.png
```

---

## Target Video Flow (Ideal State)

| Phase                   | Duration | Content                                                         | Key Visual                   |
| ----------------------- | -------- | --------------------------------------------------------------- | ---------------------------- |
| 1. Login                | 3s       | Email entry                                                     | Email field populated        |
| 2. Password             | 3s       | Password entry                                                  | Masked dots, "Logging in..." |
| 3. MFA Challenge        | 5s       | TOTP code entry                                                 | 6-digit code, "Verifying..." |
| 4. Dashboard            | 3s       | Brief dashboard view                                            | Admin menu visible           |
| 5. Navigate to Settings | 2s       | Click Settings link                                             | Sidebar navigation           |
| 6. MFA Enabled Badge    | 5s       | **"MFA Enabled" badge with green checkmark**                    | Shield icon, "Enabled" text  |
| 7. Passkeys Section     | 3s       | Show section exists with "Add passkey" button (no registration) | WebAuthn section visible     |
| 8. Active Sessions      | 5s       | Show current session with IP/device                             | Session management           |
| 9. Session Revocation   | 4s       | Demo "Revoke" button (optional)                                 | Security action              |

**Total:** ~35 seconds (ideal)

---

## Verification Checklist

After re-recording, verify:

- [ ] MFA section shows "Enabled" badge (green checkmark)
- [ ] MFA section does NOT show "Enable MFA" button
- [ ] Passkeys section is visible (even if showing "Add passkey")
- [ ] Active Sessions section is visible with at least 1 session
- [ ] No single view exceeds 5 seconds (10 frames at 2fps)
- [ ] Total duration 30-45 seconds
- [ ] No blank frames at start/end
- [ ] Smooth transitions between sections

---

## Files to Modify

| File                                                 | Changes Required                                     |
| ---------------------------------------------------- | ---------------------------------------------------- |
| `scripts/seed-sin-data.ts`                           | Ensure MFA enrollment, verify twoFactorEnabled flag  |
| `scripts/record-sin-uat-sec-agg-001.ts`              | Add scrolling, reduce static time, show all sections |
| `src/features/settings/components/settings-view.tsx` | Verify MFA badge logic (if needed)                   |

---

## Related Documents

- [VIDEO-IMPROVEMENT-ANALYSIS.md](./VIDEO-IMPROVEMENT-ANALYSIS.md) - Overall video analysis
- [VIDEO-EXCELLENCE-PLAN.md](./VIDEO-EXCELLENCE-PLAN.md) - Target flow definitions
- [CLAUDE.md](../../../../CLAUDE.md) - Test credentials and environment setup
