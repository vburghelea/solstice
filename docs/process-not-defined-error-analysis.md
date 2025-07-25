# "Process is not defined" Error Analysis

## Executive Summary

We're encountering a persistent "process is not defined" error in the browser console when running the TanStack Start application. Despite multiple refactoring attempts to properly isolate server-only code, the error continues to occur. This document provides comprehensive context for understanding and resolving this issue.

## Error Details

### Current Error

```
ReferenceError: process is not defined
    at createClientRpc (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-start_server-functions-client.js?v=43a3a00e:114:41)
    at http://localhost:5173/src/features/auth/auth.queries.ts:3:47
```

### Error Location

- **File**: `src/features/auth/auth.queries.ts`
- **Line**: 3
- **Context**: The error occurs when the client-side code tries to create an RPC client for a server function

## Root Cause Analysis

### TanStack Start's Compilation Model

TanStack Start has a specific limitation in how it handles server functions:

1. **Only code inside the handler() is extracted** - TanStack Start only extracts and isolates code that's written inside the `.handler()` method of server functions
2. **Top-level imports are NOT isolated** - Any imports at the module level (outside the handler) are included in the client bundle
3. **This is a known limitation** - The TanStack team acknowledges this isn't ideal but it's how the current implementation works

### The Problem Pattern

```typescript
// This import at the top level causes issues:
import { user } from "~/db/schema"; // ❌ Included in client bundle

export const myServerFn = createServerFn().handler(async () => {
  // Only this code is properly isolated on the server
});
```

## Attempted Solutions

### 1. Initial Fix: Client-Safe Duplicate Files (Not Ideal)

Created separate client-safe versions of environment files:

- `env.client.ts` - Client-safe environment variables
- `env.server.ts` - Server-only environment variables

**Result**: User feedback indicated this wasn't best practice due to code duplication.

### 2. Second Attempt: Dynamic Imports Inside Handlers

Moved all database and schema imports inside server function handlers:

```typescript
export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    // Import inside handler to avoid client bundle inclusion
    const { eq } = await import("drizzle-orm");
    const { user } = await import("~/db/schema");
    // ... rest of the code
  },
);
```

**Result**: Error persists, suggesting the issue is deeper.

### 3. Third Attempt: ServerOnly Wrappers

Created `serverOnly()` wrapped helpers:

```typescript
// src/db/server-helpers.ts
export const getDb = serverOnly(async () => {
  const { db } = await import("~/db");
  return db;
});
```

**Result**: Still encountering the error.

## Current Code Structure

### Files Modified

1. **Auth Queries** (`src/features/auth/auth.queries.ts`):
   - Removed top-level imports of `eq` and `user`
   - Moved all imports inside the handler

2. **Profile Queries** (`src/features/profile/profile.queries.ts`):
   - Same refactoring pattern applied

3. **Profile Mutations** (`src/features/profile/profile.mutations.ts`):
   - Moved `eq`, `sql`, and `user` imports inside handlers

4. **Membership Queries** (`src/features/membership/membership.queries.ts`):
   - Applied same import refactoring

5. **Database Helpers** (`src/db/server-helpers.ts`):
   - Created serverOnly wrapped helpers for database access

6. **Auth Helpers** (`src/lib/auth/server-helpers.ts`):
   - Created serverOnly wrapped auth instance

## Why The Error Persists

### Hypothesis 1: Import Chain Issues

Even though we're using `serverOnly()` helpers, the import chain might still be causing issues:

```
auth.queries.ts
  → imports from ~/db/server-helpers
    → which imports serverOnly from @tanstack/react-start
      → but the error happens before serverOnly can protect the code
```

### Hypothesis 2: Vite/Build Cache

The error URL shows a cache buster (`?v=43a3a00e`), suggesting Vite might be serving cached modules. However, hard refresh attempts didn't resolve it.

### Hypothesis 3: Deeper Framework Issue

The error occurs in `createClientRpc` which is part of TanStack Start's internal RPC mechanism. This suggests the issue might be in how the framework itself is trying to establish the client-server communication.

### Hypothesis 4: Module Evaluation Order

The error at line 3 (which is now just an import statement) suggests the issue happens during module evaluation, before any code execution. This could mean:

1. The `serverOnly` function itself might have dependencies that access `process`
2. The module resolution of `~/db/server-helpers` triggers some code that needs `process`
3. There's a circular dependency causing premature evaluation

## Environment Context

- **Dev Server**: Running on port 5173 (Vite)
- **Framework**: TanStack Start with React
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment Target**: Netlify
- **Auth**: Better Auth library

## Related Code Patterns

### Working Pattern (According to TanStack Docs)

```typescript
export const myServerFn = createServerFn().handler(async () => {
  // ALL server code must be here, including imports
  const { someServerUtil } = await import("./server-utils");
  return someServerUtil();
});
```

### Problematic Pattern

```typescript
import { serverThing } from "./server-code"; // ❌ This gets bundled

export const myServerFn = createServerFn().handler(async () => {
  return serverThing(); // Even if only used here
});
```

## Next Investigation Steps

1. **Check `server-helpers.ts` implementation**: The error happens when importing this file. Need to verify if `serverOnly` itself has client-side issues.

2. **Trace the import chain**: Follow exactly what gets imported when `auth.queries.ts` loads.

3. **Check for circular dependencies**: Use a tool to analyze if there are circular imports causing evaluation issues.

4. **Examine the compiled output**: Look at the actual JavaScript being served to understand what code is running on the client.

5. **Test minimal reproduction**: Create a minimal server function without any imports to verify the basic setup works.

## Alternative Solutions to Consider

1. **Inline all server code**: Instead of using helpers, inline everything directly in handlers (not maintainable long-term).

2. **Use build-time code splitting**: Configure Vite to better handle server/client separation.

3. **Different server function pattern**: Explore if TanStack Start has alternative patterns for complex server functions.

4. **Framework-level fix**: This might require a fix or feature from TanStack Start itself.

## References

- TanStack Start limitation discussed in previous conversation
- Similar issues in other meta-frameworks (Next.js "use server" directive as comparison)
- Vite's SSR documentation on handling Node.js dependencies
