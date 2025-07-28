# TanStack Start "process is not defined" Fix

## Problem

TanStack Start's server functions client code tries to access `process.env` in the browser, causing a "process is not defined" error when using Vite 5+.

## Solution

Add a minimal `process.env` shim to your `vite.config.ts` that covers both regular code AND optimized dependencies:

```typescript
export default defineConfig({
  // ... other config
  define: {
    // Provide minimal process.env shim for TanStack server functions
    "process.env": {},
  },
  optimizeDeps: {
    // ... your includes
    esbuildOptions: {
      define: {
        "process.env": "{}",
      },
    },
  },
  // ... other config
});
```

## Important Notes

1. After making this change, you MUST clear the Vite cache and restart the dev server:

   ```bash
   rm -rf node_modules/.vite
   # Then restart your dev server
   ```

2. This is a minimal fix that provides an empty object for `process.env`, which is sufficient for TanStack Start's client-side code.

3. The fix is applied at build time, adding negligible overhead (< 30 bytes to the bundle).

## Root Cause

TanStack Start's `@tanstack/react-start/server-functions-client` module contains code that checks `process.env.TANSTACK_SERVER_FUNCTIONS_BASE` and `process.env.NODE_ENV`. Since Vite 5+ no longer provides a `process` polyfill by default, this causes the error.

## Cleanup Checklist

With this fix in place, you can remove any workarounds you may have added:

- ✅ Runtime shims in React components
- ✅ `window.process` hacks in HTML
- ✅ Overly complex Vite configurations
- ✅ Duplicate client-safe env files
- ✅ CSP nonce workarounds for inline scripts

## Additional Context

This issue should be reported to the TanStack team. The client-side code should ideally use `import.meta.env` instead of `process.env` for better Vite compatibility.
