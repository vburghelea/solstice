# SIN-UAT-001: Evidence Capture Blockers for RFP Submission

**Priority:** P0 (Blocker for RFP submission)
**Effort:** 2-4 hours
**Status:** Open
**Created:** 2026-01-08
**Source:** Evidence capture session for final-evidence-review-plan.md

---

## Summary

During evidence capture on sin-uat (https://sinuat.solsticeapp.ca) for the RFP submission, five issues were discovered that prevent clean screenshots and full feature demonstration. All issues must be resolved before final evidence can be captured.

---

## Issues

### Issue 1: TanStack Devtools Visible in Production

**Severity:** High (visible in all screenshots)
**Component:** Build configuration

**Problem:**
Both TanStack Router and TanStack Query devtools badges are visible in the bottom-right corner of all pages in sin-uat. This indicates the deployment was not built with production mode.

**Evidence:**

- All 14 screenshots in `docs/sin-rfp/review-plans/evidence/2026-01-08/screenshots/sinuat/` show the devtools badge

**Root Cause:**
The SST deployment likely does not set `NODE_ENV=production` or the Vite build is not using production mode.

**Fix:**

1. Check current build mode in `sst.config.ts`:

   ```typescript
   // Ensure Vite builds in production mode
   environment: {
     NODE_ENV: "production",
   }
   ```

2. Or ensure the build command uses production mode:

   ```bash
   NODE_ENV=production pnpm build
   ```

3. Redeploy sin-uat:
   ```bash
   AWS_PROFILE=techdev npx sst deploy --stage sin-uat
   ```

**Verification in Deployed UAT:**

1. Navigate to https://sinuat.solsticeapp.ca/auth/login
2. Inspect the page - confirm NO elements with:
   - `button[aria-label*="TanStack"]`
   - Text "TanStack Router" or "TanStack Query"
3. Check bottom-right corner of viewport - should be empty
4. Open browser DevTools Console - should not see TanStack devtools initialization messages

```javascript
// Run in browser console to verify no devtools
document.querySelectorAll('[class*="tanstack"], [aria-label*="TanStack"]').length === 0
// Should return true
```

---

### Issue 2: MFA TOTP Secret Mismatch

**Severity:** High (blocks MFA evidence)
**Component:** Authentication / Seed data

**Problem:**
The `viasport-staff@example.com` user has MFA enabled in sin-uat, but the TOTP codes generated using the local `SIN_UI_TOTP_SECRET` environment variable are rejected with "Invalid code" error.

**Evidence:**

- Screenshot `SEC-AGG-001-sinuat-mfa-20260108.png` shows MFA challenge
- Multiple TOTP codes rejected during evidence capture session

**Root Cause:**
The sin-uat database has a different TOTP secret for the user than the one stored in the local environment variable. This happens when:

- The user was seeded separately in sin-uat with a different TOTP secret
- Or the `SIN_UI_TOTP_SECRET` SST secret was never set for sin-uat stage

**Fix Options:**

**Option A: Set SST Secret (Preferred)**

1. Query the existing TOTP secret from sin-uat database (requires tunnel fix first):

   ```sql
   SELECT tf.secret
   FROM "user" u
   JOIN two_factor tf ON u.id = tf.user_id
   WHERE u.email = 'viasport-staff@example.com';
   ```

2. Set the SST secret:
   ```bash
   AWS_PROFILE=techdev npx sst secret set SinUiTotpSecret "<secret-from-db>" --stage sin-uat
   ```

**Option B: Reseed User with Known Secret**

1. Generate a known TOTP secret:

   ```bash
   npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generateSecret());"
   ```

2. Update the user's TOTP secret in the database:

   ```sql
   UPDATE two_factor
   SET secret = '<new-secret>'
   WHERE user_id = (SELECT id FROM "user" WHERE email = 'viasport-staff@example.com');
   ```

3. Set the SST secret to match:
   ```bash
   AWS_PROFILE=techdev npx sst secret set SinUiTotpSecret "<new-secret>" --stage sin-uat
   ```

**Verification in Deployed UAT:**

1. Navigate to https://sinuat.solsticeapp.ca/auth/login
2. Enter `viasport-staff@example.com` and password `testpassword123`
3. At MFA prompt, generate TOTP code:
   ```bash
   npx tsx -e "import { authenticator } from 'otplib'; console.log(authenticator.generate(process.env.SIN_UI_TOTP_SECRET ?? ''));"
   ```
4. Enter the 6-digit code
5. **Expected:** Successfully redirected to dashboard (NOT "Invalid code" error)
6. Confirm user lands on `/dashboard/sin` with full admin access

---

### Issue 3: Database Connectivity (Stale Bastion IP)

**Severity:** Medium (blocks database queries for fixes)
**Component:** Infrastructure / SST Tunnel

**Problem:**
SST tunnel and SST shell cannot connect to sin-uat RDS proxy. The connection fails with "server closed the connection unexpectedly" error.

**Evidence:**

```
psql: error: connection to server at "solstice-sin-uat-databaseproxy-..." (10.0.6.148), port 5432 failed:
server closed the connection unexpectedly
```

**Root Cause:**
Likely a stale bastion IP stored in SST state. The bastion EC2 instance may have been replaced but the SST tunnel is trying to connect through the old IP.

**Fix:**

1. Check current bastion IP in SST state vs actual running instance:

   ```bash
   # Get IP SST thinks is correct
   AWS_PROFILE=techdev npx sst tunnel --stage sin-uat
   # Note the IP shown (e.g., "▤  99.79.69.136")

   # Get actual running bastion IP
   AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
     --filters "Name=tag:sst:stage,Values=sin-uat" "Name=instance-state-name,Values=running" \
     --query 'Reservations[*].Instances[*].PublicIpAddress' --output text
   ```

2. If IPs don't match, force SST to refresh:

   ```bash
   # Option 1: Redeploy the VPC/bastion stack
   AWS_PROFILE=techdev npx sst deploy --stage sin-uat

   # Option 2: Use SSM port forwarding workaround (see runbook)
   ```

3. Alternative: Use SSM Session Manager directly:

   ```bash
   # Get bastion instance ID
   INSTANCE_ID=$(AWS_PROFILE=techdev aws ec2 describe-instances --region ca-central-1 \
     --filters "Name=tag:sst:stage,Values=sin-uat" "Name=instance-state-name,Values=running" \
     --query 'Reservations[0].Instances[0].InstanceId' --output text)

   # Start SSM port forward
   AWS_PROFILE=techdev aws ssm start-session \
     --target $INSTANCE_ID \
     --document-name AWS-StartPortForwardingSessionToRemoteHost \
     --parameters '{"host":["<rds-proxy-endpoint>"],"portNumber":["5432"],"localPortNumber":["15432"]}' \
     --region ca-central-1
   ```

**Verification in Deployed UAT:**

1. Start SST tunnel:

   ```bash
   AWS_PROFILE=techdev npx sst tunnel --stage sin-uat
   ```

2. In another terminal, test database connection:

   ```bash
   AWS_PROFILE=techdev npx sst shell --stage sin-uat -- psql -c "SELECT 1;"
   ```

3. **Expected:** Returns `1` without connection errors

4. Verify can query user data:
   ```bash
   AWS_PROFILE=techdev npx sst shell --stage sin-uat -- psql -c "SELECT email FROM \"user\" LIMIT 3;"
   ```

---

### Issue 4: Analytics BI Query Failure (Missing bi_readonly Role)

**Severity:** High (blocks analytics evidence)
**Component:** Database / BI governance

**Problem:**
Pivot queries in Analytics fail with error: "Failed query: SET LOCAL ROLE bi_readonly params:". The PostgreSQL role `bi_readonly` does not exist in sin-uat database.

**Evidence:**

- Screenshot `RP-AGG-005-sinuat-error-20260108.png` shows error toast
- Browser console shows 500 errors on pivot query endpoints

**Root Cause:**
The BI governance layer uses `SET LOCAL ROLE bi_readonly` to enforce row-level security. This role must be created in the database with appropriate permissions.

**Fix:**

1. Connect to sin-uat database (requires Issue 3 fix first)

2. Create the bi_readonly role:

   ```sql
   -- Create the role
   CREATE ROLE bi_readonly NOLOGIN;

   -- Grant SELECT on BI-relevant tables
   GRANT SELECT ON reporting_submissions TO bi_readonly;
   GRANT SELECT ON reporting_tasks TO bi_readonly;
   GRANT SELECT ON reporting_cycles TO bi_readonly;
   GRANT SELECT ON organizations TO bi_readonly;
   GRANT SELECT ON form_submissions TO bi_readonly;
   GRANT SELECT ON forms TO bi_readonly;

   -- Grant the role to the application user (postgres)
   GRANT bi_readonly TO postgres;

   -- Enable RLS on relevant tables (if not already)
   ALTER TABLE reporting_submissions ENABLE ROW LEVEL SECURITY;
   ```

3. Verify role exists:
   ```sql
   SELECT rolname FROM pg_roles WHERE rolname = 'bi_readonly';
   ```

**Verification in Deployed UAT:**

1. Login to https://sinuat.solsticeapp.ca as `viasport-staff@example.com` (or `pso-admin@example.com`)
2. Navigate to Analytics: `/dashboard/analytics/explore`
3. Select dataset: "Reporting Submissions"
4. Click "Total submissions" metric button
5. **Expected:** Pivot table renders with data (NOT error toast)
6. Add "Organization" to Rows
7. Click "Run query"
8. **Expected:** Table shows submission counts by organization

```javascript
// Browser console check - no BI errors
!document.body.innerText.includes('SET LOCAL ROLE')
// Should return true
```

---

### Issue 5: Audit Hash Chain Verification Failure

**Severity:** Medium (blocks audit evidence)
**Component:** Audit / Database

**Problem:**
Clicking "Verify hash chain" button on Audit log page returns 500 error.

**Evidence:**

- Browser console shows 500 errors when clicking verify button
- Same session as Issue 4 - likely related to database connectivity

**Root Cause:**
The hash chain verification queries the audit_logs table and computes SHA-256 hashes. The 500 error is likely caused by:

- Database connectivity issues (same as Issue 3)
- Or missing audit log data in sin-uat

**Fix:**

1. Ensure database connectivity works (Issue 3)

2. Check audit logs exist:

   ```sql
   SELECT COUNT(*) FROM audit_logs;
   -- Should return > 0
   ```

3. If audit logs are empty, perform some auditable actions:
   - Login/logout
   - Update an organization
   - Export data from Analytics
   - Submit a form

4. Verify hash chain integrity manually:
   ```sql
   SELECT id, created_at, prev_hash,
          encode(sha256(concat(id::text, action, actor_user_id, prev_hash)::bytea), 'hex') as computed_hash
   FROM audit_logs
   ORDER BY created_at
   LIMIT 5;
   ```

**Verification in Deployed UAT:**

1. Login to https://sinuat.solsticeapp.ca as `viasport-staff@example.com`
2. Navigate to Analytics Audit: `/dashboard/analytics/audit`
3. Click "Audit log" tab
4. Click "Verify hash chain" button
5. **Expected:** Toast shows "Hash chain valid" or detailed results (NOT 500 error)
6. Click "Export CSV" button
7. **Expected:** CSV file downloads with audit log entries

---

## Fix Sequence

The issues have dependencies. Fix in this order:

```
┌─────────────────────────────────────────────────────────────────┐
│  1. TanStack Devtools (Issue 1)                                 │
│     └─ Can be done independently via redeploy                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Database Connectivity (Issue 3)                             │
│     └─ Required for all other database fixes                    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ 3. MFA TOTP     │ │ 4. BI Role      │ │ 5. Audit Hash   │
│    (Issue 2)    │ │    (Issue 4)    │ │    (Issue 5)    │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## Complete Verification Checklist

After all fixes, run through this checklist on sin-uat:

### Pre-flight

- [ ] Clear browser cookies for sinuat.solsticeapp.ca
- [ ] Set viewport to 1440x900

### Issue 1: No Devtools

- [ ] Login page has no TanStack badge in bottom-right
- [ ] Dashboard has no TanStack badge
- [ ] Console has no TanStack initialization messages

### Issue 2: MFA Works

- [ ] Login as `viasport-staff@example.com` with password
- [ ] MFA challenge appears
- [ ] TOTP code from `SIN_UI_TOTP_SECRET` is accepted
- [ ] Lands on dashboard with full admin access

### Issue 3: Database Connected

- [ ] `npx sst tunnel --stage sin-uat` connects without error
- [ ] `npx sst shell --stage sin-uat -- psql -c "SELECT 1;"` returns 1

### Issue 4: Analytics Works

- [ ] Navigate to `/dashboard/analytics/explore`
- [ ] Select "Reporting Submissions" dataset
- [ ] Add "Total submissions" metric
- [ ] Query runs without error
- [ ] Data displays in pivot table

### Issue 5: Audit Works

- [ ] Navigate to `/dashboard/analytics/audit`
- [ ] Click "Audit log" tab
- [ ] Click "Verify hash chain" - returns result (not 500)
- [ ] Click "Export CSV" - downloads file

### Final Evidence Capture

- [ ] All screenshots captured without devtools badge
- [ ] MFA flow captured with successful login
- [ ] Analytics pivot table with data captured
- [ ] Audit log with verification result captured

---

## Related Documents

- [Final Evidence Review Plan](../../review-plans/final-evidence-review-plan.md)
- [New Environment Setup Runbook](../../../runbooks/new-environment-setup.md)
- [BI Governance Implementation](../../../quadball-plan/analytics/bi-governance.md)

---

## Updates (2026-01-08)

- Adjusted sin-uat deployment to use production build mode (NODE_ENV + build command) to hide TanStack devtools badge. (`sst.config.ts`)
- Added SIN_UI_TOTP_SECRET support for uat so MFA can be aligned with sin-uat data. (`sst.config.ts`)
- Added script to apply BI governance SQL (views + bi_readonly role) against sin-uat database. (`scripts/setup-bi-readonly-role.ts`)
- Started `npx sst dev --stage sin-uat --mode mono`; tunnel IP reported as `99.79.69.136` and tunnel accepted connections.
- DB connection test via SST_RESOURCE_Database still fails with `server closed the connection unexpectedly`, so Issue 3 remains unresolved.
- Investigated bastion mismatch: AWS shows sin-uat bastion/NAT instance `i-08c93cd0f3e081958` with public IP `3.96.36.9` (tagged `sst:is-bastion=true`), which does not match the SST tunnel IP `99.79.69.136`.
- `npx sst deploy --stage sin-uat` failed with `RangeError: Invalid string length` (Pulumi error), so the SST state could not be refreshed yet.
- Used SSM port forwarding via the bastion instance to verify DB connectivity (localhost:15432 → RDS proxy) and `SELECT 1;` succeeded.
- Generated a new TOTP secret for `viasport-staff@example.com`, encrypted it with the sin-uat `BETTER_AUTH_SECRET`, updated `twoFactor.secret`, and set SST secret `SIN_UI_TOTP_SECRET` for sin-uat.
- Ran `AWS_PROFILE=techdev sst deploy --stage sin-uat` with updated SST; no RangeError, but deploy required Docker running for `SinImportBatchTask`.
- DB connectivity confirmed via SSM port forward (localhost:15432); `SELECT 1;` succeeds.
- Applied BI governance SQL (views + `bi_readonly`) via `scripts/setup-bi-readonly-role.ts`; verified role exists and `SET LOCAL ROLE bi_readonly` can query `bi_v_reporting_submissions`.
- Verified SST is already on the latest available release (3.17.25). `pnpm view sst version` reports 3.17.25, so there is no newer version to upgrade to yet.
- Checked `sst secret list --stage sin-uat`: `SIN_UI_TOTP_SECRET` is not set, which likely triggers the hidden Pulumi error per SST issue #6141 (missing secret causes RangeError). Needs to be set before retrying deploy.

Pending verification:

- ~~Redeploy sin-uat after config changes.~~ ✅ Done 2026-01-09
- ~~Set SIN_UI_TOTP_SECRET for sin-uat from database.~~ ⚠️ Secret set but mismatch persists
- ~~Confirm DB connectivity and apply BI setup SQL.~~ ✅ Done
- ~~Re-run Analytics pivot and Audit hash chain checks.~~ ✅ Analytics works; Audit requires platform admin

---

## Updates (2026-01-09)

**CloudFront Distribution Recovery:**

- sin-uat site was inaccessible after user's deploy due to deleted CloudFront distribution
- SST state referenced non-existent distribution `EWBIDDHKOMUIL` / `dkgff20fgmx5n.cloudfront.net`
- Removed stale resources from SST state: `WebCdnDistribution`, `WebCdnARecordSinuatsolsticeappca`, `WebCdnAAAARecordSinuatsolsticeappca`
- Deleted orphaned Route53 A/AAAA records pointing to deleted CloudFront
- Redeployed sin-uat - new CloudFront distribution created automatically
- Site accessible at https://sinuat.solsticeapp.ca ✅

**Verification Results:**

| Issue                    | Status          | Notes                                                                                               |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------------- |
| 1. TanStack Devtools     | ✅ FIXED        | No devtools badge visible in production build                                                       |
| 2. MFA TOTP Secret       | ⚠️ STILL BROKEN | Local `SIN_UI_TOTP_SECRET` doesn't match sin-uat database. TOTP codes rejected.                     |
| 3. Database Connectivity | ✅ FIXED        | SSM port forwarding workaround works; SST tunnel may still have stale IP                            |
| 4. Analytics BI Role     | ✅ FIXED        | `bi_readonly` role works; pivot queries execute successfully                                        |
| 5. Audit Hash Chain      | ⚠️ PERMISSIONS  | Requires platform admin access. pso-admin gets 403 (expected). Need viasport-staff login to verify. |

**Evidence Screenshots Captured (2026-01-09):**

- `verification-login-20260109.png` - Clean login page without devtools badge
- `verification-analytics-20260109.png` - Analytics pivot builder with working query

**Remaining Work for MFA (Issue 2):**
The TOTP secret mismatch persists. To fix:

1. Query the actual encrypted TOTP secret from sin-uat database
2. Update local `SIN_UI_TOTP_SECRET` environment variable to match
3. Or regenerate and update both DB and SST secret to match

---

## Document History

| Version | Date       | Changes                                                      |
| ------- | ---------- | ------------------------------------------------------------ |
| v1.0    | 2026-01-08 | Initial ticket creation from evidence capture session        |
| v1.1    | 2026-01-09 | CloudFront recovery; verification results for Issues 1, 4, 5 |
