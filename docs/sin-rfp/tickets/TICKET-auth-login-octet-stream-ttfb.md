# TICKET: Auth Login Octet-Stream Responses + High TTFB on SIN Pages

**Status**: Open
**Priority**: P1
**Component**: Auth / SSR / Performance
**Date**: 2026-01-03
**Author**: Codex (AI Assistant)

---

## Summary

On sin-dev, authenticated requests to `/auth/*` sometimes respond with
`Content-Type: application/octet-stream` and an empty body, which triggers a
browser download and causes Playwright/Chrome automation to abort navigation.
Separately, authenticated pages show high TTFB (roughly 0.7 to 1.3s), with LCP
mostly dominated by server time.

---

## Background

The SIN deployment uses TanStack Start with SSR, Better Auth sessions, and
RDS-backed data. Headless automation (Playwright + Chrome MCP) is used for
validation and performance checks. During recent troubleshooting, auth pages
worked in the browser but failed in automation due to a download response.

---

## Observations

### Auth route response behavior

- `/auth/login` with **no** session cookie: returns `text/html` and renders
  normally.
- `/auth/login` with a **valid** `__Secure-solstice.session_token` cookie:
  returns `200` with `Content-Type: application/octet-stream` and an empty body.
  Chrome treats this as a download and aborts navigation.
- If the session is cleared first (e.g., via `/api/auth/sign-out` in-browser),
  `/auth/login` renders normally again.
- Browser-initiated `fetch("/api/auth/sign-out", { method: "POST" })` succeeds,
  but direct `curl` without an `Origin` header returns:
  `{"code":"MISSING_OR_NULL_ORIGIN"}` (Better Auth origin enforcement).

### Performance traces (no throttling)

Measured with Chrome DevTools Performance on authenticated routes:

- `/dashboard/sin`: LCP 1137 ms, TTFB 686 ms
- `/dashboard/sin/reporting`: LCP 1150 ms, TTFB 1063 ms
- `/dashboard/sin/imports`: LCP 1158 ms, TTFB 1128 ms
- `/dashboard/sin/forms`: LCP 1299 ms, TTFB 1265 ms
- `/dashboard/sin/support`: LCP 1092 ms, TTFB 1032 ms

Render delay is small across all pages; TTFB dominates.

---

## Hypotheses

1. **Auth route redirect + streaming mismatch**
   - Authenticated users should be redirected away from `/auth/*`.
   - The response looks like an empty stream with a fallback `application/octet-stream`
     content type. This may be a streaming/SSR response issue when a redirect is
     thrown during `beforeLoad`.
2. **Cookie cache disabled in Better Auth**
   - `cookieCache` is disabled due to upstream bug (see `src/lib/auth/server-helpers.ts`).
   - Session validation always hits the DB, contributing to TTFB.
3. **Server-side work in root route**
   - `getCurrentUser()` queries DB + roles on every request.
   - Organization validation and policy checks are also run server-side.
   - These add multiple round trips before the first byte is sent.

---

## Potential Improvements for TTFB

- **Reduce root SSR work**
  - Avoid full user + role hydration in `__root` for every request.
  - Defer to client-side queries after first paint, or only run on dashboard routes.
- **Collapse DB round trips**
  - Fetch user + roles in a single query.
  - Cache roles per user (short TTL) or include them in session payload.
- **Re-enable session cookie cache when Better Auth bug is fixed**
  - This would avoid DB lookups for every request.
- **Instrument server timing**
  - Add `Server-Timing` headers for `auth`, `db`, `roles`, `org` to pinpoint bottlenecks.
- **Cold start mitigation**
  - Consider provisioned concurrency or a warming strategy for dev/perf environments.
- **Compression and response size**
  - DevTools indicates wasted bytes on the document; ensure gzip/brotli is enabled
    for HTML responses.

---

## Suggested Targets

For authenticated SSR pages, aim for:

- **TTFB**: < 500 to 800 ms
- **LCP**: < 1.0 to 1.5 s (no throttling)

---

## Next Steps

1. **Reproduce and capture headers** for `/auth/login` with and without session
   cookie. Confirm whether a redirect response is being transformed into an
   empty octet-stream response.
2. **Inspect SSR response path** for `/auth/*` when `redirectIfAuthenticated` is
   triggered to ensure proper status + content-type are returned.
3. **Add Server-Timing metrics** to isolate time spent in auth/session/DB.
4. **Evaluate lowering SSR work** for root route and move some checks to client
   on initial render.

---

## References

- `src/routes/__root.tsx`
- `src/features/auth/auth.queries.ts`
- `src/lib/auth/server-helpers.ts`
- `src/lib/auth/session.ts`
