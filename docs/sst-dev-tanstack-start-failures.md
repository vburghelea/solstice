## SST dev failure: TanStack Start virtual modules

### Summary

- `sst dev` and Vite dev are failing because `@tanstack/react-start/server` is
  being bundled in contexts where the TanStack Start Vite plugin is not
  running.
- `@tanstack/react-start/server` re-exports `@tanstack/start-server-core`, which
  contains virtual imports like `#tanstack-router-entry` and
  `tanstack-start-manifest:v`. Esbuild and Vite (client pipeline) cannot
  resolve these virtual modules, so the build fails.

### Evidence and dependency chain

- Cron build error:
  - Error: Could not resolve `#tanstack-router-entry`,
    `#tanstack-start-entry`, `tanstack-start-manifest:v`,
    `tanstack-start-injected-head-scripts:v`
  - Triggered while bundling `src/cron/process-notifications.handler`.
  - Dependency path:
    - `src/cron/process-notifications.ts`
    - `src/lib/notifications/scheduler.ts`
    - `src/lib/notifications/queue.ts`
    - `src/lib/notifications/send.ts`
    - `src/lib/audit/index.ts`
    - `src/lib/server/request-id.ts`
    - `@tanstack/react-start/server`
    - `@tanstack/start-server-core` (virtual imports)
- Vite dev error:
  - `Failed to resolve import "tanstack-start-injected-head-scripts:v"`
  - This shows Vite is pulling `@tanstack/start-server-core` into the client
    pipeline. That happens when top-level imports of
    `@tanstack/react-start/server` exist in modules that are part of the
    client graph.

### Why this breaks

- TanStack Start uses virtual modules that are only resolved by the TanStack
  Start Vite plugin.
- `sst dev` bundles cron and lambda code with esbuild, which does not know how
  to resolve those virtual modules.
- Client-side Vite transforms also fail if those server-only modules are pulled
  into the client graph.
- Current top-level imports from `@tanstack/react-start/server` in shared
  modules cause both problems:
  - `src/lib/server/request-id.ts`
  - `src/lib/auth/guards/org-context.ts`
  - `src/lib/auth/middleware/auth-guard.ts`

### Recommended fix (no code changes yet)

1. **Isolate server-only imports**
   - Ensure `@tanstack/react-start/server` is only imported inside code that is
     bundled by the TanStack Start server build (server functions or server
     routes), not in shared modules or cron paths.

2. **Refactor request-id utilities**
   - Make `resolveRequestId` a pure helper that accepts optional headers and
     does not import `@tanstack/react-start/server`.
   - Example intent:
     - `resolveRequestId(headers?: Headers | null): string`
     - Use `headers?.get("x-request-id") ?? crypto.randomUUID()`

3. **Refactor audit request context**
   - Avoid `@tanstack/react-start/server` inside `src/lib/audit/index.ts`.
   - Use `@tanstack/start-storage-context` to access the request when running
     inside Start, and fall back to `null` outside Start (cron).
   - This keeps cron bundles free of Start server-core.

4. **Move server-only imports inside server middleware**
   - In `src/lib/auth/guards/org-context.ts` and
     `src/lib/auth/middleware/auth-guard.ts`, move imports of
     `getRequest`, `setResponseHeader`, and `setResponseStatus` inside the
     `.server()` callback to avoid top-level server-only imports.

### Files that likely need updates

- `src/lib/server/request-id.ts`
- `src/lib/audit/index.ts`
- `src/lib/auth/guards/org-context.ts`
- `src/lib/auth/middleware/auth-guard.ts`
- `src/start.ts` (to ensure middleware wiring does not pull server-only modules
  into the client graph)

### Expected outcome after refactor

- `AWS_PROFILE=techdev npx sst dev --stage dev` should no longer fail during
  cron/lambda bundling.
- Vite dev should stop emitting `tanstack-start-injected-head-scripts:v`
  resolution errors.

### Validation plan

- Re-run:
  - `AWS_PROFILE=techdev npx sst dev --stage dev`
  - `pnpm dev`
- After code changes, run:
  - `pnpm lint`
  - `pnpm check-types`
