# TICKET: Implement Security Headers via CloudFront Response Headers Policy

**Status**: Completed
**Priority**: P0 (Critical)
**Component**: Infrastructure / Security
**Date**: 2026-01-06
**Author**: Claude (AI Assistant)

---

## Summary

Security headers (HSTS, CSP, X-Frame-Options, etc.) are NOT being applied in
production. The `docs/SECURITY.md` claims headers are applied via "Netlify Edge
Functions" but the application uses SST/AWS Lambda deployment. This creates a
significant security gap affecting ASVS 5 controls 3.4.1-3.4.8.

---

## Background

During ASVS 5 controls matrix verification, it was discovered that:

1. `docs/SECURITY.md` references `netlify/edge-functions/security-headers.ts`
2. This file does not exist - the app uses SST/AWS deployment
3. No security headers are set at the application level
4. CloudFront is used as CDN but no Response Headers Policy is configured

The local dev server returns no security headers:

```bash
curl -sI http://localhost:5173 | grep -iE "strict|content-security|x-frame|x-content|referrer"
# (no output)
```

---

## Affected ASVS 5 Controls

| Control | Level | Requirement                       | Current Status  |
| ------- | ----- | --------------------------------- | --------------- |
| 3.4.1   | L1    | HSTS header                       | NOT IMPLEMENTED |
| 3.4.3   | L2    | Content-Security-Policy           | NOT IMPLEMENTED |
| 3.4.4   | L2    | X-Content-Type-Options: nosniff   | NOT IMPLEMENTED |
| 3.4.5   | L2    | Referrer-Policy                   | NOT IMPLEMENTED |
| 3.4.6   | L2    | frame-ancestors / X-Frame-Options | NOT IMPLEMENTED |
| 3.4.7   | L3    | CSP reporting endpoint            | NOT IMPLEMENTED |
| 3.4.8   | L3    | Cross-Origin-Opener-Policy        | NOT IMPLEMENTED |

---

## Proposed Solution

### Option A: CloudFront Response Headers Policy (Recommended)

Create a managed response headers policy in SST config:

```typescript
// sst.config.ts addition
const securityHeadersPolicy = new aws.cloudfront.ResponseHeadersPolicy("SecurityHeaders", {
  name: `solstice-${stage}-security-headers`,
  securityHeadersConfig: {
    strictTransportSecurity: {
      accessControlMaxAgeSec: 31536000,
      includeSubdomains: true,
      override: true,
      preload: isProd,
    },
    contentSecurityPolicy: {
      contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.squareup.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://connect.squareup.com https://pci-connect.squareup.com; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'; upgrade-insecure-requests",
      override: true,
    },
    contentTypeOptions: {
      override: true,
    },
    frameOptions: {
      frameOption: "DENY",
      override: true,
    },
    referrerPolicy: {
      referrerPolicy: "strict-origin-when-cross-origin",
      override: true,
    },
    xssProtection: {
      modeBlock: true,
      override: true,
      protection: true,
    },
  },
  customHeadersConfig: {
    items: [
      {
        header: "Cross-Origin-Opener-Policy",
        value: "same-origin",
        override: true,
      },
      {
        header: "Cross-Origin-Resource-Policy",
        value: "same-origin",
        override: true,
      },
      {
        header: "Permissions-Policy",
        value: "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
        override: true,
      },
    ],
  },
});
```

Then attach to CloudFront distribution via SST TanStackStart transform.

### Option B: Lambda@Edge

Add a Lambda@Edge function for origin-response that injects headers. More
complex but allows dynamic nonce generation for CSP.

---

## Implementation Steps

1. **Add CloudFront Response Headers Policy** to `sst.config.ts`
2. **Attach policy to CloudFront distribution** via TanStackStart transform
3. **Update `docs/SECURITY.md`** to reflect actual SST/AWS implementation
4. **Remove Netlify references** from documentation
5. **Verify headers** on deployed environment with curl/browser
6. **Add E2E test** to verify security headers in CI

---

## CSP Considerations

The CSP needs to allow:

- Square payment SDK: `https://js.squareup.com`, `https://connect.squareup.com`
- Google OAuth: handled via redirects, not iframe
- Inline styles: Required by some UI libraries (shadcn/tailwind)

Consider implementing nonce-based CSP via Lambda@Edge for stricter security.

---

## Testing

```bash
# Verify on deployed environment
curl -sI https://<cloudfront-url> | grep -iE "strict|content-security|x-frame|x-content|referrer|cross-origin"

# Expected output:
# strict-transport-security: max-age=31536000; includeSubDomains; preload
# content-security-policy: default-src 'self'; ...
# x-content-type-options: nosniff
# x-frame-options: DENY
# referrer-policy: strict-origin-when-cross-origin
# cross-origin-opener-policy: same-origin
```

---

## Acceptance Criteria

- [ ] All 7 security headers present on production responses
- [ ] HSTS max-age >= 31536000 (1 year)
- [ ] CSP blocks inline scripts (except nonce-based if implemented)
- [ ] X-Frame-Options: DENY or CSP frame-ancestors: 'none'
- [ ] `docs/SECURITY.md` updated to reflect actual implementation
- [ ] E2E test validates headers in CI pipeline

---

## References

- `docs/sin-rfp/response/asvs-5-verification-results.md` - Verification findings
- `docs/SECURITY.md` - Current (outdated) documentation
- `sst.config.ts` - SST deployment configuration
- [AWS CloudFront Response Headers Policies](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-response-headers.html)
- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
