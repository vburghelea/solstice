# TICKET: S3 Object Lock Enablement via SST Transform (Resolved)

**Status**: Completed
**Priority**: P1
**Component**: Infrastructure / SST
**Date**: 2025-12-31
**Author**: Claude (AI Assistant)

---

## Summary

SST can enable S3 Object Lock when `objectLockEnabled` is passed during bucket
creation. Our previous configuration used a transform function that returned a
new args object; SST ignores return values and only applies mutations or object
merges. As a result, `objectLockEnabled` never reached the CreateBucket call.
After switching to the object-form transform and redeploying sin-dev, the new
SIN artifacts bucket was created with Object Lock enabled and the manual bucket
was removed.

---

## Background

S3 Object Lock is required for SIN RFP compliance (ADR D0.13) to provide WORM
(Write Once Read Many) protection for:

- DSAR export archives (14-day retention)
- Audit log archives
- Compliance documentation

Object Lock prevents objects from being deleted or overwritten for a specified
retention period, which is critical for regulatory compliance.

---

## Root Cause

1. **AWS constraint**: Object Lock must be set at bucket creation time.
2. **Transform misuse**: SST's `transform()` helper ignores return values from
   transform functions. It either merges a partial object or expects the
   function to mutate `args` in place.

**Incorrect (no effect):**

```typescript
transform: {
  bucket: (args) => ({
    ...args,
    objectLockEnabled: true,
  }),
},
```

**Correct (object merge):**

```typescript
transform: {
  bucket: {
    objectLockEnabled: true,
  },
},
```

**Correct (mutation):**

```typescript
transform: {
  bucket: (args) => {
    args.objectLockEnabled = true;
  },
},
```

---

## Resolution

- Removed the `Bucket.get()` workaround so SST owns bucket creation.
- Switched to the object-form transform so `objectLockEnabled` is applied at
  creation time.
- Deployed sin-dev to create a new SST-managed bucket with Object Lock enabled.
- Deleted the old manual bucket (`solstice-sin-dev-artifacts`) after confirming
  it was empty.

**New bucket:** `solstice-sin-dev-sinartifactsbucket-smhmnosc`

---

## Verification

```bash
AWS_PROFILE=techdev aws s3api get-object-lock-configuration \
  --bucket solstice-sin-dev-sinartifactsbucket-smhmnosc \
  --region ca-central-1
```

Output:

```
{
    "ObjectLockConfiguration": {
        "ObjectLockEnabled": "Enabled"
    }
}
```

---

## Files Modified

| File                                                                       | Change                                                                                          |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `sst.config.ts`                                                            | Use object-form transform to set `objectLockEnabled: true` and remove `Bucket.get()` workaround |
| `docs/sin-rfp/review-plans/evidence/ENCRYPTION-STATUS-sin-dev-20251231.md` | Updated Object Lock evidence                                                                    |
| `docs/sin-rfp/worklogs/WORKLOG-gap-closure.md`                             | Updated gap status and infra notes                                                              |

---

## Current Status

- [x] Object Lock enabled on `solstice-sin-dev-sinartifactsbucket-smhmnosc`
- [x] Old manual bucket deleted after confirming it was empty
- [x] Evidence updated
- [ ] For stages with existing buckets, replacement is still required to enable
      Object Lock (AWS creation-time constraint)

---

## Related Links

- AWS S3 Object Lock documentation: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html
- SST Bucket component source: `~/dev/sst/platform/src/components/aws/bucket.ts`
