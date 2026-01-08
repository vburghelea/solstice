# TICKET: Apply CORP Headers to Signed S3 Downloads

**Status**: Open (Issue Confirmed)
**Priority**: P1 (High)
**Component**: Infrastructure / Security
**Date**: 2026-01-06
**Updated**: 2026-01-07
**Author**: Codex (AI Assistant)

---

## Summary

Cross-Origin-Resource-Policy (CORP) headers are now applied at the CloudFront
distribution for the TanStack Start app, but signed S3 downloads bypass
CloudFront and do not receive CORP headers. ASVS 5 control 3.5.8 remains
partially unmet for authenticated file downloads.

---

## Verification Results (2026-01-07)

**Test Environment:** sin-dev

### Issue Confirmed ❌

S3 presigned URLs bypass CloudFront and serve files directly from S3:

**Artifacts bucket:** `solstice-sin-dev-sinartifactsbucket-smhmnosc.s3.ca-central-1.amazonaws.com`

```bash
# S3 direct response headers (no CORP):
$ curl -I "https://solstice-sin-dev-sinartifactsbucket-smhmnosc.s3.ca-central-1.amazonaws.com/..."

Content-Type: application/octet-stream
x-amz-server-side-encryption: AES256
# NO cross-origin-resource-policy header
```

**CloudFront response headers (has CORP):**

```bash
$ curl -I https://d21gh6khf5uj9x.cloudfront.net/

cross-origin-resource-policy: same-origin
cross-origin-opener-policy: same-origin
cross-origin-embedder-policy: require-corp
```

### Impact

- File downloads (forms, templates, exports) lack CORP protection
- ASVS 5 control 3.5.8 partially unmet
- Low actual security risk (presigned URLs are time-limited and authenticated)

---

## Background

- Signed download URLs are generated in multiple features (forms, templates,
  support, privacy) using `@aws-sdk/s3-request-presigner`.
- Downloads are served directly from the S3 artifacts bucket
  (`SIN_ARTIFACTS_BUCKET`), not through CloudFront.
- S3 presigned URLs do not support CORP headers via response overrides or
  object metadata, so headers must be applied by a proxy or CDN.

---

## Options

### Option A: CloudFront in front of artifacts bucket (recommended)

- Create a dedicated CloudFront distribution with OAC.
- Apply a response headers policy (CORP + related headers).
- Swap presigned S3 URLs for signed CloudFront URLs/cookies.

### Option B: Proxy downloads through the app

- Add server endpoint(s) that stream S3 objects.
- Inject CORP headers in the app response.
- Requires auth checks and careful caching controls.

---

## Implementation Steps

1. Inventory signed download endpoints and target buckets.
2. Choose distribution vs app-proxy approach.
3. Apply CORP to download responses.
4. Update docs/verification evidence for ASVS 3.5.8.

---

## Acceptance Criteria

- CORP header present on authenticated file download responses.
- Evidence captured for ASVS 3.5.8.
- Documentation updated to reflect the download path.

---

## References

- `src/features/forms/forms.queries.ts`
- `src/features/templates/templates.mutations.ts`
- `src/features/support/support.queries.ts`
- `src/features/privacy/privacy.queries.ts`
- `docs/sin-rfp/response/asvs-5-verification-results.md`
