# CI Security & Quality Findings

**Date**: 2026-01-08
**Status**: In progress (only dependency follow-up remains)
**Priority**: High (contains Critical findings)

## Summary

Comprehensive audit of all CI workflow findings across CodeQL, Aikido, ZAP, and
ESLint. Total of **54 findings** requiring review.

**Current status**: Core code issues remediated. Remaining items are dependency
watch items (xlsx update availability) and expected ZAP dev-mode warnings.

| Workflow     | Critical | High  | Medium  | Low/Info | Total  |
| ------------ | -------- | ----- | ------- | -------- | ------ |
| Aikido       | 2        | 2     | 4+      | -        | 21     |
| CodeQL       | -        | 1     | 10      | 1        | 12     |
| ZAP Baseline | -        | -     | -       | 11       | 11     |
| ESLint       | -        | -     | -       | 10       | 10     |
| **Total**    | **2**    | **3** | **14+** | **22**   | **54** |

---

## Critical Priority

### 1. SQL Injection via String Concatenation (Aikido - Critical)

**Files**:

- `src/features/bi/engine/pivot-sql-compiler.ts`
- `src/features/bi/engine/bi.sql-executor.ts`
- 1 other file

**Issue**: Potential SQL injection via string-based query concatenation.

**Impact**: Attackers could execute arbitrary SQL queries, leading to data breach or destruction.

**Resolution**:

- Hardened identifier handling + time grain validation in pivot SQL builder
- Replaced unsafe SQL string interpolation for `SET LOCAL` statements with
  parameterized SQL

**Files updated**:

- `src/features/bi/engine/pivot-sql-compiler.ts`
- `src/features/bi/engine/sql-identifiers.ts` (new helper)
- `src/features/bi/bi.sql-executor.ts`
- `src/features/bi/bi.queries.ts`
- `src/features/bi/governance/sql-workbench-gate.ts`

- Use parameterized queries exclusively
- Review all string concatenation in SQL building logic
- Add input validation/sanitization

**Status**: Resolved

---

### 2. Open Redirect (Aikido - Critical)

**File**: `src/tenant/feature-gates.ts`

**Issue**: Open redirect can be used in social engineering attacks.

**Impact**: Attackers can craft URLs that redirect users to malicious sites while
appearing to come from your domain.

**Resolution**:

- Added internal-path guard to prevent external scheme redirects

**File updated**: `src/tenant/feature-gates.ts`

**Status**: Resolved

---

## High Priority

### 3. Clear-text Logging of Sensitive Data (CodeQL - Error)

**File**: `e2e/helpers/global-setup.ts:32`

**Issue**: Sensitive data (likely test credentials) logged in plaintext.

**Resolution**:

- Removed account email from worker assignment log line

**File updated**: `e2e/helpers/global-setup.ts`

**Status**: Resolved

---

### 4. xlsx Prototype Pollution (Aikido - High)

**Package**: `xlsx` dependency

**Issue**: Abuse of JavaScript's prototype API possible (Prototype Pollution).

**Impact**: Could allow attackers to modify object prototypes, leading to denial
of service or remote code execution.

**Resolution**:

- Added JSON key sanitization on XLSX imports to drop `__proto__` /
  `constructor` / `prototype`

**Files updated**:

- `src/shared/lib/json.ts`
- `src/lib/imports/file-utils.ts`
- `src/features/imports/imports.utils.ts`

**Status**: Mitigated (no patched xlsx version available; monitor for updates)

**Estimated Fix Time**: 30 min

---

### 5. File Inclusion Attack (Aikido - High)

**File**: `update-code-guide.mjs`

**Issue**: Potential file inclusion attack via reading file.

**Resolution**:

- Added root-path guard + symlink skip for file traversal in
  `scripts/update-code-guide.mjs`

**Status**: Resolved

**Estimated Fix Time**: 1 hr

---

## Medium Priority

### 6. Shell Command Injection (CodeQL - Warning)

**File**: `scripts/generate-erd.js:48, 60, 74`

**Issue**: Environment variables passed unsanitized to shell commands.

**Resolution**:

- Swapped `execSync` calls to `execFileSync` with explicit args
- Removed shell `rm` usage in favor of `unlinkSync`

**File updated**: `scripts/generate-erd.js`

**Status**: Resolved

---

### 7. File System Race Condition (CodeQL - Warning)

**Files**:

- `scripts/generate-erd.js:84`
- `scripts/generate-auth-secret.js:64`

**Issue**: TOCTOU (time-of-check to time-of-use) race between file existence
check and file operation.

**Resolution**:

- Removed pre-checks and switched to read/try handling for env files

**File updated**: `scripts/generate-auth-secret.js`

**Status**: Resolved

---

### 8. Docker Container Root User (Aikido - Medium)

**File**: `import-batch.Dockerfile`

**Issue**: Docker container runs as default root user.

**Resolution**:

```dockerfile
RUN adduser -D appuser
USER appuser
```

**File updated**: `docker/import-batch.Dockerfile`

**Status**: Resolved

---

### 9. MCP SDK Session Credential Reuse (Aikido - Medium)

**Package**: `@modelcontextprotocol/sdk`

**Issue**: Attacker can reuse old session credentials.

**Resolution**:

- Added pnpm override to force patched SDK version

**File updated**: `package.json`

**Status**: Resolved

**Estimated Fix Time**: 30 min

---

### 10. Rollup XSS Vulnerability (Aikido - Medium)

**Package**: `rollup`

**Issue**: XSS attack possible.

**Resolution**:

- Added pnpm override to force latest Rollup version

**File updated**: `package.json`

**Status**: Resolved

**Estimated Fix Time**: 1 hr

---

### 11. Exposed Secret (Aikido - Medium)

**Issue**: 1 exposed secret detected.

**Resolution**:

- Removed plaintext secrets from `.env` / `.env.e2e`
- Moved values to SST secrets for `sin-dev` and documented storage locations

**Files updated**:

- `.env`
- `.env.e2e`
- `.env.e2e.example`
- `CLAUDE.md`
- `docs/runbooks/new-environment-setup.md`
- `docs/sin-rfp/worklogs/master.md`
- `docs/sin-rfp/archive/streams/stream-a.md`
- `docs/sin-rfp/archive/streams/stream-j-context.md`
- `docs/sin-rfp/evaluator-access-pack.md`
- `docs/sin-rfp/review-plans/ux-review-plan.md`
- `docs/issues/TOTP-VERIFICATION-FAILURE.md`
- `sst.config.ts`
- `scripts/seed-e2e-data.ts`

**Status**: Resolved

---

### 12. Missing Regexp Anchor (CodeQL - Warning)

**Files**:

- `src/nitro/aws-lambda-streaming.mjs:146`
- `src/nitro/aws-lambda-response.mjs:146`

**Issue**: Regex without `^`/`$` anchors may match unintended strings.

**Note**: These are in generated/vendored Nitro files. May need to be addressed
upstream or ignored.

**Status**: Won't fix (vendored)

---

### 13. Incompatible Type Comparison (CodeQL - Warning)

**File**: `src/features/forms/forms.utils.ts:307`

**Issue**: Comparing values of different types.

**Resolution**:

- Introduced typed guard helper for file payload parsing

**File updated**: `src/features/forms/forms.utils.ts`

**Status**: Resolved

---

## Low Priority / Informational

### 14. Useless Variable Assignments (CodeQL - Warning)

**Files**:

- `src/lib/notifications/send.ts:248`
- `src/lib/imports/batch-runner.ts:121`

**Issue**: Variables assigned but never read (dead code).

**Resolution**: Removed unused assignments.

**Files updated**:

- `src/lib/notifications/send.ts`
- `src/lib/imports/batch-runner.ts`

**Status**: Resolved

---

### 15. Unused Local Variable (CodeQL - Note)

**File**: `src/lib/email/sendgrid.ts:79`

**Issue**: Unused variable (dead code).

**Resolution**: Removed unused variable.

**File updated**: `src/lib/email/sendgrid.ts`

**Status**: Resolved

---

### 16. React Best Practice Violations (ESLint - 10 warnings)

**Location**: `src/features/bi/components/dashboard/`

| File                        | Line | Issue                                       |
| --------------------------- | ---- | ------------------------------------------- |
| `AddWidgetModal.tsx`        | 76   | setState in useEffect (setDatasetId)        |
| `AddWidgetModal.tsx`        | 81   | setState in useEffect (setFilterField)      |
| `DashboardCanvas.tsx`       | 28   | Array as default prop                       |
| `DashboardExportDialog.tsx` | 56   | setState in useEffect (setSelectedWidgetId) |
| `DashboardExportDialog.tsx` | 57   | setState in useEffect (setFormat)           |
| `DashboardFilters.tsx`      | 82   | Array index as key                          |
| `DashboardWidget.tsx`       | 32   | Array as default prop                       |
| `EditWidgetDialog.tsx`      | 97   | Non-lazy useState                           |
| `EditWidgetDialog.tsx`      | 144  | setState in useEffect (setTitle)            |
| `EditWidgetDialog.tsx`      | 145  | setState in useEffect (setWidgetType)       |

**Impact**: Performance issues, potential infinite re-renders.

**Resolution**:

- Removed setState-in-effect patterns by deriving defaults and resetting on
  dialog close
- Added module-level default arrays
- Switched filter keys away from array indices
- Ensured edit dialog resets via `key` prop on open

**Files updated**:

- `src/features/bi/components/dashboard/AddWidgetModal.tsx`
- `src/features/bi/components/dashboard/DashboardCanvas.tsx`
- `src/features/bi/components/dashboard/DashboardExportDialog.tsx`
- `src/features/bi/components/dashboard/DashboardFilters.tsx`
- `src/features/bi/components/dashboard/DashboardWidget.tsx`
- `src/features/bi/components/dashboard/EditWidgetDialog.tsx`
- `src/routes/dashboard/analytics/dashboards/$dashboardId.tsx`

**Status**: Resolved

---

### 17. ZAP Baseline Security Headers (11 warnings)

**Note**: These are expected in dev mode. Security headers are applied in
production via middleware.

| Warning                          | Count | Status                       |
| -------------------------------- | ----- | ---------------------------- |
| Missing Anti-clickjacking Header | 4     | Expected in dev              |
| X-Content-Type-Options Missing   | 5     | Expected in dev              |
| Sensitive Info in URL            | 5     | ZAP test artifacts           |
| Suspicious Comments              | 1     | Dev comments                 |
| CSP Header Not Set               | 5     | Expected in dev              |
| Storable/Cacheable Content       | 6     | Expected behavior            |
| CSP Directive Missing Fallback   | 2     | 404 pages                    |
| Permissions Policy Not Set       | 5     | Expected in dev              |
| Modern Web Application           | 4     | Informational                |
| Auth Request Identified          | 1     | Informational                |
| Insufficient Spectre Isolation   | 12    | Missing Cross-Origin headers |

**Action**: Verify production deployment has proper security headers. No action needed for dev.

**Status**: Won't fix (dev-only)

---

## Action Items

### Immediate (Critical)

- [x] Fix SQL injection in BI engine files
- [x] Fix open redirect in feature-gates.ts
- [x] Rotate/move exposed secrets to SST

### This Sprint (High)

- [x] Remove credential logging from E2E setup
- [x] Mitigate xlsx prototype pollution (sanitize input)
- [ ] Update/replace xlsx dependency if patched version becomes available
- [x] Fix file inclusion in update-code-guide.mjs

### Backlog (Medium/Low)

- [x] Shell command injection in scripts
- [x] File system race conditions
- [x] Docker root user
- [x] React best practices in BI dashboard
- [x] Dead code cleanup

### Won't Fix / Ignore

- [x] Nitro regex anchors (vendored code)
- [x] ZAP dev-mode warnings (handled in production)

### Follow-ups

- [x] Run `pnpm install --lockfile-only` to capture dependency overrides in
      `pnpm-lock.yaml`
- [ ] Re-evaluate xlsx dependency if a patched version is released or replace
      with a safer library

---

## References

- Aikido Scan: https://app.aikido.dev/featurebranch/scan/72994184?groupId=58134
- CodeQL Dashboard: https://github.com/austeane/solstice/security/code-scanning
- ZAP Reports: GitHub Actions artifacts from `zap-baseline` workflow
