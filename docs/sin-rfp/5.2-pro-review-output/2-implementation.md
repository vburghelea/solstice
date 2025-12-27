# 2.md Implementation Review and Plan

## Review of 2.md vs the current codebase

1. Config: `env.client` in server runtimes

- Confirmed. `src/lib/env.client.ts` evaluates `import.meta.env` at module load (`runtimeEnv`, `skipValidation`), and `src/tenant/tenant-env.ts` imports `env.client` at top-level. Any SSR/worker/cron that loads `getTenantKey()` or `getTenantConfig()` will pull in `env.client` (see `src/routes/__root.tsx` for `getTenantKey()` and `getBrand()` usage), which can crash when `import.meta.env` is undefined in non-Vite runtimes.

2. Root route trusts `active_org_id` cookie/localStorage

- Confirmed. `src/routes/__root.tsx` reads `active_org_id` from cookies on the server and from `localStorage` on the client, then injects that value into route context without validating access. No `resolveOrganizationAccess` call occurs there. The only access validation happens in `setActiveOrganization` and server-function middleware, not in root route context.

3. `/dashboard/sin` guard checks presence, not validity

- Confirmed. `src/routes/dashboard/sin.tsx` only checks `context.activeOrganizationId` exists and redirects otherwise. It does not confirm the user can access that org.

4. Logout does not clear org context persistence

- Confirmed. `src/features/organizations/org-context.tsx` persists `active_org_id` to `localStorage`. Neither `src/components/ui/app-sidebar.tsx` nor `src/components/ui/admin-sidebar.tsx` clears `localStorage` or the `active_org_id` cookie during logout. This allows stale org selection to persist between users on shared machines.

5. Accessible-org query cache not user-scoped

- Confirmed. `src/features/organizations/org-context.tsx` uses `queryKey: ["organizations", "accessible"]` and enables the query solely via `sin_portal` feature gating, not by authenticated user state. This allows cached results to be reused between users in the same browser session.

6. OrgContextProvider does not sync to route-context changes

- Confirmed. `OrgContextProvider` initializes state once from `useRouteContext` and never updates it when `context.activeOrganizationId` changes, so route context and org context can drift.

7. Org switcher navigation race

- Likely. `OrgSwitcher` updates state then triggers `onSuccess` immediately (`src/features/organizations/components/org-switcher.tsx`). The `localStorage` write happens in a `useEffect` in `OrgContextProvider`, so a navigation to `/dashboard/sin` can race before storage is updated, causing the guard to send users back to `/dashboard/select-org`.

8. Redirect parameter unvalidated in select-org

- Confirmed. `src/routes/dashboard/select-org.tsx` accepts any string in `redirect` and passes it directly to `navigate({ to: destination })`. There is no validation to ensure it is a safe internal path.

9. SIN portal and admin overview cards not feature gated

- Confirmed. `src/routes/dashboard/sin/index.tsx` and `src/routes/dashboard/admin/sin/index.tsx` render cards unconditionally. Feature gating already exists via `filterNavItems` + `getAppNavSections` and `getSinAdminNav`, but those gates are not reused here.

## Implementation plan

### A) Make `env.client` safe in non-Vite runtimes

1. Guard `import.meta.env` access in `src/lib/env.client.ts`.
   - Define a `runtimeEnv` fallback to `{}` when `import.meta.env` is unavailable.
   - Use `runtimeEnv` for both `runtimeEnv` and `skipValidation`.
2. Optional cleanup: split tenant env into client/server modules.
   - Create `src/tenant/tenant-env.client.ts` (imports `env.client`).
   - Create `src/tenant/tenant-env.server.ts` (reads `process.env` or `env.server`).
   - Update `src/tenant/tenant-env.ts` to pick the correct module based on `typeof window`.
3. Verify that SSR paths (`src/routes/__root.tsx`, `src/tenant/index.ts`) can import tenant config without throwing when `import.meta.env` is missing.

### B) Validate active org before putting it into route context

1. Add a server function in `src/features/organizations/organizations.queries.ts` (or a new `org-context.queries.ts`):
   - Input: `organizationId?: string | null` (optional).
   - Behavior: require session, call `resolveOrganizationAccess` for the candidate org, return `{ organizationId, role } | null`.
   - Keep server-only imports inside the `handler()` (per TanStack Start guidance).
2. Update `src/routes/__root.tsx` `beforeLoad`:
   - Server branch: read cookie `active_org_id`, call the new server fn to validate, and set `activeOrganizationId` from the validated result.
   - If invalid, clear the cookie using `setResponseHeader("Set-Cookie", ...)` (reuse the cookie options from `securityConfig.cookies`) or call `setActiveOrganization({ organizationId: null })`.
   - Client branch: read localStorage, call the same server fn to validate, and update localStorage to the validated value (or clear it if invalid).
3. Update `src/routes/dashboard/sin.tsx` guard:
   - Either rely on the validated `context.activeOrganizationId`, or explicitly call the new server fn in `beforeLoad` and redirect to `/dashboard/select-org` if invalid.

### C) Fix org-context state sync and persistence

1. Sync context when the route context changes in `src/features/organizations/org-context.tsx`:
   - Add a `useEffect` on `initialOrgId` to update state.
2. Remove the race by writing localStorage synchronously:
   - Wrap the setter so it updates `localStorage` immediately before calling `setState`.
   - Optionally remove the current `useEffect` that writes to localStorage, or keep it as a fallback.
3. Scope the accessible-org query by user:
   - Pull `user?.id` from `useRouteContext`.
   - Update `queryKey` to `["organizations", "accessible", user?.id]`.
   - Gate `enabled` by `Boolean(user?.id)` in addition to `sin_portal`.

### D) Clear org context on logout

1. In `src/components/ui/app-sidebar.tsx` and `src/components/ui/admin-sidebar.tsx`:
   - Before `auth.signOut`, call `setActiveOrganization({ organizationId: null })` to clear the cookie.
   - Clear `localStorage.active_org_id` immediately.
   - Remove cached org queries: `queryClient.removeQueries({ queryKey: ["organizations"] })`.
2. Consider a shared `logout()` helper to keep both sidebars consistent.

### E) Lock down the select-org redirect param

1. Tighten `searchSchema` in `src/routes/dashboard/select-org.tsx`:
   - Only allow `/dashboard` paths (or a small allowlist of safe routes).
   - Reject values that contain a scheme (`http:`, `https:`) or `//`.
2. Optionally normalize the redirect to `{ to: "/dashboard/sin" }` when invalid.

### F) Feature-gate SIN portal and admin overview cards

1. For `src/routes/dashboard/sin/index.tsx`:
   - Build a card list from `getAppNavSections()` or a dedicated array that includes `feature` and `requiresOrgRole`.
   - Filter via `filterNavItems` using the user/org role.
2. For `src/routes/dashboard/admin/sin/index.tsx`:
   - Build cards from `getSinAdminNav()` and filter with `filterNavItems`.
   - Keep the overview card itself tied to `sin_admin`.

### G) Verification checklist

- SSR and worker scripts can import tenant config without crashing (`env.client` guard works).
- Invalid/stale `active_org_id` no longer shows as selected in route context.
- Switching orgs no longer causes redirect loops.
- Logging out clears `active_org_id` in both cookie and localStorage, and cached org lists are not shared between users.
- `/dashboard/select-org?redirect=...` only accepts safe internal paths.
- Portal/admin overview cards match feature flags and role rules used in the sidebars.
