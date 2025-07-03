# Login Redirect Race Condition Issue

## Problem Description

When users log in with email/password credentials, the authentication succeeds but they are immediately redirected back to the login page instead of reaching the dashboard. This creates a poor user experience where successful logins appear to fail.

## Root Cause Analysis

The issue is a race condition in the authentication flow:

1. User submits login credentials
2. Authentication API returns success (200 OK)
3. Login component invalidates the user query cache
4. Login component immediately navigates to `/dashboard`
5. Dashboard route's `beforeLoad` hook checks `context.user`
6. The user query hasn't finished refetching yet, so `context.user` is still `null`
7. Dashboard redirects back to `/login`

### Network Request Evidence

```
POST /api/auth/sign-in/email => 200 OK (login succeeds)
GET /dashboard => 307 Temporary Redirect (redirects to login)
GET /login => 200 OK (back at login page)
```

## Current Code

In `src/features/auth/components/login.tsx`:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["user"] });
  navigate({ to: redirectUrl });
};
```

The problem: `invalidateQueries` marks the query as stale but doesn't wait for refetch to complete.

## Investigation Findings

### Attempted Solution 1: Using `refetchQueries`

The first attempt was to use `refetchQueries` to wait for the user query to complete:

```typescript
onSuccess: async () => {
  await queryClient.refetchQueries({ queryKey: ["user"] });
  navigate({ to: redirectUrl });
};
```

**Result**: This caused the UI to hang indefinitely. The login button stays in "Logging in..." state and never completes.

**Root Cause**: The `refetchQueries` call waits for `auth.getSession()` to complete, but the session cookie might not be immediately available or there could be a timing issue with the auth service establishing the session.

## Recommended Solution

Use the TanStack Router's `invalidate()` method, which is already proven to work in the sign-out flow:

```typescript
import { useRouter } from "@tanstack/react-router";

// In component
const router = useRouter();

// In onSuccess callback
onSuccess: async () => {
  // Invalidate the user query to mark it stale
  queryClient.invalidateQueries({ queryKey: ["user"] });

  // Force router to re-run all loaders (including root beforeLoad)
  await router.invalidate();

  // Navigate to the redirect URL
  navigate({ to: redirectUrl });
};
```

### Why This Works

1. `router.invalidate()` forces all route loaders to re-run
2. The root route's `beforeLoad` will re-fetch the user via `context.queryClient.fetchQuery()`
3. By the time navigation happens, the user context is properly updated
4. This pattern is already successfully used in the sign-out flow (see `src/routes/index.tsx`)

## Alternative Solutions

1. **Add a Small Delay**:

   ```typescript
   onSuccess: async () => {
     queryClient.invalidateQueries({ queryKey: ["user"] });
     await new Promise((resolve) => setTimeout(resolve, 100));
     navigate({ to: redirectUrl });
   };
   ```

2. **Optimistic Updates**: Update the query cache immediately with the user data from the login response (requires Better Auth to return user data)

3. **Server-Side Session**: Have the auth endpoints return the full user object and update the cache directly

4. **Loading State**: Show a loading indicator or intermediate page while the session is being established

## Implementation Steps ✅ Completed

1. Imported `useRouter` in both `login.tsx` and `signup.tsx` components.
2. Updated `onSuccess` callbacks to invalidate the user query, await `router.invalidate()`, and then navigate.
3. Ensured consistent fix across email/password and OAuth flows.
4. Adjusted `env.client.ts` to fix a linter warning (unrelated bug).

## Files Affected

- `src/features/auth/components/login.tsx` - Add useRouter and update onSuccess callback
- `src/features/auth/components/signup.tsx` - Apply the same fix for consistency

## Testing

1. Log in with valid credentials
2. Verify navigation to dashboard without redirect back to login
3. Ensure no hanging/loading state
4. Test with both email/password and OAuth flows
5. Verify sign-out still works correctly

## Additional Notes

- The same issue affects the signup flow
- OAuth login via Google works because it uses a full page redirect
- This is a common pattern in SPA authentication flows where session establishment is asynchronous
- The `router.invalidate()` pattern provides a clean solution that works with TanStack Router's data loading architecture
