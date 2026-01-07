# TICKET: Validate Remaining ASVS 5 Controls

**Status**: Open
**Priority**: P1 (High)
**Component**: Security / Compliance
**Date**: 2026-01-06
**Author**: Claude (AI Assistant)

---

## Summary

Security headers are now verified in sin-dev. The remaining ASVS 5 controls
marked "NEEDS \*" or "PARTIALLY VERIFIED" still require runtime,
infrastructure, or database verification. This ticket tracks the validation
work and evidence updates in
`docs/sin-rfp/response/asvs-5-verification-results.md`.

---

## Scope

### Runtime Verification

1. **1.1.1 Canonicalization (L2)**
   - Send double-encoded payloads (`%2e%2e%2f`, `%252e%252e%252f`, `%3cscript%3e`)
     to representative server functions and confirm single decode.
2. **1.5.3 Parser Consistency (L3)**
   - Use a dataset with UTF-8, mixed line endings, and special characters.
   - Compare CSV vs XLSX parsing outputs.
3. **3.3.5 Cookie Size (L3)**
   - Login and measure cookie sizes to confirm <4096 bytes.
4. **3.4.2 CORS Allowlist (L1)**
   - Preflight request against sin-dev to confirm origin allowlist behavior.
5. **3.5.2 CORS Preflight Enforcement (L1)**
   - Cross-origin POST using `Content-Type: text/plain` to confirm enforcement.
6. **6.4.3 Password Reset with MFA (L2)**
   - Enable MFA, reset password, ensure MFA still required after reset.
7. **7.2.4 Session Rotation (L1)**
   - Login twice and verify session token changes.
8. **10.2.3 OAuth Scope Minimization (L3)**
   - Capture Google OAuth authorization URL and confirm scopes.

### Infrastructure Verification

1. **4.1.2 HTTP to HTTPS Redirects (L2)**
   - Verify CloudFront viewer protocol policy is redirect-to-https.
2. **5.3.1 Untrusted File Execution (L1)**
   - Confirm S3 artifacts bucket has no website hosting enabled.
3. **3.4.x Security Headers in Production**
   - Deploy the CloudFront response headers policy to sin-prod and confirm
     headers match sin-dev.

### Database Verification

1. **6.5.2 Backup Code Storage (L2)**
   - Inspect `twoFactor.backupCodes` storage format (hashed vs plaintext).

### Dependent Validation (Post-Implementation)

1. **3.5.8 Authenticated Resource Embedding (L3)**
   - Validate CORP coverage for signed S3 downloads after implementing
     `docs/sin-rfp/tickets/TICKET-corp-s3-download-headers.md`.

---

## Acceptance Criteria

- Evidence added to
  `docs/sin-rfp/response/asvs-5-verification-results.md` for each item above.
- Each control status updated to VERIFIED - PASS, PARTIALLY VERIFIED, or
  NOT IMPLEMENTED with concrete evidence.
- Production security headers verified and documented.

---

## References

- `docs/sin-rfp/response/asvs-5-verification-results.md`
- `docs/sin-rfp/tickets/TICKET-corp-s3-download-headers.md`
- `docs/SECURITY.md`
