# Cron/Lambda Environment Issue: `import.meta.env` Undefined

This document captures a build/runtime issue discovered when running cron handlers in SST dev mode.

## Problem

When running `npx sst dev`, cron handlers fail with:

```
Error: Cannot read properties of undefined (reading 'SSR')
  at src/lib/env.server.ts:10:21
  at <anonymous> (src/db/connections.ts:425:34)
```

## Root Cause

The error occurs in `src/lib/env.server.ts` at line 10:

```typescript
if (import.meta.env.SSR && import.meta.env.DEV) {
  dotenv.config();
}
```

### Why This Fails

| Context                     | Bundler     | `import.meta.env`               |
| --------------------------- | ----------- | ------------------------------- |
| TanStack Start (web app)    | Vite        | Defined with `SSR`, `DEV`, etc. |
| Cron handlers               | SST/esbuild | `undefined`                     |
| Standalone Lambda functions | SST/esbuild | `undefined`                     |

Vite injects `import.meta.env` as a build-time replacement. SST uses esbuild for cron/Lambda handlers, which doesn't provide this Vite-specific global.

### Import Chain

```
src/cron/process-notifications.ts
  → imports ~/lib/notifications/scheduler
    → imports ~/db (connections.ts)
      → imports ~/lib/env.server.ts  ← FAILS HERE
```

The top-level code in `env.server.ts` executes immediately on import, before any handler code runs.

## Solution

Use optional chaining to safely check `import.meta.env`:

```typescript
// Before (breaks in Lambda/cron)
if (import.meta.env.SSR && import.meta.env.DEV) {

// After (works everywhere)
if (import.meta.env?.SSR && import.meta.env?.DEV) {
```

The dotenv loading is only needed in Vite dev mode anyway, so this is safe - in Lambda contexts, environment variables are provided by the runtime.

## Relation to Lambda Streaming Issues

This is conceptually similar to the issues documented in `docs/lambda-streaming-learnings.md`:

1. **Different bundlers** - Vite vs esbuild have different behaviors
2. **Vite-specific globals** - `import.meta.env` is Vite's pattern, not standard
3. **Top-level code execution** - Code runs before handlers, causing early failures

## Prevention

When writing code that runs in both Vite and Lambda/cron contexts:

1. **Don't assume Vite globals exist** - Always use optional chaining on `import.meta.env`
2. **Lazy-load environment checks** - Move env access inside functions when possible
3. **Test in SST dev mode** - `npx sst dev` exercises the Lambda bundler path

## Current Status

**TODO**: Fix is identified but not applied. See comment in `src/lib/env.server.ts`.

## Files Involved

- `src/lib/env.server.ts` - Contains the failing code (line 10-12)
- `src/db/connections.ts` - Imports env.server.ts dynamically (lines 159, 425, 453)
- `src/cron/process-notifications.ts` - Example cron that triggers the issue
