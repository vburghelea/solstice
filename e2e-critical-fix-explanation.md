# Critical E2E Test Fix - Why Tests Got Worse

## The Problem

We went from 33 failures to 96 failures because of a critical bug I introduced in the `uiLogin` helper.

## What Went Wrong

In the `uiLogin` function, I added this line:

```typescript
// Wait for button to change to "Logging in..." to confirm submission
await expect(page.getByRole("button", { name: "Logging in..." })).toBeVisible({
  timeout: 5_000,
});
```

This was meant to confirm the form was submitted, but it created a race condition:

- If login is fast, the "Logging in..." button might never appear
- Or it might appear and disappear before we can detect it
- This caused the auth setup to fail with a timeout

## The Cascade Effect

1. **Auth Setup Failed** - The setup step that creates the shared authentication state failed
2. **No Auth State Saved** - No `.auth/user.json` file was created
3. **All Shared Auth Tests Failed** - All tests using shared auth (dashboard, navigation, logout) had no authentication
4. **Firefox Tests Also Failed** - Both browser types were affected

## The Fix

1. **Removed the problematic wait** - No longer waiting for "Logging in..." button
2. **Simplified auth setup** - Now uses the same `uiLogin` helper consistently
3. **Fixed signup test** - Added small delay between password fields to prevent validation race

## Key Lessons

1. **Don't add unnecessary waits** - Waiting for transient states can cause failures
2. **Test the test infrastructure** - Changes to auth helpers affect ALL tests
3. **Shared auth is fragile** - One failure in setup cascades to many test failures

## Expected Results After Fix

With these fixes:

- Auth setup should succeed reliably
- Shared auth tests should have proper authentication
- Test count should drop back to ~20-30 failures
- Remaining failures will be test-specific issues, not systemic problems
