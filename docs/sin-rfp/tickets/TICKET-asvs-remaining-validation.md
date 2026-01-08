# TICKET: Validate Remaining ASVS 5 Controls

**Status**: In Progress (Partial Verification Complete)
**Priority**: P1 (High)
**Component**: Security / Compliance
**Date**: 2026-01-06
**Updated**: 2026-01-07
**Author**: Claude (AI Assistant)

---

## Summary

Security headers are now verified in sin-dev. The remaining ASVS 5 controls
marked "NEEDS \*" or "PARTIALLY VERIFIED" still require runtime,
infrastructure, or database verification. This ticket tracks the validation
work and evidence updates in
`docs/sin-rfp/response/asvs-5-verification-results.md`.

---

## Verification Results (2026-01-07)

**Test Environment:** sin-dev (`https://d21gh6khf5uj9x.cloudfront.net`)

### Security Headers ✅ VERIFIED

All required security headers present:

```
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline'...
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
referrer-policy: strict-origin-when-cross-origin
cross-origin-opener-policy: same-origin
cross-origin-resource-policy: same-origin
cross-origin-embedder-policy: require-corp
permissions-policy: geolocation=(), microphone=(), camera=()
```

### HTTP to HTTPS Redirects (4.1.2) ✅ VERIFIED

CloudFront viewer protocol policy redirects HTTP to HTTPS:

```bash
$ curl -I http://d21gh6khf5uj9x.cloudfront.net 2>&1 | head -5
HTTP/1.1 301 Moved Permanently
Location: https://d21gh6khf5uj9x.cloudfront.net/
```

### CORS Configuration (3.4.2, 3.5.2) ⚠️ NEEDS REVIEW

Current CORS configuration returns permissive `Access-Control-Allow-Origin: *`:

```bash
$ curl -I -X OPTIONS https://d21gh6khf5uj9x.cloudfront.net/api/health \
    -H "Origin: https://evil.com" \
    -H "Access-Control-Request-Method: POST"

access-control-allow-origin: *
access-control-allow-methods: GET, HEAD, OPTIONS
```

**Issue**: Should restrict to known origins rather than wildcard.

### Authenticated Resource Embedding (3.5.8) ❌ PARTIALLY VERIFIED

- CloudFront responses have CORP headers ✅
- S3 presigned downloads bypass CloudFront and lack CORP headers ❌
- See `TICKET-corp-s3-download-headers.md` for remediation

### Audit Logging ✅ VERIFIED

Audit log entries present with hash chain verification working:

- 197+ audit entries visible in admin UI
- Hash chain verification functional
- Entries include user actions, auth events, admin operations

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
