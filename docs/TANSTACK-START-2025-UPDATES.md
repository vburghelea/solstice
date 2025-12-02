# TanStack Start: Latest Changes & Best Practices (2025)

> Last updated: December 2025

This document covers the latest changes, new features, and best practices for TanStack Start as of the v1 Release Candidate (November 2025).

## Table of Contents

- [What's New in v1 RC](#whats-new-in-v1-rc)
- [Breaking Changes & Migration](#breaking-changes--migration)
- [Server Functions Best Practices](#server-functions-best-practices)
- [Middleware Guide](#middleware-guide)
- [Server Routes](#server-routes)
- [Data Loading Patterns](#data-loading-patterns)
- [Static Server Functions (Experimental)](#static-server-functions-experimental)
- [Deployment Options](#deployment-options)
- [React Server Components Status](#react-server-components-status)
- [Recent Patch Notes](#recent-patch-notes)

---

## What's New in v1 RC

TanStack Start reached **v1.0 Release Candidate** on November 24, 2025. This is the build expected to ship as 1.0, pending final feedback and documentation polish.

### Core Features

| Feature                  | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| **Type-Safe Routing**    | File-based routing with full TypeScript inference from TanStack Router |
| **Server Functions**     | Isomorphic RPC with automatic client/server code splitting             |
| **Built-in Streaming**   | SSR streaming without blocking client rendering                        |
| **URL-as-State**         | Runtime validation and full type-safety for URL parameters             |
| **Full-Stack Bundling**  | Optimized builds for both client and server code                       |
| **Universal Deployment** | Deploy to any Vite-compatible hosting provider via Nitro               |

### Key Architectural Highlights

- **Client-first with powerful server capabilities**: Unlike Next.js's server-first RSC approach, TanStack Start prioritizes client-side React with seamless server integration
- **No vendor lock-in**: Framework-agnostic deployment via Nitro
- **Incremental adoption**: Existing TanStack Router/Query apps can gradually adopt Start features
- **Deep TanStack Query integration**: Prefetching, caching, and hydration work seamlessly

### Official Partnerships

**Netlify** is now the [official deployment partner](https://tanstack.com/blog/netlify-partnership) for TanStack Start, providing first-class support for SSR, server routes, server functions, and middleware on serverless functions.

---

## Breaking Changes & Migration

### From Beta to v1 RC

If migrating from TanStack Start Beta, these are the key breaking changes:

#### 1. Package Rename

```bash
# Remove old package
npm uninstall @tanstack/start

# Install new package
npm install @tanstack/react-start
```

Update all imports:

```typescript
// Before
import { createServerFn } from "@tanstack/start";

// After
import { createServerFn } from "@tanstack/react-start";
```

#### 2. Directory Structure Change

The default app directory changed from `./app` to `./src` (more Vite-native):

```typescript
// app.config.ts - if you want to keep ./app
export default defineConfig({
  tsr: {
    appDirectory: "./app",
  },
});
```

#### 3. API Route Variable Rename

```typescript
// Before
export const Route = createFileRoute('/api/users')({...})

// After (for API-only routes)
export const APIRoute = createFileRoute('/api/users')({...})
```

#### 4. createStartHandler Signature Changes

If using custom integrations (like Clerk), check the new `createStartHandler` signature.

#### Pin Versions Helper

If you're not ready to migrate:

```bash
npx create-start-app@latest pin-versions
rm -rf node_modules package-lock.json
npm install
```

### Migration Resources

- [Beta Tracking Discussion (GitHub #2863)](https://github.com/TanStack/router/discussions/2863)
- [Vinxi to Vite Migration Guide](https://blog.logrocket.com/migrating-tanstack-start-vinxi-vite/)

---

## Server Functions Best Practices

### Basic Pattern with Zod Validation

**Always use Zod validation** for runtime type safety:

```typescript
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Define schema first
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(0).optional(),
});

// Use .validator() with schema
export const createUser = createServerFn({ method: "POST" })
  .validator(createUserSchema.parse)
  .handler(async ({ data }) => {
    // data is fully typed from schema
    const user = await db.users.create(data);
    return { success: true, user };
  });
```

### HTTP Methods

- **GET** (default): For data fetching/queries
- **POST**: For mutations that change data

```typescript
// Query (GET is default)
export const getUsers = createServerFn().handler(async () => {
  return db.users.findMany();
});

// Mutation (explicit POST)
export const deleteUser = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }).parse)
  .handler(async ({ data }) => {
    await db.users.delete(data.id);
  });
```

### FormData Handling

```typescript
export const submitForm = createServerFn({ method: "POST" })
  .validator((data) => {
    if (!(data instanceof FormData)) {
      throw new Error("Expected FormData");
    }
    return {
      name: data.get("name")?.toString() || "",
      email: data.get("email")?.toString() || "",
    };
  })
  .handler(async ({ data }) => {
    // data is { name: string, email: string }
    return { success: true };
  });
```

### Error Handling & Redirects

```typescript
import { redirect, notFound } from "@tanstack/react-router";

export const protectedAction = createServerFn({ method: "POST" })
  .validator(schema.parse)
  .handler(async ({ data }) => {
    const user = await getCurrentUser();

    // Redirect if not authenticated
    if (!user) {
      throw redirect({ to: "/login" });
    }

    const item = await db.items.find(data.id);

    // 404 if not found
    if (!item) {
      throw notFound();
    }

    return item;
  });
```

### Calling Server Functions

```typescript
// From route loaders
export const Route = createFileRoute("/users")({
  loader: async () => {
    return getUsers();
  },
});

// From components with useServerFn hook
function MyComponent() {
  const createUserFn = useServerFn(createUser);

  const handleSubmit = async (formData) => {
    const result = await createUserFn({ data: formData });
  };
}

// Direct invocation
const result = await createUser({ data: { name: "John", email: "john@example.com" } });
```

### Server-Only Imports

**Critical**: TanStack Start only extracts code INSIDE the `handler()` function. Top-level imports are included in client bundles.

```typescript
// BAD - top-level import pollutes client bundle
import { db } from "~/lib/db"; // Accesses process.env

export const getUsers = createServerFn().handler(async () => {
  return db.users.findMany();
});

// GOOD - use serverOnly() helper
import { serverOnly } from "@tanstack/react-start";

const getDb = serverOnly(async () => {
  const { db } = await import("~/lib/db");
  return db;
});

export const getUsers = createServerFn().handler(async () => {
  const db = await getDb();
  return db.users.findMany();
});

// ALSO GOOD - dynamic import inside handler
export const getUsers = createServerFn().handler(async () => {
  const { db } = await import("~/lib/db");
  return db.users.findMany();
});
```

---

## Middleware Guide

### Types of Middleware

1. **Request Middleware**: Applies to ALL server requests (routes, SSR, functions)
2. **Server Function Middleware**: Targets only server functions with extra capabilities

### Creating Basic Middleware

```typescript
import { createMiddleware } from "@tanstack/react-start";

// Request middleware (applies to everything)
const loggingMiddleware = createMiddleware().server(
  async ({ next, context, request }) => {
    console.log(`Request: ${request.method} ${request.url}`);
    const start = Date.now();
    const result = await next();
    console.log(`Duration: ${Date.now() - start}ms`);
    return result;
  },
);

// Server function middleware (with client support)
const authMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Runs on client before RPC call
    return next();
  })
  .server(async ({ next, context }) => {
    const user = await getSession();
    if (!user) {
      throw redirect({ to: "/login" });
    }
    // Pass user to downstream handlers
    return next({
      context: { user },
    });
  });
```

### Context Passing

```typescript
const enrichmentMiddleware = createMiddleware().server(async ({ next }) => {
  const permissions = await loadPermissions();

  // Context is merged and available downstream
  return next({
    context: {
      permissions,
      requestTime: new Date(),
    },
  });
});

// Use in server function
export const sensitiveAction = createServerFn({ method: "POST" })
  .middleware([enrichmentMiddleware])
  .handler(async ({ context }) => {
    // context.permissions and context.requestTime available
    if (!context.permissions.canAdmin) {
      throw new Error("Forbidden");
    }
  });
```

### Client-to-Server Context

Client context is NOT automatically sent to prevent unintended payload transmission:

```typescript
const trackingMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    // Explicitly send context to server
    return next({
      sendContext: {
        clientTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
  })
  .server(async ({ next, context }) => {
    // context.clientTimezone now available
    console.log("Client timezone:", context.clientTimezone);
    return next();
  });
```

### Global Middleware

Define in `src/start.ts`:

```typescript
import { createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  requestMiddleware: [securityMiddleware, loggingMiddleware],
  functionMiddleware: [authMiddleware],
}));
```

### Middleware with Validation

```typescript
import { zodValidator } from "@tanstack/zod-adapter";

const validatedMiddleware = createMiddleware({ type: "function" })
  .validator(zodValidator(mySchema))
  .server(async ({ next, data }) => {
    // data is validated and typed
    return next();
  });
```

---

## Server Routes

Server routes enable API endpoints alongside your application routes.

### Basic Server Route

```typescript
// src/routes/api/users.ts
import { createFileRoute, json } from "@tanstack/react-start";

export const Route = createFileRoute("/api/users")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const users = await db.users.findMany();
        return json(users);
      },
      POST: async ({ request }) => {
        const body = await request.json();
        const user = await db.users.create(body);
        return json(user, { status: 201 });
      },
    },
  },
});
```

### File Naming Conventions

| File Path                    | Route                     |
| ---------------------------- | ------------------------- |
| `/routes/api/users.ts`       | `/api/users`              |
| `/routes/api/users/$id.ts`   | `/api/users/:id`          |
| `/routes/api/files/$.ts`     | `/api/files/*` (wildcard) |
| `/routes/api/data[.]json.ts` | `/api/data.json`          |

### Handler Context

```typescript
export const Route = createFileRoute("/api/users/$id")({
  server: {
    handlers: {
      GET: async ({ request, params, context }) => {
        // params.id is available
        const user = await db.users.find(params.id);
        return json(user);
      },
    },
  },
});
```

### Route-Level Middleware

```typescript
export const Route = createFileRoute("/api/admin")({
  server: {
    middleware: [adminAuthMiddleware], // Applied to all handlers
    handlers: {
      GET: {
        middleware: [auditLogMiddleware], // Only for GET
        handler: async ({ request }) => {
          return json({ admin: true });
        },
      },
    },
  },
});
```

---

## Data Loading Patterns

### Route Loaders

```typescript
export const Route = createFileRoute('/users')({
  loader: async () => {
    // Runs on server for SSR, client for navigation
    return getUsers()
  },
  component: UsersPage,
})

function UsersPage() {
  const users = Route.useLoaderData()
  return <UserList users={users} />
}
```

### Preloading on Hover

```typescript
// Enabled by default - data loads when user hovers link
<Link to="/users" preload="intent">View Users</Link>

// Configure stale time
export const Route = createFileRoute('/users')({
  preloadStaleTime: 30_000, // 30 seconds (default)
  loader: async () => getUsers(),
})
```

### Integrating with TanStack Query

```typescript
import { queryOptions } from '@tanstack/react-query'

const usersQueryOptions = queryOptions({
  queryKey: ['users'],
  queryFn: () => getUsers(),
})

export const Route = createFileRoute('/users')({
  loader: async ({ context }) => {
    // Prefetch in loader for SSR
    await context.queryClient.ensureQueryData(usersQueryOptions)
  },
  component: UsersPage,
})

function UsersPage() {
  // Use cached data from prefetch
  const { data: users } = useSuspenseQuery(usersQueryOptions)
  return <UserList users={users} />
}
```

### Parallel Data Loading

```typescript
export const Route = createFileRoute("/dashboard")({
  loader: async ({ context }) => {
    // Load in parallel, no waterfall
    await Promise.all([
      context.queryClient.ensureQueryData(usersQueryOptions),
      context.queryClient.ensureQueryData(statsQueryOptions),
      context.queryClient.ensureQueryData(recentActivityOptions),
    ]);
  },
});
```

### Deferred Loading

```typescript
import { defer, Await } from '@tanstack/react-start'

export const Route = createFileRoute('/dashboard')({
  loader: async () => {
    return {
      // Critical - blocks render
      user: await getCurrentUser(),
      // Non-critical - streams in background
      analytics: defer(getAnalytics()),
    }
  },
  component: Dashboard,
})

function Dashboard() {
  const { user, analytics } = Route.useLoaderData()

  return (
    <div>
      <UserHeader user={user} />
      <Suspense fallback={<AnalyticsSkeleton />}>
        <Await promise={analytics}>
          {(data) => <AnalyticsChart data={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

---

## Static Server Functions (Experimental)

Static server functions execute at **build time** and cache results as static assets.

### Setup

```bash
npm install @tanstack/start-static-server-functions
```

### Usage

```typescript
import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";

const getStaticPricing = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware]) // Must be last!
  .handler(async () => {
    // Runs at build time, result cached as JSON
    const pricing = await fetchPricingFromCMS();
    return pricing;
  });
```

### Use Cases

- Data that rarely changes between builds
- CMS content
- Configuration that can be pre-computed
- Reducing runtime server load

---

## Deployment Options

### Netlify (Official Partner)

```bash
npm install @netlify/vite-plugin-tanstack-start
```

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/start/vite-plugin";
import netlify from "@netlify/vite-plugin-tanstack-start";

export default defineConfig({
  plugins: [tanstackStart(), netlify()],
});
```

**Requirements**: `netlify-cli` version 17.31+

### Vercel

Follow [Nitro deployment instructions](https://vercel.com/docs/frameworks/full-stack/tanstack-start):

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/start/vite-plugin";

export default defineConfig({
  plugins: [
    tanstackStart({
      nitro: {
        preset: "vercel",
      },
    }),
  ],
});
```

### Other Platforms

TanStack Start uses [Nitro](https://nitro.unjs.io/) for deployment, supporting:

- Cloudflare Pages/Workers
- AWS Lambda
- Azure Functions
- Node.js server
- Bun server
- Deno Deploy
- And more...

---

## React Server Components Status

### Current State (December 2025)

- **Not yet supported** in v1 RC
- **Actively in development**
- Will land as a **non-breaking v1.x addition**

### TanStack's Approach

Unlike Next.js's "all-in" RSC approach, TanStack Start will:

- Treat server components as streams of serialized JSX
- Integrate with existing TanStack Query caching
- Give developers control over caching, transport, and rendering
- Not force RSC adoption - it will be opt-in

### Expected Timeline

RSC support is expected as a minor version update (1.x) after the stable 1.0 release. The team has indicated this is a high priority.

---

## Recent Patch Notes

### November 2025 Releases

| Version   | Changes                                                 |
| --------- | ------------------------------------------------------- |
| v1.139.12 | More robust stream handling                             |
| v1.139.11 | Fixed streaming, updated Nx to v22                      |
| v1.139.10 | Fixed nonce whitespace handling                         |
| v1.139.9  | Fixed hydration errors by preserving script attributes  |
| v1.139.8  | Updated h3 server framework to 2.0.0-beta.5             |
| v1.139.7  | Fixed wildcard route matching over sibling layouts      |
| v1.139.6  | Cleaned up internal reference management                |
| v1.139.5  | Fixed component remounting with SSR disabled            |
| v1.139.4  | Fixed router plugin config resolution, h3 to 2.0.1-rc.5 |
| v1.139.3  | Fixed useBlocker for 404s and external URLs             |

---

## Sources

- [TanStack Start v1 Release Candidate Announcement](https://tanstack.com/blog/announcing-tanstack-start-v1)
- [TanStack Start Documentation](https://tanstack.com/start/latest/docs/framework/react/overview)
- [Server Functions Guide](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions)
- [Middleware Guide](https://tanstack.com/start/latest/docs/framework/react/guide/middleware)
- [Server Routes Guide](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes)
- [Static Server Functions Guide](https://tanstack.com/start/latest/docs/framework/react/guide/static-server-functions)
- [Hosting/Deployment Guide](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Netlify Partnership Announcement](https://tanstack.com/blog/netlify-partnership)
- [Netlify TanStack Start Docs](https://docs.netlify.com/build/frameworks/framework-setup-guides/tanstack-start/)
- [Vercel TanStack Start Docs](https://vercel.com/docs/frameworks/full-stack/tanstack-start)
- [GitHub Releases](https://github.com/TanStack/router/releases)
- [Beta Tracking Discussion](https://github.com/TanStack/router/discussions/2863)
- [Data Loading Guide](https://tanstack.com/router/v1/docs/framework/react/guide/data-loading)
- [Preloading Guide](https://tanstack.com/router/v1/docs/framework/react/guide/preloading)
- [InfoQ: TanStack Start v1](https://www.infoq.com/news/2025/11/tanstack-start-v1/)
- [Frontend Masters: Introducing TanStack Start](https://frontendmasters.com/blog/introducing-tanstack-start/)
- [LogRocket: TanStack Start Overview](https://blog.logrocket.com/tanstack-start-overview/)
