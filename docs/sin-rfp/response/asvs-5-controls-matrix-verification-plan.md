# ASVS 5 Controls Matrix - Needs Verification Plans

This document provides a detailed verification plan for every control marked
"Needs verification" in `docs/sin-rfp/response/asvs-5-controls-matrix.md`.

General prerequisites

- Access to a deployed environment (staging or prod) with representative config
- Ability to run Playwright (MCP) and curl against the deployment
- Read-only DB access where noted (sessions, accounts, twoFactor)
- Access to edge/CDN/load balancer config for HTTP parsing and headers

Evidence capture

- Save raw header dumps (curl -I) and Playwright response headers
- Save screenshots or HAR files for UI flows
- Record DB queries and results (redact secrets)
- Note environment, timestamp, and build SHA for each verification

## V1 Input Handling

### 1.1.1 Canonicalization (L2)

Requirement: Verify that input is decoded or unescaped into a canonical form
only once, it is only decoded when encoded data in that form is expected, and
that this is done before processing the input further.
Evidence references: -
Plan:

1. Identify endpoints that accept user-controlled input (query params, JSON
   bodies, file names).
2. Build a test matrix with single and double encoded payloads (for example,
   %2e%2e%2f, %252e%252e%252f, %3cscript%3e, %253cscript%253e).
3. Send payloads through representative server functions and route handlers.
4. Confirm validation/sanitization outcomes and stored values.
5. Ensure double-encoded inputs do not bypass validation and are not double
   decoded in storage or logs.
   Pass criteria:

- Double-encoded payloads do not bypass validation or sanitization.
- Only expected decoding occurs once per input.
  Artifacts:
- Request/response captures and DB snapshots for stored values.

### 1.2.3 JS/JSON Encoding (L1)

Requirement: Verify that output encoding or escaping is used when dynamically
building JavaScript content (including JSON).
Evidence references: `src/routes/api/webhooks/square.ts`
Plan:

1. Scan for inline script generation and dynamic script templates.
2. Identify API responses that include user-provided content.
3. Use a payload like `</script><script>alert(1)</script>` in a field that is
   returned to the client.
4. Verify JSON responses remain valid and that no inline JS is constructed.
5. Confirm HTML responses render payloads as text, not executable JS.
   Pass criteria:

- JSON/JS contexts do not allow injection or script execution.
  Artifacts:
- Static scan output, response bodies, screenshots if UI is involved.

### 1.5.3 Parser Consistency (L3)

Requirement: Verify that different parsers used for the same data type behave
consistently and use the same character encoding mechanisms.
Evidence references: -
Plan:

1. Enumerate all parser paths (JSON, CSV, XLSX imports).
2. Create a canonical dataset with UTF-8 characters, quotes, commas, and mixed
   line endings.
3. Import the dataset via CSV and XLSX paths and compare parsed results.
4. Verify encoding normalization (UTF-8) and consistent error handling.
5. Confirm URL-like inputs are parsed and validated consistently to prevent
   SSRF/RFI edge cases.
   Pass criteria:

- Parsed results match across formats and encoding assumptions are consistent.
  Artifacts:
- Test input files and parsed output snapshots.

## V3 Browser Security

### 3.3.5 Cookie Size (L3)

Requirement: Verify cookie name + value length is under 4096 bytes.
Evidence references: -
Plan:

1. Use Playwright to login and export cookies.
2. Compute name + value length for each cookie.
3. Exercise flows that set cookies (`active_org_id`, auth sessions).
4. Add an automated check to fail if any cookie exceeds 4096 bytes.
   Pass criteria:

- All cookies remain below 4KB.
  Artifacts:
- Cookie export with size calculations.

### 3.4.1 HSTS (L1)

Requirement: Verify Strict-Transport-Security header on all responses.
Evidence references: `docs/SECURITY.md`; `scripts/test-security-headers.sh`
Plan:

1. Run `scripts/test-security-headers.sh` against staging/prod.
2. Use `curl -I https://<host>` for HTML, API, and download endpoints.
3. Verify `Strict-Transport-Security` includes max-age >= 31536000 and
   includeSubDomains.
4. Confirm no responses omit HSTS.
   Pass criteria:

- HSTS present on all responses with correct directives.
  Artifacts:
- Script output and header dumps.

### 3.4.2 CORS Allowlist (L1)

Requirement: Verify Access-Control-Allow-Origin is fixed or allowlisted.
Evidence references: `src/lib/security/config.ts`
Plan:

1. Send preflight and actual requests with allowed and disallowed Origin values.
2. Verify header values are allowlisted and not `*` for sensitive endpoints.
3. Confirm credentials are not allowed with wildcard origins.
   Pass criteria:

- CORS headers only permit trusted origins.
  Artifacts:
- curl requests and response headers.

### 3.4.3 CSP (L2)

Requirement: Verify CSP header includes required directives and nonces/hashes.
Evidence references: `docs/SECURITY.md`; `scripts/test-security-headers.sh`;
`src/router.tsx`
Plan:

1. Run `scripts/test-security-headers.sh` and capture CSP values.
2. Use Playwright to check CSP header on HTML routes.
3. Confirm `object-src 'none'` and `base-uri 'none'` are present.
4. Verify nonce values exist and match script tags in HTML.
5. Trigger an inline script violation and confirm it is blocked.
   Pass criteria:

- CSP is present with required directives and nonce enforcement.
  Artifacts:
- Header dumps, console logs, and screenshots.

### 3.4.4 X-Content-Type-Options (L2)

Requirement: Verify X-Content-Type-Options: nosniff on all responses.
Evidence references: `docs/SECURITY.md`; `scripts/test-security-headers.sh`
Plan:

1. Inspect headers for HTML, JSON, and download responses.
2. Confirm `X-Content-Type-Options: nosniff` is present everywhere.
   Pass criteria:

- All responses include nosniff.
  Artifacts:
- Header dumps.

### 3.4.5 Referrer-Policy (L2)

Requirement: Verify Referrer-Policy header is set and enforced.
Evidence references: `docs/SECURITY.md`; `scripts/test-security-headers.sh`
Plan:

1. Inspect headers for Referrer-Policy on HTML responses.
2. Use Playwright to click an outbound link and inspect the outbound request
   referrer.
   Pass criteria:

- Referrer-Policy is present and enforced on outbound navigation.
  Artifacts:
- Header dumps and Playwright network logs.

### 3.4.6 frame-ancestors (L2)

Requirement: Verify frame-ancestors directive prevents embedding.
Evidence references: `docs/SECURITY.md`
Plan:

1. Inspect CSP for `frame-ancestors` or X-Frame-Options.
2. Embed the app in an iframe from another origin and observe behavior.
   Pass criteria:

- Embedding is blocked unless explicitly allowed.
  Artifacts:
- CSP header and iframe test screenshot.

### 3.4.7 CSP Reporting (L3)

Requirement: Verify CSP reporting endpoint is configured.
Evidence references: `docs/SECURITY.md`
Plan:

1. Check CSP header for `report-uri` or `report-to`.
2. Trigger a CSP violation and confirm report delivery.
   Pass criteria:

- CSP violation reports are emitted and received.
  Artifacts:
- Report payload and endpoint logs.

### 3.4.8 COOP (L3)

Requirement: Verify Cross-Origin-Opener-Policy header on document responses.
Evidence references: -
Plan:

1. Inspect headers on HTML responses for COOP.
2. Confirm value is `same-origin` or `same-origin-allow-popups`.
   Pass criteria:

- COOP header present on all document responses.
  Artifacts:
- Header dumps.

### 3.5.2 CORS Preflight Enforcement (L1)

Requirement: Verify non-preflight cross-origin requests are blocked.
Evidence references: `src/lib/security/config.ts`
Plan:

1. Identify sensitive endpoints (mutations, exports, admin actions).
2. Send cross-origin POSTs with `Content-Type: text/plain` (no preflight).
3. Confirm server rejects or checks Origin explicitly.
4. Send preflighted requests and confirm allowlist enforcement.
   Pass criteria:

- Non-preflight cross-origin requests are blocked.
  Artifacts:
- curl requests and responses.

### 3.5.4 Separate Hostnames (L2)

Requirement: Verify different apps are hosted on different hostnames.
Evidence references: -
Plan:

1. Document all subdomains (app, admin, api, assets).
2. Confirm deployment uses separate origins and cookie scoping is intentional.
3. Validate no cross-origin script or cookie leakage.
   Pass criteria:

- Hostname separation matches intended architecture.
  Artifacts:
- DNS/infra notes and cookie config.

### 3.5.8 Authenticated Resource Embedding (L3)

Requirement: Verify authenticated resources cannot be embedded cross-origin.
Evidence references: -
Plan:

1. Identify authenticated file endpoints (downloads/exports).
2. Check for Cross-Origin-Resource-Policy headers.
3. Attempt to load resources via <img>/<iframe> from another origin.
4. If using Sec-Fetch checks, send mismatched Sec-Fetch headers.
   Pass criteria:

- Cross-origin embedding fails for authenticated resources.
  Artifacts:
- Header dumps and screenshot of blocked loads.

### 3.7.4 HSTS Preload (L3)

Requirement: Verify domain is on HSTS preload list.
Evidence references: -
Plan:

1. Confirm HSTS header includes `preload` and long max-age.
2. Check https://hstspreload.org for the domain.
3. Validate all subdomains are HTTPS-only.
   Pass criteria:

- Domain is listed and meets preload requirements.
  Artifacts:
- Preload status screenshot and header dump.

## V4 HTTP Message Security

### 4.1.2 HTTP to HTTPS Redirects (L2)

Requirement: Verify only user-facing endpoints redirect HTTP to HTTPS.
Evidence references: -
Plan:

1. Enumerate browser-facing and API endpoints.
2. Send HTTP requests to each endpoint.
3. Verify browser-facing endpoints redirect; APIs do not redirect.
   Pass criteria:

- Redirects are limited to browser-facing endpoints.
  Artifacts:
- curl output per endpoint.

### 4.2.1 Request Smuggling Boundaries (L2)

Requirement: Verify HTTP message boundaries are parsed correctly.
Evidence references: -
Plan:

1. Review edge/load balancer HTTP parsing configuration.
2. Run a request smuggling test tool against staging.
3. Confirm conflicting CL/TE requests are rejected.
   Pass criteria:

- Smuggling tests fail to bypass parsing.
  Artifacts:
- Tool output and config notes.

### 4.2.2 Content-Length vs Framing (L3)

Requirement: Verify generated responses do not conflict with protocol framing.
Evidence references: -
Plan:

1. Capture response headers for large responses via curl.
2. Confirm Content-Length matches response size and no conflicting headers.
3. Validate edge/CDN does not inject conflicting framing headers.
   Pass criteria:

- No response contains conflicting framing headers.
  Artifacts:
- Response header captures.

### 4.2.3 Connection-Specific Headers in HTTP/2/3 (L3)

Requirement: Verify connection-specific headers are rejected.
Evidence references: -
Plan:

1. Send HTTP/2 requests with `Transfer-Encoding` and `Connection` headers.
2. Confirm server rejects or strips them.
3. Validate edge/CDN header normalization rules.
   Pass criteria:

- Connection-specific headers are not accepted in HTTP/2/3.
  Artifacts:
- curl/nghttp output.

### 4.2.4 CRLF Header Injection (L3)

Requirement: Verify CR/LF sequences are rejected in headers.
Evidence references: -
Plan:

1. Attempt to send CR/LF sequences in headers.
2. Confirm server rejects request or normalizes safely.
   Pass criteria:

- CR/LF injection attempts are blocked.
  Artifacts:
- Request/response logs.

### 4.2.5 Outbound Header and URL Length (L3)

Requirement: Verify outbound requests are not excessively long.
Evidence references: -
Plan:

1. Identify outbound request builders (AI, S3, Square, webhooks).
2. Craft extreme-length input values that would become headers/URLs.
3. Confirm requests are rejected or truncated safely.
4. Add a test that asserts maximum lengths for outbound headers/URLs.
   Pass criteria:

- Outbound requests never exceed safe length limits.
  Artifacts:
- Test results and error logs.

## V5 File Storage

### 5.3.1 Untrusted File Execution (L1)

Requirement: Verify untrusted files in public storage are not executed.
Evidence references: `src/lib/storage/artifacts.ts`
Plan:

1. Inspect S3 bucket settings (website hosting, public access blocks).
2. Verify signed URL responses deliver content only.
3. Check CDN configuration for correct MIME types and no execution features.
   Pass criteria:

- Stored files are not executed as server-side code.
  Artifacts:
- Bucket config output and signed URL response headers.

## V6 Authentication

### 6.2.8 Password Exactness (L1)

Requirement: Verify passwords are validated exactly as received.
Evidence references: `src/features/auth/components/login.tsx`;
`src/features/auth/components/signup.tsx`; `src/features/auth/step-up.tsx`
Plan:

1. Create a user with leading/trailing spaces and mixed case in password.
2. Attempt login with exact password and trimmed/case-altered variants.
3. Verify only exact match succeeds.
4. Repeat for step-up dialog.
   Pass criteria:

- Password verification is exact; no normalization.
  Artifacts:
- Login attempt results and logs.

### 6.2.9 64+ Character Passwords (L2)

Requirement: Verify 64+ character passwords are permitted.
Evidence references: `src/features/auth/auth.schemas.ts`; `src/components/ui/input.tsx`
Plan:

1. Create a 64+ character password and use signup flow.
2. Login with the password and confirm acceptance.
3. Repeat via reset password flow.
   Pass criteria:

- 64+ character passwords are accepted and functional.
  Artifacts:
- Test account results and logs.

### 6.2.10 No Forced Rotation (L2)

Requirement: Verify no periodic password rotation is enforced.
Evidence references: `src/lib/security/password-config.ts`
Plan:

1. Review Better Auth configuration for rotation or expiration settings.
2. Search for scheduled jobs or policies that enforce rotation.
3. Confirm no expiration fields or forced reset logic in auth flows.
   Pass criteria:

- No periodic rotation enforcement exists.
  Artifacts:
- Config and code review notes.

### 6.3.4 Auth Pathways Inventory (L2)

Requirement: Verify all authentication pathways are documented and consistent.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Enumerate `/api/auth/*` endpoints in a running environment.
2. Compare with documented auth pathways.
3. Confirm no hidden or undocumented auth routes are enabled.
   Pass criteria:

- Documented and actual auth pathways match.
  Artifacts:
- Endpoint inventory and documentation checklist.

### 6.4.3 Password Reset with MFA (L2)

Requirement: Verify password reset does not bypass MFA.
Evidence references: `src/features/auth/components/forgot-password.tsx`;
`src/features/auth/components/reset-password.tsx`; `src/lib/auth/server-helpers.ts`
Plan:

1. Enable MFA for a test user.
2. Trigger password reset and complete it.
3. Attempt login and confirm MFA prompt still appears.
4. Verify reset token is one-time and expires as expected.
   Pass criteria:

- Reset flow preserves MFA and token is single-use.
  Artifacts:
- Reset email, logs, and MFA prompt screenshot.

### 6.5.1 One-Time Use of Backup Codes/TOTP (L2)

Requirement: Verify backup codes and TOTPs are single-use.
Evidence references: `src/lib/auth/server-helpers.ts`;
`src/features/auth/mfa/mfa-enrollment.tsx`
Plan:

1. Generate backup codes and use one to login.
2. Attempt to reuse the same code.
3. For TOTP, attempt to reuse a code within the same period.
4. Inspect `twoFactor` table to confirm used codes are removed.
   Pass criteria:

- Backup codes are one-time; TOTP replay is rejected.
  Artifacts:
- Login attempt logs and DB snapshots.

### 6.5.2 Backup Code Storage (L2)

Requirement: Verify backup codes are securely stored.
Evidence references: `src/lib/auth/server-helpers.ts`; `src/db/schema/auth.schema.ts`;
`scripts/seed-sin-data.ts`
Plan:

1. Inspect `twoFactor.backupCodes` values in DB.
2. Determine whether storage is plain, encrypted, or hashed.
3. Compare with ASVS entropy requirement and storage guidance.
   Pass criteria:

- Backup codes are hashed or otherwise protected per entropy requirements.
  Artifacts:
- Redacted DB query output and config notes.

### 6.5.3 CSPRNG Usage (L2)

Requirement: Verify lookup secrets and seeds use CSPRNG.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Review Better Auth docs/source for backup code and TOTP secret generation.
2. Confirm use of `crypto.randomBytes` or equivalent.
   Pass criteria:

- CSPRNG is used for secret generation.
  Artifacts:
- Documentation or source references.

### 6.5.4 Backup Code Entropy (L2)

Requirement: Verify backup codes have >= 20 bits of entropy.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Generate backup codes in a test environment.
2. Measure length and character set.
3. Calculate entropy: log2(alphabet_size^length).
   Pass criteria:

- Entropy is >= 20 bits.
  Artifacts:
- Redacted sample codes and entropy calculation.

### 6.5.8 Server Time for TOTP (L3)

Requirement: Verify TOTP uses a trusted server time source.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Skew client time in Playwright via Date override.
2. Submit a valid TOTP from a trusted source.
3. Confirm server validates based on its own time window.
   Pass criteria:

- Client time skew does not alter validation outcome.
  Artifacts:
- Playwright logs and test notes.

### 6.8.2 Signature Validation (L2)

Requirement: Verify authentication assertions are signature validated.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Capture OAuth callback exchange via proxy.
2. Tamper with ID token signature or payload.
3. Confirm server rejects the tampered token.
4. Cross-check Better Auth docs for signature verification behavior.
   Pass criteria:

- Invalid signatures are rejected.
  Artifacts:
- Proxy logs and error responses.

### 6.8.4 Auth Strength from IdP (L2)

Requirement: Verify IdP auth strength claims are handled.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Inspect ID token claims (`acr`, `amr`, `auth_time`) from Google.
2. Determine expected auth strength for sensitive actions.
3. Document fallback if claims are absent.
   Pass criteria:

- Auth strength handling is documented and matches requirements.
  Artifacts:
- Token claim inspection and documentation notes.

## V7 Session Management

### 7.2.3 Session Token Entropy (L1)

Requirement: Verify reference tokens are unique and have >= 128 bits of entropy.
Evidence references: `src/db/schema/auth.schema.ts`
Plan:

1. Query session tokens and measure length/format.
2. Estimate entropy based on character set and length.
3. Confirm uniqueness across sessions.
   Pass criteria:

- Token entropy >= 128 bits and no duplicates.
  Artifacts:
- Redacted DB queries and calculations.

### 7.2.4 Session Rotation (L1)

Requirement: Verify new session token on authentication/reauth.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Login and capture session token.
2. Login again or perform step-up reauth.
3. Verify new token is issued and old token invalidated.
   Pass criteria:

- Token rotates and old session is terminated.
  Artifacts:
- Session list snapshots before/after.

### 7.6.1 IdP Session Coordination (L2)

Requirement: Verify RP/IdP session lifetime and termination behavior.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Sign in with Google OAuth.
2. Log out or revoke session at the IdP.
3. Verify app session behavior (continues or requires reauth).
4. Document alignment with expected behavior.
   Pass criteria:

- RP/IdP session coordination matches documented expectations.
  Artifacts:
- Test notes and session behavior logs.

## V10 OAuth/OIDC

### 10.1.1 Token Exposure to Client (L2)

Requirement: Verify tokens are only sent to components that need them.
Evidence references: `src/lib/auth-client.ts`; `src/db/schema/auth.schema.ts`
Plan:

1. Inspect browser storage (localStorage, sessionStorage, cookies).
2. Scan network responses for access/refresh tokens.
3. Confirm tokens are stored server-side only.
   Pass criteria:

- Tokens are not accessible to client-side JS.
  Artifacts:
- Playwright storage dumps and network logs.

### 10.1.2 OAuth Flow Binding (L2)

Requirement: Verify state/nonce are bound to the session and transaction.
Evidence references: `src/lib/auth-client.ts`; `src/features/auth/components/login.tsx`
Plan:

1. Start OAuth flow and capture state/nonce values.
2. Tamper with state in callback and verify rejection.
3. Attempt to replay a previous callback.
   Pass criteria:

- State/nonce mismatches are rejected.
  Artifacts:
- Callback logs and error responses.

### 10.2.1 OAuth CSRF Protection (L2)

Requirement: Verify PKCE/state protections are enforced.
Evidence references: `src/lib/auth-client.ts`; `src/lib/auth/server-helpers.ts`
Plan:

1. Start OAuth flow and capture code_challenge/state.
2. Attempt token exchange with mismatched state or code_verifier.
3. Confirm the server rejects the request.
   Pass criteria:

- CSRF protections are enforced for code flow.
  Artifacts:
- Network traces and error responses.

### 10.2.3 OAuth Scope Minimization (L3)

Requirement: Verify only required scopes are requested.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Capture OAuth authorization request URL.
2. Inspect `scope` parameter.
3. Confirm scopes are minimal (openid, email, profile).
   Pass criteria:

- Scope list is minimal and justified.
  Artifacts:
- Authorization URL capture.

### 10.5.1 ID Token Replay (L2)

Requirement: Verify ID token replay is mitigated.
Evidence references: `src/lib/auth-client.ts`; `src/lib/auth/server-helpers.ts`
Plan:

1. Capture ID token from a successful OAuth login.
2. Attempt to replay the token or callback.
3. Confirm rejection.
   Pass criteria:

- Replayed tokens are rejected.
  Artifacts:
- Proxy logs and error responses.

### 10.5.2 Subject Mapping (L2)

Requirement: Verify user identity is based on stable subject claims.
Evidence references: `src/lib/auth/server-helpers.ts`; `src/db/schema/auth.schema.ts`
Plan:

1. Inspect `account` table entries for providerId/accountId.
2. Confirm accountId matches Google `sub` claim.
3. Ensure identity mapping does not rely solely on email.
   Pass criteria:

- Identity mapping uses stable subject identifiers.
  Artifacts:
- DB query output and token claim notes.

### 10.5.3 Issuer Validation (L2)

Requirement: Verify issuer metadata is validated.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Confirm configured issuer for Google OAuth.
2. Attempt to tamper with issuer metadata (if feasible).
3. Verify mismatch is rejected.
   Pass criteria:

- Issuer mismatch is rejected.
  Artifacts:
- Config notes and error responses.

### 10.5.4 Audience Validation (L2)

Requirement: Verify ID token audience matches client ID.
Evidence references: `src/lib/auth/server-helpers.ts`
Plan:

1. Capture ID token claims and inspect `aud`.
2. Confirm `aud` matches configured Google client ID.
3. Attempt to validate a token with a different `aud` (if feasible).
   Pass criteria:

- Audience mismatch is rejected.
  Artifacts:
- Token claim inspection and error responses.
