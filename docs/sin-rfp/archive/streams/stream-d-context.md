# Stream D Context - Forms Integrity and File Security

## Sources

- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/3-implementation.md` (Phase 1 - Forms data integrity and file security)
- `docs/sin-rfp/archive/superseded/5.2-pro-review-output/d0-decision-analysis.md` (D0.4 multi-file decision)

## Implementation Guidance (from 3-implementation.md)

- Enforce submitted validity: reject `status="submitted"` when `missingFields` or
  `validationErrors` exist in `submitForm` and `updateFormSubmission`.
- Make validation field-type aware: introduce an `isFieldEmpty` helper to handle
  checkbox, multiselect, and file required checks; treat `NaN` as invalid for number
  fields; use `parseFileFieldValue` + `validateFileField` for file constraints.
- Guard regex validation: add schema validation for pattern rules and wrap `RegExp`
  construction in try/catch on both client and server.
- Fix completeness score: compute denominator based on active fields (or active
  required fields) rather than `definition.fields.length`.
- Preserve description on update: only overwrite description when provided in the
  patch.
- Enforce form settings: if `requireApproval`, translate submitted status to
  `under_review`; if `notifyOnSubmit`, send notifications to listed user IDs.
- Secure file submissions: validate `storageKey` with
  `isValidStorageKeyPrefix("forms/<formId>/")`; optional future hardening is a
  `form_uploads` table to track expected uploads.
- Enforce `fieldKey` correctness in `createFormUpload` (must exist and be a file field).
- Decide multi-file behavior: either implement multi-file end-to-end or clamp
  `maxFiles` to 1 and hard-fail array payloads.
- Access control + audit: distinguish submitter vs reviewer/admin access for
  list/view/update/download endpoints; add audit logging on file download URL issuance.

## Decisions (from d0-decision-analysis.md)

- D0.4 accepted decision is to clamp multi-file support to `maxFiles = 1` until a
  full multi-file pipeline exists. Array payloads should be rejected to avoid
  validation bypass and crashes.
