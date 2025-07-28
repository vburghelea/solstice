# Environment and Hydration Issues Summary

## Current Status

### 1. ✅ Process is not defined error - FIXED

The "process is not defined" error in TanStack Start has been successfully fixed by adding process.env shim in vite.config.ts:

```typescript
define: {
  // Provide minimal process.env shim for TanStack server functions
  "process.env": {},
},
optimizeDeps: {
  // ... includes
  esbuildOptions: {
    define: {
      "process.env": "{}",
    },
  },
},
```

### 2. ⚠️ DATABASE_URL not loading during SSR

When running `pnpm dev` from a fresh shell, the server logs show:

```
❌ Invalid environment variables: [
  {
    code: 'invalid_type',
    expected: 'string',
    received: 'undefined',
    path: [ 'DATABASE_URL' ],
    message: 'Required'
  }
]
```

**Root Cause**: TanStack Start's Vite module runner doesn't load .env files automatically during SSR. The dotenv loading in env.server.ts happens too late in the module evaluation cycle.

**Attempted Fix**: Added synchronous dotenv loading in env.server.ts, but the issue persists due to Vite's module execution order.

**Impact**: The error appears in server logs but doesn't prevent the app from working in the browser. The user loading fails gracefully and returns null.

### 3. ⚠️ Hydration Mismatches

Several components cause hydration mismatches when rendered differently on server vs client:

1. **Toaster Component**: Fixed using lazy loading with Suspense
2. **Dev Tools**: Fixed by conditionally rendering only on client side

## Recommendations

### For DATABASE_URL Issue:

1. **Option 1**: Set DATABASE_URL as a shell environment variable before running the dev server:

   ```bash
   DATABASE_URL="postgresql://..." pnpm dev
   ```

2. **Option 2**: Ensure the environment variable is loaded before the Vite server starts by modifying the dev script in package.json

3. **Option 3**: Wait for TanStack Start to provide better SSR environment variable support

### For Hydration Issues:

- All client-only components should be wrapped with `typeof window !== "undefined"` checks or lazy loaded with Suspense
- Development tools should only render on the client side

## Next Steps

1. Consider creating a dev script that loads .env before starting Vite
2. Report the SSR environment variable issue to TanStack Start team
3. Document the workaround in the README for other developers
