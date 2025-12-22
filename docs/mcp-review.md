# MCP App Review (Netlify)

## Scope

- / (login entry)
- /dashboard, /dashboard/membership, /dashboard/teams, /dashboard/teams/browse, /dashboard/teams/:id
- /dashboard/events, /dashboard/events/:slug
- /dashboard/members
- /dashboard/profile (view/edit)
- /dashboard/settings

## What I found

- `/` shows the login/signup portal for unauthenticated users; authenticated users currently land on a MemberDashboard without the sidebar.
- `/dashboard` shows stats cards and quick actions inside the sidebar layout.
- Teams: browse list shows test teams; team detail shows member list and join-request flow.
- Events: dashboard list has filters; event detail shows registration status and organizer card.
- Members directory includes search and CSV export.
- Profile has a read view with inline edit form.
- Settings includes password change, active sessions, and connected accounts.

## Potential improvements / issues

1. Team search by city doesn’t match existing city values.
   - Repro: `/dashboard/teams/browse` -> search "Toronto" returns "No teams found" even though "Test Thunder" is "Toronto, ON".
   - Likely around `src/routes/dashboard/teams/browse.tsx` and `src/features/teams/teams.queries.ts`.
   - Suggest verifying the server search query input or normalization (trim/lowercase) and confirm `teams.city` values.

2. Date of birth display mismatch between view and edit.
   - Observed: Profile view shows `11/5/1994`, edit input shows `1994-11-06`.
   - `src/features/profile/components/profile-view.tsx` uses `toLocaleDateString()` while `src/components/form-fields/ValidatedDatePicker.tsx` stores UTC dates; timezone conversion causes the off-by-one.
   - Suggest consistent UTC/local handling or formatting date-only strings.

3. CSP console errors on page load (inline scripts blocked).
   - Console shows "Executing inline script violates the following Content Security Policy directive 'script-src...'".
   - CSP configured in `netlify/edge-functions/security-headers.ts` with nonce + hashes; some inline scripts aren't covered.
   - Suggest adding hashes/nonces for inline scripts or removing inline script usage.

4. Event detail "Location" section renders empty when no location data.
   - `/dashboard/events/:slug` shows "Location" heading but no address/notes.
   - `src/routes/dashboard/events/$slug.index.tsx` only renders details when `event.venueName` or `event.locationNotes` exist.
   - Suggest hiding the section when empty or showing a "Location TBD" placeholder.

5. Password form accessibility warning (missing username field).
   - Console message: "Password forms should have (optionally hidden) username fields for accessibility".
   - Change password form in `src/features/settings/components/settings-view.tsx` lacks a username/email field.
   - Suggest adding a hidden username/email input with `autoComplete="username"` to improve password manager support.

6. Dashboard layout inconsistency between `/` and `/dashboard`.
   - `/` (MemberDashboard) doesn’t include the sidebar nav, while `/dashboard` does; both are "dashboard" experiences.
   - `src/routes/index.tsx`, `src/features/dashboard/MemberDashboard.tsx`, `src/routes/dashboard/index.tsx`.
   - Suggest redirecting authenticated `/` to `/dashboard` so onboarding guards apply and the sidebar is consistent.

7. Membership purchase redirects to Square sandbox testing panel.
   - Clicking "Purchase" on `/dashboard/membership` navigated to `https://connect.squareupsandbox.com/.../sandbox-testing-panel`.
   - Real/sandbox switch is in `src/lib/payments/square.ts` and `src/lib/payments/square-real.ts`.
   - Suggest confirming `SQUARE_ENV` and tokens for the Netlify deploy if this is meant to be production.

8. "Join a Team" quick action is disabled even though the browse flow exists.
   - `/dashboard` shows a disabled "Join a Team" button, but `/dashboard/teams/browse` works.
   - `src/routes/dashboard/index.tsx`.
   - Suggest linking to the browse flow or removing the card until ready.

## Fix Plans

### 1) Team search by city doesn’t match existing city values

- Reproduce locally with network inspection to confirm the `searchTeams` request payload and response.
- Verify stored values for `teams.name`, `teams.city`, and `teams.province` (seed data or DB query).
- Normalize input on both client and server: use `query.trim()` in `src/routes/dashboard/teams/browse.tsx` and `.trim().min(1)` in `src/features/teams/teams.schemas.ts`.
- Expand server search to include `province` or `concat(city, ', ', province)` and guard for nulls using `coalesce`.
- Add or adjust a unit test for `searchTeams` to cover city matches and trimmed input.
- Re-verify in UI via `/dashboard/teams/browse` with the same search term.

### 2) Date of birth view/edit mismatch (timezone shift)

- Confirm how DOB is stored (date-only vs timestamp) in profile schema + DB.
- Treat DOB as a date-only string end-to-end; avoid `new Date()` in view when formatting.
- Add a shared `formatDateOnly` helper that parses `YYYY-MM-DD` using UTC and formats with `timeZone: "UTC"`; use in `src/features/profile/components/profile-view.tsx`.
- Update edit initialization to pass the date-only string directly to the field so `ValidatedDatePicker` stays consistent.
- Add a small test or story covering DOB display with a known date to prevent regressions.

### 3) CSP inline script errors on page load

- Capture the HTML response (headers + body) to confirm which `<script>` tags have nonces and which don’t.
- Search for inline script usage in the codebase (including `dangerouslySetInnerHTML`) and identify runtime script injections.
- If inline scripts are required, inject the CSP nonce into those script tags (or move to external scripts).
- If scripts are injected at runtime, set the nonce on dynamically created `<script>` tags from a meta tag or global.
- Recheck console to confirm CSP errors are gone without loosening policy.

### 4) Event detail “Location” section is empty when data is missing

- Gate the Location card on presence of any location fields (venue name/address/city/province/postal/notes).
- Add a “Location TBD” placeholder if you want to keep the section visible.
- Verify with an event that has no location data (e.g., `/dashboard/events/:slug`).

### 5) Password form accessibility warning (missing username field)

- Add a hidden username/email input inside the Change Password form with `autoComplete="username"`.
- Use `accountOverview?.user.email` as the value; mark it read-only and visually hidden (`sr-only`).
- Re-check the console warning on `/dashboard/settings`.

### 6) Layout inconsistency between `/` and `/dashboard`

- Redirect authenticated `/` to `/dashboard` so onboarding guards apply and the sidebar layout is consistent.
- Remove or repurpose the logged-in `MemberDashboard` view on `/` if it’s no longer needed.
- Verify authenticated `/` goes through onboarding when profile is incomplete.

### 7) Membership purchase redirects to Square sandbox testing panel

- Confirm Netlify env vars (`SQUARE_ENV`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`) and intended environment.
- If production: set `SQUARE_ENV=production` with live credentials and verify the real checkout flow.
- If staging: add UI copy indicating sandbox mode or choose the mock flow for non-prod.
- Re-test the Purchase button to confirm expected checkout target.

### 8) “Join a Team” quick action is disabled even though browse exists

- Replace the disabled button with a link to `/dashboard/teams/browse`.
- Align labels with the “Your Next Steps” card and keep consistent styling.
- Verify that the button now navigates correctly from `/dashboard`.

## Validation (after fixes)

- `pnpm lint`
- `pnpm check-types`
- Spot-check impacted flows with Playwright (teams search, profile DOB, settings password form, membership purchase, dashboard redirect, event detail location).
