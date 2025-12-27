# INFRA-002: SST Dev Mode Base URL Mismatch Causes Auth Redirect Loop

**Status:** Open
**Priority:** High
**Discovered:** 2025-12-26
**Environment:** `sst dev --stage sin-dev` (likely affects `qc-dev` too)

## Summary

When running SST dev mode, the app UI is served from `http://localhost:5173`, but
server-side auth is configured with the CloudFront URL from the `BaseUrl` secret.
Better Auth uses this base URL for redirects and cookie security, which causes a
307 redirect loop after login. The loop only appears in SST dev mode; the plain
Vite dev server (`pnpm dev`) uses the correct localhost URL.

## Expected Behavior (How It Should Work in Theory)

- **Local dev:**
  - Browser origin is `http://localhost:5173` (or whatever `VITE_BASE_URL` is set
    to in `.env`).
  - Server functions (including Better Auth) should use the same base URL so
    redirects and cookies align with the browser origin.
  - Cookies should be **non-secure** in HTTP dev to ensure session cookies are
    accepted.

- **Deployed stages (dev/perf/prod):**
  - Base URL should match the deployed CloudFront / custom domain.
  - Cookies can be secure, and auth callbacks should point to that domain.

## Observed Behavior

1. Login appears to succeed (URL changes from `/auth/login` to `/dashboard`).
2. Server logs show repeated 307 responses:
   ```
   Error loading user: Response {
     status: 307,
     statusText: "",
     headers: Headers {},
     body: null,
     ...
   }
   ```
3. Dashboard never loads; loop continues.
4. Auth config log shows the base URL is the CloudFront domain instead of
   localhost:
   ```
   Auth config loading...
   Base URL: https://<cloudfront-domain>
   ```

## Root Cause (Current Findings)

The issue is caused by **configuration precedence**, not Better Auth itself.

- `sst.config.ts` **always** injects `VITE_BASE_URL` from the `BaseUrl` secret:
  - `sst.config.ts:234` defines the `BaseUrl` secret.
  - `sst.config.ts:274` sets `VITE_BASE_URL: secrets.baseUrl.value` for all
    stages, including `sst dev`.
- `src/lib/env.server.ts:116` resolves base URL as:
  ```ts
  const sst = process.env["BASE_URL"];
  const explicit = env.VITE_BASE_URL;
  const candidate = sst || explicit;
  ```
  This means the CloudFront URL wins in SST dev mode because it is injected into
  `VITE_BASE_URL`.
- `src/lib/auth/server-helpers.ts:31,59` passes that `baseUrl` into Better Auth
  and sets cookie security (`useSecureCookies`) based on `https://`.

**Net effect:** Server-side auth is configured for CloudFront, while the browser
is on localhost. Redirects and cookie settings are out of sync, producing the
307 loop.

## Why This Manifests as a 307 Loop

- Better Auth constructs callback URLs and cookie settings based on `baseURL`.
- When `baseURL` points to CloudFront but requests originate from localhost:
  - Redirects point to the wrong origin.
  - Cookies may be set as `secure` because `baseURL` is `https://`.
  - The browser stays on `http://localhost`, so it never sees the correct session
    cookie / callback chain.
- The app attempts to load the user again (via `getCurrentUser`), receives a 307,
  and repeats.

## Things Investigated / Tried

### Code Inspection

- **SST config** (`sst.config.ts`)
  - Found unconditional `VITE_BASE_URL` injection from `BaseUrl` secret.
- **Server env resolution** (`src/lib/env.server.ts`)
  - `getBaseUrl()` prefers `BASE_URL` and then `VITE_BASE_URL`.
- **Better Auth setup** (`src/lib/auth/server-helpers.ts`)
  - Uses `getBaseUrl()` for `baseURL`, and for cookie security settings.
- **Client env** (`src/lib/env.client.ts`)
  - Uses `window.location.origin` in the browser, so client side is correct.
- **Auth flow** (`src/features/auth/auth.queries.ts`)
  - `getCurrentUser` does not redirect; the 307 is likely from mismatched base
    URL / cookie handling rather than app logic.

### Environment Checks

- Ran:
  ```bash
  AWS_PROFILE=techdev npx sst shell --stage sin-dev -- printenv | rg "BASE_URL|VITE_BASE_URL|SST_DEV|SST_STAGE"
  ```
- Observed:
  - `VITE_BASE_URL` reflected local `.env` (localhost).
  - `SST_RESOURCE_BaseUrl` was present and contained the CloudFront URL.
  - `BASE_URL` was **not** visible in this shell output.

**Note:** `sst shell` uses local environment + linked resources and does not
mirror `sst dev` runtime exactly. It still confirms the `BaseUrl` secret exists
and is CloudFront.

### Docs Reviewed

- Better Auth options docs (`baseURL`):
  - Explicit `baseURL` is recommended and used for redirects/cookies.
  - Relying on request inference is discouraged.

### Previous Workaround (Tested, Then Reverted)

```ts
if (process.env["SST_DEV"] === "true") {
  return "http://localhost:5173";
}
```

This works but hardcodes the port and mixes runtime-specific logic into app code.

## Recommendations (With Pros / Cons)

### 1) **Config-Level Fix in `sst.config.ts` (Recommended)**

**Idea:** Only use the CloudFront secret in deployed stages, and keep local dev
aligned with `.env` / `localhost` when `sst dev` runs.

**Implementation sketch:**

```ts
const isSstDev = process.env["SST_DEV"] === "true";
const devBaseUrl = process.env["VITE_BASE_URL"] ?? "http://localhost:5173";
const baseUrl = isSstDev ? devBaseUrl : secrets.baseUrl.value;

// environment:
VITE_BASE_URL: baseUrl,
// (optional) BASE_URL: baseUrl,
```

**Pros**

- Single source of truth (SST config).
- No hardcoded port in app logic (can still override via `.env`).
- Keeps prod/perf/dev deploys using CloudFront as intended.

**Cons**

- Requires SST dev to expose `SST_DEV` to config (expected but must confirm).
- Needs discipline if dev server port changes.

### 2) Guard in `getBaseUrl()` (Secondary / Safety Net)

**Idea:** If `SST_DEV=true`, prefer `VITE_BASE_URL` and ignore `BASE_URL`.

**Pros**

- Simple, localized fix.
- Works even if SST config is unchanged.

**Cons**

- Couples app code to SST runtime detail.
- Still requires hardcoding or env override for localhost.

### 3) Dev-Specific Secret (e.g., `BaseUrlDev`)

**Pros**

- Keeps config pattern consistent with prod.

**Cons**

- Adds secret management overhead.
- Doesn’t solve local dev (still a deployed URL).

### 4) Rely on Better Auth Request Inference

**Pros**

- No explicit base URL config.

**Cons**

- Better Auth explicitly discourages this for stability/security.
- Risky in serverless/dev hybrid setups.

### 5) Manual `.env` Override Only

**Pros**

- No code/config changes.

**Cons**

- `sst dev` currently **overrides** `.env` with the secret, so this does not
  actually fix the issue.

## Recommended Path

- Implement **Option 1** in `sst.config.ts`.
- Optionally add a small guard in `getBaseUrl()` (Option 2) as defense-in-depth
  if you want belt-and-suspenders behavior.

## Validation Steps

1. Start SST dev:
   ```bash
   AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono
   ```
2. Log in and confirm no redirect loop.
3. Check server logs for:
   ```
   Auth config loading...
   Base URL: http://localhost:5173
   ```
4. Confirm dashboard loads and `getCurrentUser` returns a session.

## Open Questions / Follow-Ups

- Confirm whether SST exposes a built-in `$dev` flag in config (not currently
  used in this repo).
- Confirm `SST_DEV` is present during `sst dev` for config evaluation.
- If a future Vite port change is expected, standardize via `.env` or a single
  `DEV_BASE_URL` value.

## Files Involved

- `sst.config.ts` - environment injection (root issue)
- `src/lib/env.server.ts` - `getBaseUrl()` precedence
- `src/lib/auth/server-helpers.ts` - Better Auth baseURL + cookie settings
- `src/lib/env.client.ts` - client-side base URL (already correct)
- `src/routes/__root.tsx` - logs the 307 loop in `Error loading user`

## Testing Notes

- sin-dev CloudFront URL: see SST `BaseUrl` secret
- Local dev server: `http://localhost:5173`
- Test user: `admin@example.com` (password is in `.env.e2e`)
