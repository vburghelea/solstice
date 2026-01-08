# ASVS 5 Controls Implementation Plan

**Created**: 2026-01-07
**Status**: Ready for implementation

## Overview

This plan addresses 19 ASVS 5 controls across verification, configuration, code changes, and documentation updates.

## Review Addendum (2026-01-08)

This section captures plan-review concerns and open questions that must be
addressed before implementation.

### Concerns

- 5.4.1/5.4.2 are not N/A: server-side signed S3 downloads set
  `ResponseContentDisposition` with user filenames and need RFC 6266 handling.
- `__Host-` cookies will break if `COOKIE_DOMAIN` is set or when running on HTTP
  (local). Runtime evidence currently shows `__Secure-solstice.*`; confirm actual
  cookie naming and avoid invalid prefixes.
- Common-password checks are only enforced on sign-up; change/reset flows bypass
  server validation unless hooks are added.
- Session timeout documentation in the plan does not match actual settings
  (8h lifetime, 30m updateAge, 15m step-up window).
- CSP report endpoint example does not follow existing route patterns, returns
  a body with 204, and lacks size/PII controls; `report-uri` is deprecated.
- HSTS preload is irreversible and requires a custom domain with HTTPS on all
  subdomains; CloudFront domains are not eligible.
- CSV formula-injection escaping should handle leading whitespace and header
  labels while avoiding unintended changes to numeric exports.
- Authorization docs should align with actual role model and permission keys
  (global roles, org roles, scoped roles, permission strings like
  `analytics.export`).
- A 10k common-password list should be server-only to avoid client bundle bloat;
  consider a smaller client hint set if needed.

### Open Questions

- Is `COOKIE_DOMAIN` set in any deployed stage, and do we need cross-subdomain
  cookies? (If yes, `__Host-` is not viable.)
- Which exact custom domain(s) should be submitted for HSTS preload, and are all
  subdomains HTTPS-only?
- Is email/password sign-up allowed on sin-uat, or should tests use pre-seeded
  accounts instead?
- Do we want to keep a smaller client-side common-password list for UX, with the
  full list enforced server-side only?
- What are the authoritative business-logic limits to document (file upload
  sizes, import row limits, pagination caps)? Use code sources, not placeholders.

---

## PART 1: Quick Verifications (Already Verified via Code Analysis)

These controls are **already satisfied** based on Better Auth source code analysis. Update documentation only.

### 7.2.3 - Session Token Entropy ≥128 bits

- **Status**: ✅ VERIFIED
- **Evidence**: Better Auth uses `generateId(32)` with 62-char alphabet = **190 bits entropy**
- **Source**: `node_modules/better-auth/dist/db/internal-adapter.mjs:139`
- **Action**: Document in verification results

### 6.5.3 - CSPRNG for Backup Codes

- **Status**: ✅ VERIFIED
- **Evidence**: Uses `crypto.getRandomValues()` with rejection sampling
- **Source**: `node_modules/@better-auth/utils/dist/random.mjs`
- **Action**: Document in verification results

### 6.5.4 - Backup Code Entropy ≥20 bits

- **Status**: ✅ VERIFIED
- **Evidence**: 10-char alphanumeric = **59.5 bits entropy** (well above 20 bits)
- **Source**: `node_modules/better-auth/dist/plugins/two-factor/backup-codes/index.mjs:14`
- **Action**: Document in verification results

### 6.5.8 - TOTP Uses Server Time

- **Status**: ✅ VERIFIED
- **Evidence**: TOTP verification is server-side via Better Auth
- **Action**: Document in verification results

---

## PART 2: Runtime Verifications (Need E2E Tests)

### 6.2.8 - Password Preserved Exactly

- **Test**: Create account with password containing leading/trailing spaces
- **Expected**: Spaces are preserved, login works with exact password
- **Method**: Playwright MCP test on sin-uat

### 6.2.9 - 64+ Character Passwords Allowed

- **Test**: Create account with 65+ character password
- **Expected**: Signup succeeds, login works
- **Method**: Playwright MCP test on sin-uat

---

## PART 3: Configuration Changes

### 3.4.7 - CSP Reporting Endpoint

**Decision**: Local `/api/csp-report` endpoint with size cap and minimal logging.

**Step 1**: Create new API route (TanStack Start file route pattern):

```
src/routes/api/csp-report.ts
```

```typescript
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/csp-report")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const report = await request.json();
          // Log to CloudWatch (console.log in Lambda = CloudWatch)
          console.log("[CSP Violation]", JSON.stringify(report));
          return new Response(null, { status: 204 });
        } catch {
          return new Response(JSON.stringify({ error: "Invalid report" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
```

**Step 2**: Update CSP in `sst.config.ts` (line 357):

- Add `"report-uri /api/csp-report"` for legacy support.
- Consider adding `"report-to csp-endpoint"` plus a `Reporting-Endpoints` (or
  `Report-To`) header via `customHeadersConfig` for modern reporting.

**Step 3**: Add basic protections:

- Cap request body size (e.g., 64kb) and drop oversized reports.
- Redact or whitelist fields before logging to avoid logging URLs or PII.

### 3.7.4 - HSTS Preload

**Current**: Already enabled with `preload: isProd` in `sst.config.ts:368`
**Action**:

1. Confirm the custom domain(s) to preload (CloudFront domains are not eligible)
2. Ensure all subdomains are HTTPS-only and `includeSubDomains` is acceptable
3. Check https://hstspreload.org for current domain status
4. Submit domain if not already preloaded
5. Document status in verification results

### 3.3.3 - `__Host-` Cookie Prefix

**Decision**: Use `__Host-` only for HTTPS + host-only cookies. Otherwise prefer
`__Secure-` (HTTPS with domain allowed) or no prefix (local HTTP).

**File**: `src/lib/auth/server-helpers.ts` (line 334)

**Pre-checks**:

- Confirm current runtime cookie names (verification results show
  `__Secure-solstice.*`).
- Confirm whether `COOKIE_DOMAIN` is set in any stage (if set, `__Host-` is
  invalid).

**Note**: `__Host-` prefix requires:

- `Secure` attribute (already set for HTTPS)
- `Path=/` (already set)
- No `Domain` attribute (need to verify/remove)

**Change** (conditional prefix and attributes):

```typescript
const cookiePrefix = isHttpsDeployment
  ? cookieDomain
    ? "__Secure-solstice"
    : "__Host-solstice"
  : "solstice";

// ...
advanced: {
  cookiePrefix,
  useSecureCookies: isHttpsDeployment,
  defaultCookieAttributes: {
    secure: isHttpsDeployment,
    sameSite: "lax",
    httpOnly: true,
    path: "/",
    ...(cookieDomain && cookiePrefix !== "__Host-solstice"
      ? { domain: cookieDomain }
      : {}),
  },
},
```

**Additional change**: Ensure any cookies that must be shared across subdomains
keep `Domain` and use `__Secure-` instead of `__Host-`.
defaultCookieAttributes: {
secure: isHttpsDeployment,
sameSite: "lax",
httpOnly: true,
path: "/",
// Remove domain attribute for \_\_Host- prefix
},

````

---

## PART 4: Code Changes

### 1.2.10 - CSV Formula Injection Prevention
**File**: `src/shared/lib/csv.ts`

**Current** (lines 1-7):
```typescript
const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const stringValue = typeof value === "string" ? value : JSON.stringify(value, (_key, val) => val);
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
};
````

**Change to**:

```typescript
const FORMULA_INJECTION_PATTERN = /^[\s\u0000]*[=+\-@]/;

const escapeCsvValue = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const stringValue = typeof value === "string" ? value : JSON.stringify(value, (_key, val) => val);

  // Escape formula injection for string values only (avoid changing numbers)
  const sanitized =
    typeof value === "string" && FORMULA_INJECTION_PATTERN.test(stringValue)
      ? `'${stringValue}`
      : stringValue;

  const escaped = sanitized.replace(/"/g, '""');
  return `"${escaped}"`;
};
```

**Also update**: `src/lib/utils/csv-export.ts` with the same pattern, including
header labels.

### 5.4.1/5.4.2 - Filename Sanitization (RFC 6266)

**Finding**: Server-side signed downloads set `Content-Disposition` with
user-supplied filenames.
**Action**: Sanitize/encode filenames per RFC 6266 for signed downloads:

- `src/features/forms/forms.queries.ts`
- `src/features/support/support.queries.ts`
- `src/features/templates/templates.mutations.ts`

Create a shared helper (e.g., `src/lib/utils/content-disposition.ts`):

```typescript
const sanitizeFilename = (filename: string): string =>
  filename.replace(/[^\w.\-]/g, "_");

export const buildContentDisposition = (
  filename: string,
  disposition: "attachment" | "inline" = "attachment",
): string => {
  const sanitized = sanitizeFilename(filename);
  const encoded = encodeURIComponent(sanitized);
  return `${disposition}; filename="${sanitized}"; filename*=UTF-8''${encoded}`;
};
```

### 6.2.4 - Common Password Check

**Decision**: Use 10,000 password list

**Files to modify**:

1. `src/lib/security/common-passwords.ts` (new file)
2. `src/lib/security/utils/password-validator.ts`

**Step 1**: Create common passwords list (top 10,000):

```typescript
// src/lib/security/common-passwords.ts
// Use a Set for O(1) lookup
export const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123",
  // ... top 10,000 passwords
]);

export const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.has(password.toLowerCase());
};
```

**Step 2**: Update validator:

```typescript
// Add to validatePassword() in password-validator.ts
import { isCommonPassword } from "../common-passwords";

// Add check after existing validations:
if (isCommonPassword(password)) {
  errors.push("This password is too common. Please choose a more unique password.");
}
```

**Step 3**: Enforce server-side checks for change/reset flows:

- Sign-up is already guarded in `securityEventPlugin`.
- Add a hook for `/reset-password` (confirm Better Auth path) to validate server-side.
- Validate in `changePassword` server function before calling
  `auth.api.changePassword`.
- Keep the 10k list server-only (dynamic import or separate server module) to
  avoid client bundle bloat; optionally keep a small client hint list for UX.

**Data source**: Use https://github.com/danielmiessler/SecLists/blob/master/Passwords/Common-Credentials/10k-most-common.txt

### 6.2.5 - Remove Password Composition Rules

**Files to modify**:

1. `src/lib/security/password-config.ts`
2. `src/lib/security/utils/password-validator.ts`
3. `src/features/settings/settings.schemas.ts`
4. `docs/SECURITY.md`

**Step 1**: Update config:

```typescript
// src/lib/security/password-config.ts
export const PASSWORD_CONFIG = {
  minLength: 8,
  requireUppercase: false,  // Changed
  requireLowercase: false,  // Changed
  requireNumbers: false,    // Changed
  requireSpecialChars: false, // Changed
} as const;
```

**Step 2**: Simplify validator (`password-validator.ts`):

```typescript
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
  }

  // Common password check (new)
  if (isCommonPassword(password)) {
    errors.push("This password is too common. Please choose a more unique password.");
  }

  return { isValid: errors.length === 0, errors };
}
```

**Step 3**: Simplify settings.schemas.ts:

```typescript
const passwordRequirements = z
  .string({ error: (issue) => (issue.input === undefined ? "Password is required" : undefined) })
  .min(PASSWORD_CONFIG.minLength, `Password must be at least ${PASSWORD_CONFIG.minLength} characters long`);
// Remove superRefine with composition checks
```

**Step 4**: Update `getPasswordStrength()` to focus on length and common password check:

```typescript
export function getPasswordStrength(password: string): number {
  if (isCommonPassword(password)) return 0;

  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (password.length >= 20) strength++;
  if (password.length >= 24) strength++;

  return Math.min(strength, 5);
}
```

**Also update**: any user-facing password requirement copy (see `docs/SECURITY.md`
and UI error strings) to remove composition rules.

---

## PART 5: Documentation Updates

### Files to update: `docs/SECURITY.md`

### 8.1.1 - Authorization Rules Documentation

Add new section after "Content Security Policy":

```markdown
## Authorization Rules

The application uses role-based access control (RBAC) with global, organization,
and scoped roles. Permissions are stored on roles and enforced server-side.

### Role Types
- **Global roles**: Tenant-configured admin roles (e.g., Solstice Admin,
  viaSport Admin)
- **Organization roles**: owner, admin, reporter, viewer, member (org-scoped)
- **Scoped roles**: Team Admin, Event Admin (team/event-specific)

### Permission Model
- **Permissions**: Stored on roles, enforced server-side (PermissionService)
- **Examples**: `analytics.export`, `analytics.admin`, `pii.read`, `*`

### Access Control Layers
1. **Auth Guard**: Valid session required
2. **Org Guard**: Organization membership + role checks
3. **Permission Check**: Permission strings enforced in server functions
4. **Step-up Auth**: Sensitive operations require recent auth (15 minutes)

Note: Client-side role checks are UI-only; authorization happens server-side.
```

### 7.1.1 - Session Timeout Policy

Add to existing Cookie Configuration section:

```markdown
### Session Timeouts
- **Session lifetime**: 8 hours (`session.expiresIn`)
- **Session refresh**: Every 30 minutes (`session.updateAge`)
- **Step-up window**: 15 minutes for sensitive operations
- **Admin sessions**: No separate cap; MFA required for global admin roles

Rationale: Balances security (short sessions + step-up) with usability (8-hour
workday).
```

### 6.1.3 - Authentication Pathways

Add new section:

```markdown
## Authentication Pathways

### Supported Methods
1. **Email/Password**: Primary method with password validation
2. **Google OAuth**: SSO with optional domain restriction
3. **MFA (TOTP)**: Required for global admin roles, optional for others

### Security Controls Per Pathway
| Pathway | Rate Limit | MFA | Email Verification |
|---------|------------|-----|-------------------|
| Email/Password | 5/15min | Required for global admin roles | Required (prod) |
| Google OAuth | 5/15min | Required for global admin roles | Via Google |

### MFA Enforcement
- Global admin roles: MFA required (role management + guards)
- Organization roles: MFA optional
- Step-up auth requires recent MFA when enabled
```

### 2.1.1 - Input Validation Rules

Add new section:

```markdown
## Input Validation Rules

### Validation Strategy
All input is validated server-side using Zod schemas. Client-side validation provides UX feedback only.

### Standard Validations
- **Email**: RFC 5322 format, lowercase normalized
- **Password**: Minimum 8 characters, checked against common-password list
- **Names**: 1-100 characters, trimmed
- **IDs**: UUID v4 format
- **Dates**: ISO 8601 format
- **Currency**: Integer cents, non-negative
```

### 2.1.3 - Business Logic Limits

Add to Rate Limiting section:

```markdown
### Business Logic Limits
- **Support attachments**: 10MB max per file, 3 files max per request
- **Form uploads**: per-field config; default 10MB/1 file (builder default 5MB)
- **BI query rows**: 10,000 max for UI queries (`QUERY_GUARDRAILS.maxRowsUi`)
- **BI export rows**: 100,000 max (`QUERY_GUARDRAILS.maxRowsExport`)
- **API pagination**: per-endpoint caps via Zod schemas (document each where used)
- **Bulk imports**: no explicit row cap today; document once enforced
- **Concurrent sessions**: No hard limit (implicit via session table)
```

---

## PART 6: ASVS Matrix & Verification Results Updates

### Update `docs/sin-rfp/response/asvs-5-verification-results.md`

Add verification evidence for all items completed in this plan.

### Update `docs/sin-rfp/response/asvs-5-controls-matrix.md`

Change status for each control:

- 7.2.3, 6.5.3, 6.5.4, 6.5.8 → "Verified"
- 6.2.8, 6.2.9 → "Verified" (after E2E tests)
- 3.4.7 → "Implemented" or "Verified"
- 3.7.4 → "Verified"
- 3.3.3 → "Implemented"
- 1.2.10 → "Implemented"
- 5.4.1/5.4.2 → "Implemented" (sanitize signed download filenames)
- 6.2.4 → "Implemented"
- 6.2.5 → "Implemented" (composition rules removed)
- 8.1.1, 7.1.1, 6.1.3, 2.1.1, 2.1.3 → "Implemented" (documented)

---

## Execution Order

1. **Verifications first** (no code changes, just document)
   - 7.2.3, 6.5.3, 6.5.4, 6.5.8

2. **E2E tests** (Playwright MCP)
   - 6.2.8, 6.2.9

3. **Config changes** (low risk)
   - 3.4.7 CSP reporting
   - 3.7.4 HSTS preload check
   - 3.3.3 `__Host-` cookie prefix

4. **Code changes** (higher risk, need testing)
   - 1.2.10 CSV formula injection
   - 5.4.1/5.4.2 Filename sanitization (signed downloads)
   - 6.2.4 Common password check
   - 6.2.5 Remove composition rules

5. **Documentation**
   - Update SECURITY.md with all new sections
   - Update ASVS matrix and verification results

---

## Files Modified Summary

| File                                                   | Changes                                                   |
| ------------------------------------------------------ | --------------------------------------------------------- |
| `sst.config.ts`                                        | Add CSP reporting directives + Reporting-Endpoints header |
| `src/routes/api/csp-report.ts`                         | New API route for CSP violations                          |
| `src/lib/auth/server-helpers.ts`                       | Conditional cookie prefix + auth hooks                    |
| `src/shared/lib/csv.ts`                                | Add formula injection escaping                            |
| `src/lib/utils/csv-export.ts`                          | Add formula injection escaping                            |
| `src/lib/utils/content-disposition.ts`                 | New RFC 6266 filename helper                              |
| `src/features/forms/forms.queries.ts`                  | Sanitize download filenames                               |
| `src/features/support/support.queries.ts`              | Sanitize download filenames                               |
| `src/features/templates/templates.mutations.ts`        | Sanitize download filenames                               |
| `src/lib/security/common-passwords.ts`                 | New file with 10k password list                           |
| `src/lib/security/password-config.ts`                  | Disable composition rules                                 |
| `src/lib/security/utils/password-validator.ts`         | Remove composition, add common check                      |
| `src/features/settings/settings.schemas.ts`            | Remove composition validation                             |
| `src/features/settings/settings.mutations.ts`          | Enforce server-side password checks                       |
| `docs/SECURITY.md`                                     | Add 5 new documentation sections                          |
| `docs/sin-rfp/response/asvs-5-verification-results.md` | Add verification evidence                                 |
| `docs/sin-rfp/response/asvs-5-controls-matrix.md`      | Update control statuses                                   |

---

## Risk Assessment

| Change                      | Risk                                                               | Mitigation                                                     |
| --------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `__Host-` cookie prefix     | High - can invalidate cookies and break local/cross-subdomain auth | Conditional prefixing; test on sin-uat + localhost             |
| HSTS preload submission     | High - irreversible, can brick subdomains                          | Confirm custom domain + HTTPS-only subdomains before submit    |
| CSP report endpoint         | Medium - log spam or PII leakage                                   | Size cap, redaction, allowlist fields                          |
| Filename sanitization       | Low - filenames may change                                         | Add `filename*` with encoded value + safe fallback             |
| CSV formula escaping        | Low - can alter Excel interpretation                               | Apply to string values only; add tests with leading whitespace |
| Remove password composition | Low - relaxes requirements                                         | Common password check compensates                              |
| Common password list        | Medium - bundle size/perf if client-shipped                        | Server-only list, dynamic import                               |
