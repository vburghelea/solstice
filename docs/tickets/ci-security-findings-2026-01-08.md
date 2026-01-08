# CI Security & Quality Findings

**Date**: 2026-01-08
**Status**: Open
**Priority**: High (contains Critical findings)

## Summary

Comprehensive audit of all CI workflow findings across CodeQL, Aikido, ZAP, and ESLint. Total of **54 findings** requiring review.

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

**Recommended Fix**:

- Use parameterized queries exclusively
- Review all string concatenation in SQL building logic
- Add input validation/sanitization

**Estimated Fix Time**: 6 hr 40 min (per Aikido)

---

### 2. Open Redirect (Aikido - Critical)

**File**: `src/tenant/feature-gates.ts`

**Issue**: Open redirect can be used in social engineering attacks.

**Impact**: Attackers can craft URLs that redirect users to malicious sites while appearing to come from your domain.

**Recommended Fix**:

- Validate redirect URLs against allowlist
- Use relative URLs only
- Implement strict URL validation

**Estimated Fix Time**: 30 min (per Aikido)

---

## High Priority

### 3. Clear-text Logging of Sensitive Data (CodeQL - Error)

**File**: `e2e/helpers/global-setup.ts:32`

**Issue**: Sensitive data (likely test credentials) logged in plaintext.

**Recommended Fix**:

- Remove credential logging
- Use environment variable references without values
- Mask sensitive data in logs

---

### 4. xlsx Prototype Pollution (Aikido - High)

**Package**: `xlsx` dependency

**Issue**: Abuse of JavaScript's prototype API possible (Prototype Pollution).

**Impact**: Could allow attackers to modify object prototypes, leading to denial of service or remote code execution.

**Recommended Fix**:

- Update xlsx to patched version if available
- Consider alternative library (e.g., `exceljs`)
- Implement prototype pollution protection

**Estimated Fix Time**: 30 min

---

### 5. File Inclusion Attack (Aikido - High)

**File**: `update-code-guide.mjs`

**Issue**: Potential file inclusion attack via reading file.

**Recommended Fix**:

- Validate file paths against allowlist
- Use path.resolve() and check against base directory
- Sanitize user-provided file paths

**Estimated Fix Time**: 1 hr

---

## Medium Priority

### 6. Shell Command Injection (CodeQL - Warning)

**File**: `scripts/generate-erd.js:48, 60, 74`

**Issue**: Environment variables passed unsanitized to shell commands.

**Recommended Fix**:

- Use `execFile` instead of `exec`
- Escape shell arguments
- Validate environment variable contents

---

### 7. File System Race Condition (CodeQL - Warning)

**Files**:

- `scripts/generate-erd.js:84`
- `scripts/generate-auth-secret.js:64`

**Issue**: TOCTOU (time-of-check to time-of-use) race between file existence check and file operation.

**Recommended Fix**:

- Use atomic file operations
- Handle ENOENT/EEXIST errors instead of pre-checking

---

### 8. Docker Container Root User (Aikido - Medium)

**File**: `import-batch.Dockerfile`

**Issue**: Docker container runs as default root user.

**Recommended Fix**:

```dockerfile
RUN adduser -D appuser
USER appuser
```

**Estimated Fix Time**: 1 hr

---

### 9. MCP SDK Session Credential Reuse (Aikido - Medium)

**Package**: `@modelcontextprotocol/sdk`

**Issue**: Attacker can reuse old session credentials.

**Recommended Fix**:

- Update to patched version if available
- Implement session rotation
- Add session expiration checks

**Estimated Fix Time**: 30 min

---

### 10. Rollup XSS Vulnerability (Aikido - Medium)

**Package**: `rollup`

**Issue**: XSS attack possible.

**Recommended Fix**:

- Update rollup to latest version
- Review build output for XSS vectors

**Estimated Fix Time**: 1 hr

---

### 11. Exposed Secret (Aikido - Medium)

**Issue**: 1 exposed secret detected.

**Recommended Fix**:

- Identify and rotate the exposed secret
- Add to `.gitignore` if file-based
- Use secret scanning prevention hooks

---

### 12. Missing Regexp Anchor (CodeQL - Warning)

**Files**:

- `src/nitro/aws-lambda-streaming.mjs:146`
- `src/nitro/aws-lambda-response.mjs:146`

**Issue**: Regex without `^`/`$` anchors may match unintended strings.

**Note**: These are in generated/vendored Nitro files. May need to be addressed upstream or ignored.

---

### 13. Incompatible Type Comparison (CodeQL - Warning)

**File**: `src/features/forms/forms.utils.ts:307`

**Issue**: Comparing values of different types.

**Recommended Fix**:

- Add explicit type conversion
- Fix type mismatch in comparison

---

## Low Priority / Informational

### 14. Useless Variable Assignments (CodeQL - Warning)

**Files**:

- `src/lib/notifications/send.ts:248`
- `src/lib/imports/batch-runner.ts:121`

**Issue**: Variables assigned but never read (dead code).

**Recommended Fix**: Remove unused assignments.

---

### 15. Unused Local Variable (CodeQL - Note)

**File**: `src/lib/email/sendgrid.ts:79`

**Issue**: Unused variable (dead code).

**Recommended Fix**: Remove unused variable.

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

**Recommended Fix**:

- Extract default arrays to module-level constants
- Use refs or restructure effect dependencies
- Use stable keys instead of array indices

---

### 17. ZAP Baseline Security Headers (11 warnings)

**Note**: These are expected in dev mode. Security headers are applied in production via middleware.

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

---

## Action Items

### Immediate (Critical)

- [ ] Fix SQL injection in BI engine files
- [ ] Fix open redirect in feature-gates.ts
- [ ] Rotate any exposed secrets

### This Sprint (High)

- [ ] Remove credential logging from E2E setup
- [ ] Address xlsx prototype pollution (update or replace)
- [ ] Fix file inclusion in update-code-guide.mjs

### Backlog (Medium/Low)

- [ ] Shell command injection in scripts
- [ ] File system race conditions
- [ ] Docker root user
- [ ] React best practices in BI dashboard
- [ ] Dead code cleanup

### Won't Fix / Ignore

- [ ] Nitro regex anchors (vendored code)
- [ ] ZAP dev-mode warnings (handled in production)

---

## References

- Aikido Scan: https://app.aikido.dev/featurebranch/scan/72994184?groupId=58134
- CodeQL Dashboard: https://github.com/austeane/solstice/security/code-scanning
- ZAP Reports: GitHub Actions artifacts from `zap-baseline` workflow
