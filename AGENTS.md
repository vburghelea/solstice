# AGENTS.md - Coding Agent Guidelines

## Code Style Guidelines

- **Imports**: Use `~/` alias for src imports, organize with prettier-plugin-organize-imports
- **Formatting**: 2 spaces, semicolons, double quotes, trailing commas, 90 char line width
- **Types**: Strict TypeScript, avoid `any`, use type inference where possible
- **Components**: Function components only, use shadcn/ui from `~/components/ui/`
- **Naming**: PascalCase components, camelCase functions/variables, kebab-case files
- **Error Handling**: Use try-catch with proper error types, display user-friendly messages
- **Testing**: Vitest + Testing Library, mock external deps, test user behavior not implementation
- **Architecture**: Features in `src/features/`, shared code in `src/shared/`, thin route files

## Important Notes

- MCP Playwright browser tool is available for both local and external URLs; use it to verify UI flows when needed.

- Read Better Auth docs at https://www.better-auth.com/llms.txt when working with auth
- Always run `pnpm lint` and `pnpm check-types` before completing tasks

## TanStack Start Server Functions

### Key Concept: Only handler code is extracted from client bundle

When using server functions, **only code inside the `handler()` is removed from the client bundle**. Top-level imports remain in the client bundle and will execute in the browser.

### Patterns for Server-Only Modules

If a module accesses server-only resources (env vars, Node.js APIs, database), use one of these patterns:

**Pattern 1: `serverOnly()` helper (recommended for reusability)**

```typescript
import { serverOnly } from "@tanstack/react-start";

const getPaymentService = serverOnly(async () => {
  const { paymentService } = await import("~/lib/payments/service");
  return paymentService;
});

export const processPayment = createServerFn().handler(async ({ data }) => {
  const paymentService = await getPaymentService();
  return paymentService.process(data);
});
```

**Pattern 2: Dynamic import inside handler (quick one-off)**

```typescript
export const processPayment = createServerFn().handler(async ({ data }) => {
  const { paymentService } = await import("~/lib/payments/service");
  return paymentService.process(data);
});
```

### Why This Matters

❌ **This will crash in the browser:**

```typescript
import { db } from "~/db"; // Uses process.env.DATABASE_URL

export const getUsers = createServerFn().handler(async () => {
  return db.select().from(users); // db import pollutes client bundle
});
```

✅ **This works correctly:**

```typescript
const getDb = serverOnly(async () => {
  const { db } = await import("~/db");
  return db;
});

export const getUsers = createServerFn().handler(async () => {
  const db = await getDb();
  return db.select().from(users);
});
```

## Quick Reference

### Server Functions - Always Use Zod Validation

```typescript
// 1. Define schema
const mySchema = z.object({
  /* ... */
});

// 2. Use .validator(schema.parse)
export const myServerFn = createServerFn({ method: "POST" })
  .validator(mySchema.parse)
  .handler(async ({ data }) => {
    /* ... */
  });
```

### Avoid @ts-expect-error

- NEVER use as first solution
- Try Zod validation first
- Create proper type definitions
- See [TanStack Start Best Practices](./docs/TANSTACK-START-BEST-PRACTICES.md) for details

## Development Commands

- `pnpm dev` - Start development server (Vite on port 5173, default to use)
- `netlify dev` - Start Netlify Dev server (port 8888, proxies Vite and includes edge functions)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Type checking with TypeScript
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run Vitest tests
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Generate test coverage report
- `pnpm db` - Run Drizzle Kit database commands
- `pnpm auth:generate` - Generate auth schema from config
- `pnpm docs:reference` - Generate TypeDoc API documentation
- `pnpm docs:erd` - Generate database ERD diagrams from schema
- `pnpm docs:all` - Run all documentation generation

## Pre-Commit Requirements

**IMPORTANT**: The pre-commit hook automatically runs the following checks to ensure code quality:

1. **Lint-staged** - Runs on staged files only:
   - `eslint --fix` - Auto-fixes and checks ESLint rules
   - `prettier --write` - Formats code consistently
2. **Type checking** - `pnpm check-types` on entire codebase
3. **Tests** - `pnpm test` to ensure nothing is broken

All checks must pass before the commit is allowed. The pre-commit hook matches what GitHub Actions CI runs, ensuring no surprises after pushing.

## Architecture Overview

This is a tabletop and board game organization platform built with TanStack Start (full-stack React framework) and deployed to Netlify. The application uses:

- **TanStack Router** for file-based routing with type safety
- **Better Auth** for authentication (email/password + OAuth via Discord/Google)
- **Drizzle ORM** with PostgreSQL for database operations
- **TanStack Query** for server state management and caching
- **Tailwind CSS** for styling with shadcn/ui components

### Key Architectural Patterns

**Full-Stack React with TanStack Start**: The app uses TanStack Start's server-side rendering and API routes. Server-only code is isolated using `serverOnly()` wrapper.

**Database & Auth Integration**: Better Auth uses Drizzle adapter for seamless integration. Auth schemas are auto-generated with `pnpm auth:generate` command.

**File-Based Routing**: Routes follow TanStack Router conventions in `src/routes/`. Route tree is auto-generated in `routeTree.gen.ts`.

**Server State Management**: React Query handles caching and synchronization. User authentication state is cached at the root level and passed through context.

### Key Directories (Features-Based Architecture)

- `docs/` - Low-level documentation concerning best practices and library usage, such as react, better-auth and tanstack-start
- `e2e/` - End-to-end tests for the application
- `src/app/` - Application-level code (providers, router setup)
- `src/db/` - Database schemas, functions and migrations
- `src/features/` - Feature modules organized by domain
  - `auth/` - Authentication feature (components, hooks, API, tests)
  - `profile/` - User profile management (components, server functions, guards)
  - `layouts/` - Admin and public layout components
  - Future features will follow the same pattern
- `src/lib/` - Folder containing core infrastructure, shared types, helpers and middleware used across the app
- `src/shared/` - Shared resources across features
  - `ui/` - shadcn/ui components and icons (auto-installed here via components.json)
  - `hooks/` - Shared React hooks (useTheme, etc.)
  - `lib/` - Utilities and helpers
  - `types/` - Shared TypeScript types
- `src/components/` - Application-specific components
  - `form-fields/` - Reusable form components (ValidatedInput, ValidatedSelect, etc.)
- `src/db/` - Database layer
  - `schema/` - Drizzle schema definitions (single source of truth)
  - `migrations/` - Database migrations
- `src/routes/` - Thin route files that import from features
  - `auth/` - Better Auth configuration
  - `form.ts` - TanStack Form custom hook setup
  - `env.ts` - Environment variable management
  - `security/` - Security utilities and middleware
- `src/tests/` - Test utilities and global test setup

### Environment Requirements

- `DATABASE_URL` - PostgreSQL connection string (pooled URL for serverless)
- `DATABASE_URL_UNPOOLED` - Direct connection URL for migrations (optional)
- `VITE_BASE_URL` - Application base URL (only required in development - use http://localhost:8888 for Netlify Dev, http://localhost:5173 for Vite)
- `DISCORD_CLIENT_ID/SECRET` - Discord OAuth (required for OAuth login)
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth (required for OAuth login)
- `BETTER_AUTH_SECRET` - Secret key for Better Auth sessions

Netlify automatically provides:

- `URL` - The main URL of your site in production
- `SITE_URL` - The site's primary URL
- `DEPLOY_URL` - The specific deploy URL
- `NETLIFY_DATABASE_URL` - Pooled Neon database URL
- `NETLIFY_DATABASE_URL_UNPOOLED` - Direct Neon database URL

### Local Development Setup

1. **Environment Files**:
   - `.env` - Main environment file
   - `.env.local` - Local overrides (git-ignored)
   - Netlify Dev will inject values from Netlify project settings

2. **OAuth Setup**:
   - OAuth credentials must be valid (not placeholders) for routes to work

3. **Development Servers**:
   - `pnpm dev` - Vite dev server only (port 5173, what to usually use)
   - `netlify dev` - Full Netlify environment with edge functions (port 8888)

### Database Connections

The app uses Neon with proper connection pooling:

- **Pooled connections** (`pooledDb`): For API routes and serverless functions
- **Unpooled connections** (`unpooledDb`): For migrations and long operations
- **Auto-detection** (`db`): Automatically selects based on environment

See `docs/database-connections.md` for detailed usage guide.

### Security Features

- **CSP Headers**: Content Security Policy with nonce-based script validation
- **Secure Cookies**: HTTPS-only, HttpOnly, SameSite protection in production
- **Rate Limiting**: Configurable rate limits for auth and API endpoints
- **Password Validation**: Strong password requirements enforced
- **Security Headers**: Full suite via Netlify Edge Functions

### Testing Infrastructure

- **Vitest**: Modern test runner with jsdom environment
- **Testing Library**: React component testing utilities
- **Coverage**: Code coverage reporting with c8
- **Mocks**: Auth and router mocks for isolated testing

### CI/CD Pipeline

- **GitHub Actions**: Automated testing, linting, and type checking
- **Netlify Deploy Previews**: Automatic preview deployments for PRs
- **Pre-commit Hooks**: Husky + lint-staged for code quality
- **Multi-version Testing**: Tests run on Node.js 18 and 20

### Code Organization Patterns

- **Auth Facade**: Clean API wrapper around Better Auth client
- **Theme Hook**: Reactive theme management with system preference support
- **Centralized Icons**: Reusable icon components in shared/ui/icons
- **Auth Guards**: Flexible authentication protection for routes
- **Profile Guards**: Ensure users complete profile before accessing features
- **Environment Config**: Type-safe environment variable access
- **Form Components**: Reusable ValidatedInput, ValidatedSelect, etc. with TanStack Form

### Authentication Flow

1. **Login Methods**:
   - Email/password via `auth.signIn.email()`
   - OAuth via `auth.signInWithOAuth()` (Google, Discord)
2. **Protected Routes**:
   - Auth guard middleware redirects unauthenticated users
   - Profile completion guard redirects incomplete profiles to `/onboarding`
   - User state cached in React Query
3. **API Routes**:
   - All auth endpoints under `/api/auth/*`
   - Handled by Better Auth via catch-all route
4. **User Type**:
   - Better Auth's `User` type doesn't include custom fields
   - Use `ExtendedUser` type from `~/lib/auth/types` for full user data
   - `getCurrentUser()` server function fetches complete user with custom fields

### Documentation

The project includes automated documentation generation:

- **API Reference**: TypeDoc generates markdown documentation for all code in `src/lib/`
  - Run `pnpm docs:reference` to update
  - Output: `docs/reference/` (gitignored except ERDs)
  - Configuration: `typedoc.json`
- **Database ERDs**: Automatically generates diagrams from mermaid definitions
  - Run `pnpm docs:erd` to update
  - Source: `docs/roundup-games-plan/database/schema-overview.md`
  - Output: `docs/reference/database/schema-erd.{svg,png}`
  - Uses system Chrome via `puppeteer.config.json`

### TanStack Start Server Functions

Server functions are defined using `createServerFn()` and called from React components:

1. **Best Practice - Use Zod Validation** (ALWAYS PREFER THIS):

```typescript
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Define schema first
const myInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Use .validator() with schema.parse
export const myServerFn = createServerFn({ method: "POST" })
  .validator(myInputSchema.parse)
  .handler(async ({ data }) => {
    // data is now properly typed from the schema
    // Server-side implementation
    return result;
  });
```

2. **Why Use Zod Validation**:
   - Provides runtime type safety, not just compile-time
   - Eliminates need for `@ts-expect-error` in most cases
   - Better error messages for invalid inputs
   - Automatic TypeScript type inference from schemas
   - Single source of truth for input validation

3. **File Organization for Server Functions**:

```
src/features/[feature]/
├── [feature].schemas.ts    # Zod schemas for all operations
├── [feature].queries.ts    # GET server functions
├── [feature].mutations.ts  # POST/PUT/DELETE server functions
├── [feature].types.ts      # TypeScript types and interfaces
└── [feature].db-types.ts   # Database-specific type overrides (if needed)
```

4. **Calling Pattern**:

```typescript
// With validation, call matches the schema structure:
const result = await myServerFn({ data: { name: "John", email: "john@example.com" } });

// For functions with no input:
const result = await myServerFn();
```

5. **Handling Complex Types (e.g., jsonb fields)**:
   - Create separate type definition files for complex database types
   - Use type overrides when extending database types
   - Add ESLint disable comments ONLY when absolutely necessary

```typescript
// events.db-types.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface EventMetadata {
  [key: string]: any;
}

// events.types.ts
export interface EventWithDetails extends Omit<Event, "metadata"> {
  metadata: EventMetadata;
  // ... other fields
}
```

6. **Legacy Pattern** (AVOID - only for reference):

```typescript
// ❌ AVOID this pattern - it bypasses runtime validation
export const myServerFn = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: MyInputType }) => {
    return result;
  },
);
```

7. **Server-Only Module Imports**:
   - **IMPORTANT**: TanStack Start only extracts code INSIDE the `handler()` function
   - Top-level imports in server function files are included in the client bundle
   - If a module accesses server-only resources (env vars, Node APIs), it will crash in the browser

   **❌ BAD - Top-level import causes client bundle pollution:**

   ```typescript
   import { squarePaymentService } from "~/lib/payments/square"; // Accesses process.env

   export const createCheckout = createServerFn().handler(async () => {
     return squarePaymentService.createCheckoutSession(...);
   });
   ```

   **✅ GOOD - Use `serverOnly()` helper:**

   ```typescript
   import { serverOnly } from "@tanstack/react-start";

   const getSquarePaymentService = serverOnly(async () => {
     const { squarePaymentService } = await import("~/lib/payments/square");
     return squarePaymentService;
   });

   export const createCheckout = createServerFn().handler(async () => {
     const squarePaymentService = await getSquarePaymentService();
     return squarePaymentService.createCheckoutSession(...);
   });
   ```

   **✅ ALSO GOOD - Dynamic import inside handler:**

   ```typescript
   export const createCheckout = createServerFn().handler(async () => {
     const { squarePaymentService } = await import("~/lib/payments/square");
     return squarePaymentService.createCheckoutSession(...);
   });
   ```

### Best Practices for Type Safety

1. **Avoid @ts-expect-error**:
   - NEVER use `@ts-expect-error` as a first solution
   - Always try proper type definitions or validation first
   - If you must use it, add a detailed comment explaining why

2. **Server Function Type Safety Checklist**:
   - ✅ Create Zod schema for input validation
   - ✅ Use `.validator(schema.parse)` on server functions
   - ✅ Define return types explicitly
   - ✅ Create type definitions for complex database fields
   - ✅ Use type overrides for jsonb fields instead of `any`
   - ❌ Avoid type assertions like `data as Type`
   - ❌ Don't suppress errors without investigation

3. **When Adding New Features**:
   - Start with schema definitions
   - Build types from schemas using `z.infer<typeof schema>`
   - Use validation at runtime boundaries
   - Test error cases to ensure validation works

### Common Tasks

- **Add a new page**: Create file in `src/routes/`
- **Add auth to a route**: Use auth guard in route's `beforeLoad`
- **Add profile completion guard**: Use `requireCompleteProfile()` from profile feature
- **Access user data**: Use `useRouteContext()` to get user from context
- **Make API calls**: Use React Query with proper error handling
- **Add UI components**: Check `src/shared/ui/` for existing components first
- **Install shadcn components**: `npx shadcn@latest add <component>` (auto-installs to `src/shared/ui/`)
- **Update documentation**: Run `pnpm docs:all` after significant changes
- **Add a new server function**:
  1. Create schema in `[feature].schemas.ts`
  2. Use `.validator(schema.parse)` in the server function
  3. Define proper return types
  4. Handle errors with typed error responses

### User added context:

You can see the netlify production variables via `netlify env:list`
Which include:
| DATABASE_URL | \***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*** \***\* | All |
| GOOGLE_CLIENT_ID | **\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\* \***\* | All |
| GOOGLE_CLIENT_SECRET | **\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*** \***\* | All |
| NETLIFY_DATABASE_URL | **\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\***\* \***\* | All |
| NETLIFY_DATABASE_URL_UNPOOLED | **\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*** \***\* | All |
| NODE_ENV | **\*\*\***\*\*\*\*\***\*\*\***\*\*\*\*\*\*\***\*\*\***\*\*\*\*\***\*\*\*\*\*\*
\*\*\*\* | Builds, Post processing |

---

## 4 — Directory Cheat‑Sheet

Tree as of July 6, 2025

```

.
├── AGENTS.md
├── GEMINI.md
├── components.json
├── coverage
│   ├── base.css
│   ├── block-navigation.js
│   ├── coverage-final.json
│   ├── favicon.png
│   ├── features
│   │   └── auth
│   │       └── components
│   │           ├── index.html
│   │           └── login.tsx.html
│   ├── index.html
│   ├── lib
│   │   └── auth
│   │       └── middleware
│   │           ├── auth-guard.ts.html
│   │           └── index.html
│   ├── prettify.css
│   ├── prettify.js
│   ├── shared
│   │   ├── lib
│   │   │   ├── index.html
│   │   │   └── utils.ts.html
│   │   └── ui
│   │       ├── button.tsx.html
│   │       ├── icons.tsx.html
│   │       ├── index.html
│   │       ├── input.tsx.html
│   │       └── label.tsx.html
│   ├── sort-arrow-sprite.png
│   └── sorter.js
├── dist
│   ├── _headers
│   ├── _redirects
│   ├── assets
│   │   ├── createLucideIcon-Bcg0Vi2e.js
│   │   ├── index-CvP1hl19.js
│   │   ├── index-Daq_2NZw.js
│   │   ├── label-BpBwDb9J.js
│   │   ├── loader-circle-6MYg0gu7.js
│   │   ├── login-CU83squS.js
│   │   ├── main-BaDK-79R.js
│   │   ├── profile-3i2p7dMd.js
│   │   ├── route-CscgpPZC.js
│   │   ├── route-CZWZ9WpA.js
│   │   ├── signup-CuG_U93y.js
│   │   └── styles-by26pVYo.css
│   └── favicon.ico
├── docker-compose.yml
├── docs
│   ├── code-improvements.md
│   ├── database-connections.md
│   ├── project-brief.md
│   ├── roundup-games-plan
│   │   └── ... (project documentation)
│   ├── reference
│   │   └── database
│   │       ├── schema-erd.png
│   │       └── schema-erd.svg
│   └── SECURITY.md
├── drizzle.config.ts
├── eslint.config.js
├── LEARN_FULLSTACK.md
├── LICENSE
├── netlify
│   └── edge-functions
│       └── security-headers.ts
├── netlify.toml
├── package-lock.json
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── public
│   └── favicon.ico
├── puppeteer.config.json
├── README.md
├── scripts
│   ├── check-users.ts
│   ├── generate-auth-secret.js
│   ├── generate-erd.js
│   ├── test-auth.ts
│   ├── test-db-connection.ts
│   └── test-security-headers.sh
├── src
│   ├── app
│   │   └── providers.tsx
│   ├── components
│   │   ├── auth
│   │   │   └── password-input.example.tsx
│   │   ├── DefaultCatchBoundary.tsx
│   │   ├── form-fields
│   │   │   ├── FormSubmitButton.tsx
│   │   │   └── ValidatedInput.tsx
│   │   ├── NotFound.tsx
│   │   └── ThemeToggle.tsx
│   ├── db
│   │   ├── connections.ts
│   │   ├── index.ts
│   │   └── schema
│   │       ├── auth.schema.ts
│   │       └── index.ts
│   ├── features
│   │   └── auth
│   │       ├── __tests__
│   │       │   └── login.test.tsx
│   │       ├── components
│   │       │   ├── login.tsx
│   │       │   └── signup.tsx
│   │       └── useAuthGuard.tsx
│   ├── lib
│   │   ├── auth
│   │   │   ├── index.ts
│   │   │   ├── middleware
│   │   │   │   ├── __tests__
│   │   │   │   └── auth-guard.ts
│   │   │   └── types.ts
│   │   ├── auth-client.ts
│   │   ├── env.client.ts
│   │   ├── env.server.ts
│   │   ├── form.ts
│   │   ├── schemas
│   │   │   └── profile.ts
│   │   ├── security
│   │   │   ├── config.ts
│   │   │   ├── index.ts
│   │   │   ├── middleware
│   │   │   │   └── rate-limit.ts
│   │   │   └── utils
│   │   │       └── password-validator.ts
│   │   └── server
│   │       └── __tests__
│   │           └── example.test.ts
│   ├── router.tsx
│   ├── routes
│   │   ├── __root.tsx
│   │   ├── (auth)
│   │   │   ├── login.tsx
│   │   │   ├── route.tsx
│   │   │   └── signup.tsx
│   │   ├── api
│   │   │   └── auth
│   │   │       ├── $.ts
│   │   │       └── $action
│   │   ├── dashboard
│   │   │   ├── index.tsx
│   │   │   ├── profile.tsx
│   │   │   └── route.tsx
│   │   └── index.tsx
│   ├── routeTree.gen.ts
│   ├── shared
│   │   ├── hooks
│   │   │   └── useTheme.ts
│   │   ├── lib
│   │   │   └── utils.ts
│   │   └── ui
│   │       ├── __tests__
│   │       │   └── button.test.tsx
│   │       ├── button.tsx
│   │       ├── icons.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       └── README.md
│   ├── styles.css
│   └── tests
│       ├── mocks
│       │   └── auth.ts
│       ├── README.md
│       ├── setup.ts
│       └── utils.tsx
├── tsconfig.json
├── typedoc.json
├── vite.config.ts
└── vitest.config.ts

125 directories, 120 files


## Tool available

Always use your playwright tool to navigate to localhost:5173 or 8888 to test changes before finishing

## Dev server

Assume the dev server is running on 5173 or 8888 for every session, and check via playwright or curl

## Rules
Always read .cursor/rules/*

## Docs
Read /docs/roundup-games-plan/* as appropriate

## Development Roadmap
See /docs/development-backlog.md for prioritized feature implementation tickets
```

**Security Configuration (docs/SECURITY.md):**

- **Layers of Security:** Security Headers (Netlify Edge Functions), Secure Cookie Configuration (Better Auth), Rate Limiting, Password Validation, Content Security Policy (CSP).
- **Security Headers:** CSP (nonce-based), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, X-XSS-Protection, Permissions-Policy, Strict-Transport-Security.
- **Cookie Configuration:** `secure: true`, `sameSite: "lax"`, `httpOnly: true`.
- **Rate Limiting:** Configured for auth (5 req/15 min) and API (100 req/15 min) endpoints.
- **Password Requirements:** Min 8 chars, requires uppercase, lowercase, numbers, special chars.
- **CSP:** Nonce-based for inline scripts, allows specific external resources, blocks unsafe inline styles.
- **Environment Variables:** `COOKIE_DOMAIN`, `OAUTH_ALLOWED_DOMAINS`.
- **Development vs. Production:** Differences in cookie security, email verification, CSP.

**TanStack Start Best Practices (docs/TANSTACK-START-BEST-PRACTICES.md):**

- **Server Functions:** Always use Zod validation with `.validator(schema.parse)` for runtime safety, better error messages, and type inference. Avoid direct type assertions.
- **Type Safety:** Create proper type definitions for Drizzle ORM's `jsonb` fields. Define typed error responses.
- **File Organization:** Organize server functions by feature (e.g., `teams.schemas.ts`, `teams.queries.ts`, `teams.mutations.ts`).
- **Common Pitfalls:** Nested data in update operations, matching call structure to schema, clean imports.
- **Pre-commit Checks:** `pnpm lint`, `pnpm check-types`, `pnpm test` must pass.

**Authentication Custom Fields (docs/auth-custom-fields.md):**

- **Challenge:** Better Auth session returns limited user fields.
- **Solution:** Extend user table in `src/db/schema/auth.schema.ts` with custom fields (e.g., `profileComplete`, `gender`, `pronouns`). Define `ExtendedUser` type in `src/lib/auth/types.ts`. Fetch complete user data via `getCurrentUser` server function in `src/features/auth/auth.queries.ts`.
- **Usage:** Access custom fields through route context.

**Code Improvements (docs/code-improvements.md):**

- **`process is not defined` Error:** Caused by server-only code accessing `process.env` in client bundle. Resolved by Vite `define` solution in `vite.config.ts`.
- **CSP Implementation:** Nonce-based solution implemented in `src/server.ts` and `src/router.tsx`.
- **Auth Client Facade:** Cleaner API for authentication (`auth.signIn.email()` instead of `authClient.signIn.email()`).
- **Theme Management:** Centralized `useTheme` hook in `src/shared/hooks/useTheme`.
- **Centralized Icon Management:** Icons imported from `src/shared/ui/icons`.
- **Authentication Route Guards:** Declarative guards using `useAuthGuard` in `src/features/auth/useAuthGuard.tsx`.

**Database Connection Guide (docs/database-connections.md):**

- **Connection Types:** Pooled (`pooledDb`) for serverless functions/API routes, Unpooled (`unpooledDb`) for migrations/long operations.
- **Automatic Selection:** Default `db` export automatically selects based on environment.
- **Environment Variables:** `NETLIFY_DATABASE_URL`, `NETLIFY_DATABASE_URL_UNPOOLED` (Netlify auto), `DATABASE_URL`, `DATABASE_URL_UNPOOLED` (manual), `DATABASE_POOLED_URL`, `DATABASE_UNPOOLED_URL` (custom override).
- **Best Practices:** Use default `db` for most cases, explicitly use `pooledDb` in serverless functions, `unpooledDb` for migrations.

**Development Backlog (docs/development-backlog.md):**

- **Completed Work:** Roundup Games Design System, Profile Schema Extension, Complete Profile Onboarding Flow.
- **High Priority Features:** Events Feature Frontend Implementation, Integrate Roles System with Admin Access.
- **Next Up:** UI Component Consolidation, Members Directory Feature, Team Invitations Flow.
- **Future Roadmap:** Event Registration Payment, E-transfer, Image Uploads, Mobile PWA, Public Content Pages, Advanced Permissions, Bulk Operations, Analytics Dashboard.
- **Cross-Cutting Notes:** All new features require E2E tests, documentation updates, Zod validation for server functions, shadcn components installed to `src/components/ui`, rate limiting with Pacer.

**E2E Auth Validation Updates (docs/e2e-auth-validation-updates.md):**

- **Updates:** Tests updated to match TanStack Form validation behavior (error messages) instead of HTML5 validation.
- **Password Mismatch:** Added timeout for TanStack Form validation.
- **Email Format:** Verifies invalid email prevents navigation.
- **Server-Side Validation:** Separate file for tests requiring API responses.
- **Search Functionality:** Debounced search requires ~2 seconds timeout.
- **UI Structure:** Differences from test expectations (e.g., no `.transition-shadow` classes).

**E2E Testing Issues (docs/e2e-testing-issues.md):**

- **Comprehensive Patch:** Applied fixes for logout, WebKit navigation, login error handling, Firefox slowMo.
- **All Issues Fixed:** Logout tests, Firefox NS_BINDING_ABORTED, navigation issues with SafeLink, profile/team management, login error display, WebKit navigation.
- **Key Fixes:** Better Auth's `signOut()`, try-catch for login errors, SafeLink for WebKit, 50ms slowMo for Firefox.
- **Root Cause Analysis:** TanStack Router + WebKit incompatibility, logout state management, browser timing differences, error state rendering.
- **Recommended Changes:** Server-side logout, loading states, WebKit-compatible navigation component (`SafeLink`), proper error boundaries, navigation guards.

**E2E Testing Workarounds (docs/e2e-testing-workarounds.md):**

- **Firefox:** `slowMo: 100` to prevent `NS_BINDING_ABORTED` errors.
- **WebKit/Safari:** `SafeLink` component (uses native `<a>` tags, handles navigation with `useNavigate()`, detects active states).
- **Better Auth `signOut`:** Use documented method with `fetchOptions` for consistent behavior.
- **Login Error Handling:** Try-catch wrapper around auth operations.

**Project Brief (docs/project-brief.md):**

- **Overview:** Comprehensive platform for tabletop/board game enthusiasts to organize sessions, events, memberships, teams.
- **User Roles:** Organization Admins (Global, Event Coordinators), Team Logins, Individual Logins.
- **Features:** Event Management, Export/Reporting, Membership Renewal, Landing Page, Payment Integration, Notifications, Integrations (Social Media, Google Forms/Calendar).
- **Security/Privacy:** GDPR compliance, secure handling of sensitive data.
- **Goals:** User-friendly, comprehensive functionality, customizable, flexible, secure.
- **Brand Guidelines:** Color Palette (Red, Neutrals), Typography (Oswald, Montserrat, Roboto).

**Rate Limiting (docs/rate-limiting-with-pacer.md, docs/rate-limiting.md):**

- **Tool:** TanStack Pacer for client-side rate limiting.
- **Types:** `auth` (5 req/15 min), `api` (100 req/1 min), `search` (10 req/10 sec), `mutation` (20 req/1 min).
- **Usage:** `useRateLimitedServerFn` hook to wrap server functions. `useRateLimitedSearch` for search operations.
- **Benefits:** Prevents overwhelming server, immediate user feedback, reduced server load.
- **Why Client-Side Only:** Effective for serverless deployments (no shared state needed, immediate feedback, reduced server load).

**Server Functions Guide (docs/roundup-games-plan/api/server-functions.md):**

- **Overview:** Type-safe communication between client and server, wrapped with `serverOnly()`.
- **Access:** Full access to DB, auth state, external APIs, server-side env vars.
- **Use Cases:** Data fetching (`.queries.ts`), data mutation (`.mutations.ts`), auth logic, edge middleware, page data (route loaders).
- **Creation:** Organize in feature directories, handle authentication/authorization, implement error handling (Zod validation recommended).
- **Calling:** Use TanStack Query to call server functions from client components.
- **Best Practices:** File organization, type safety, authentication patterns, database transactions, caching strategy (React Query).

**Architecture Overview (docs/roundup-games-plan/architecture/overview.md):**

- **System Architecture:** Client Layer (Browser -> TanStack Router -> React Components -> TanStack Query -> Server Functions) -> Server Layer (TanStack Start -> Better Auth -> Business Logic -> Drizzle ORM -> PostgreSQL).
- **Technology Choices:** TanStack Start, Better Auth, Drizzle ORM, Neon PostgreSQL, React Query, Tailwind CSS + shadcn/ui.
- **Core Principles:** Feature-Based Organization, Type Safety Everywhere, Security First, Performance Optimization.
- **Deployment:** Local (Vite, Netlify Dev, Docker), Production (Netlify, Neon).

**Database Schema & Relationships (docs/roundup-games-plan/database/schema-overview.md):**

- **Overview:** PostgreSQL with Drizzle ORM.
- **Implemented:** Better Auth tables (`users`, `sessions`, `accounts`).
- **Future Entities:** RBAC, Membership, Team, Event, Payment, Audit, Game Systems.
- **Design Principles:** Extensibility via JSONB, Audit Trail, Soft Deletes, Optimistic Concurrency.
- **Performance:** Current and future indexes.
- **Data Integrity:** Current and future constraints.
- **Migration Strategy:** Drizzle for schema changes (`pnpm db:generate`, `pnpm db:push`).
- **Security:** Sessions expire, passwords hashed, OAuth tokens secure. Future: Sensitive data encryption, Row-Level Security.

**Roundup Games Platform (docs/roundup-games-plan/index.md):**

- **Current Features:** Authentication, User Profiles, Dashboard, Theme Support.
- **In Progress:** Teams.
- **Planned:** Events, Payments, Email, Analytics.
- **Project Documentation:** Architecture, Server Functions, Database Schema, Component Guide, Roadmap.

**External Integrations (docs/roundup-games-plan/integrations/README.md):**

- **Resend Email:** Handles transactional emails (welcome, receipts, password resets). Configured via `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`.
- **Cloudinary Media Storage:** Planned for team logos, event photos, user avatars, documents. Configured via `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Social Media APIs:** Planned for Instagram (embed posts), Facebook (event cross-posting).
- **Development Guidelines:** Add env vars, create service wrapper, webhook handlers, documentation.
- **Security Best Practices:** Never commit API keys, validate webhook signatures, rate limiting, error handling, logging.

**UI & Component Guide (docs/roundup-games-plan/ui-flows/component-guide.md):**

- **Component System:** shadcn/ui for foundational components.
- **Project-Specific Components:** `ValidatedInput`, `FormSubmitButton`, `ThemeToggle`.
- **Component Patterns:** Consistent form components, loading states (skeletons, inline loaders), error states.
- **Styling Conventions:** Tailwind CSS, `class-variance-authority` for variants.
- **Accessibility:** Semantic HTML, ARIA labels, keyboard navigation, focus indicators, error announcements.
- **Future Components:** DataTable, DatePicker, FileUpload, RichTextEditor, StatsCard.
- **Development Guidelines:** Check existing components, start with shadcn/ui, naming conventions, TypeScript types, test accessibility.

**User Journeys (docs/roundup-games-plan/ui-flows/user-journeys.md):**

- **Core User Types:** Players, Team Managers, Event Coordinators, Administrators.
- **Primary Journeys:** New Member Onboarding (Implemented), Team Registration for Event (Planned), Event Creation and Management (Planned), Member Renewal (Planned).
- **Supporting Flows:** Password Reset (Planned), Team Roster Management (Planned), Profile Updates (Implemented).
- **Error Handling:** Authentication errors, permission errors, payment errors, validation errors.
- **Mobile Considerations:** Optimized for mobile (touch-friendly, progressive forms, simplified navigation, offline support).
- **Analytics Events:** Track registration, membership, event, profile completion.

**Resend Email Integration (docs/resend-email-integration.md):**

- **Status:** Active (March 2025).
- **Environment Variables:** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`, optional feature flags (`WELCOME_EMAIL_ENABLED`, `INVITE_EMAIL_ENABLED`).
- **Code Architecture:** Service pattern with environment-based switching (`resend.ts`, `mock-email-service.ts`), loaded via `serverOnly()`.
- **Email Templates:** Membership Purchase Receipt, Welcome Email, Password Reset, Team Invitation, Event Confirmation.
- **Development Mode:** Mock sender logs payloads instead of sending when credentials are absent.
- **Best Practices:** Keep templates in code, include text variants, validate payloads with Zod, monitor Resend activity logs, handle failures gracefully.

**State Management Recommendations (docs/state-management-recommendations.md):**

- **Current Strengths:** Minimal state, React Query for server state, calculated values, state proximity.
- **Improvements:** Custom hooks (`useAuthForm`, `useLocalStorage`, `useFocusOnMount`, `useAsyncState`, `useProfileFormReducer`), Context for cross-cutting concerns (`ThemeContext`).
- **Recommendations:** Group related state, avoid contradictions/redundancy.
- **Tool Usage:** `useState` (simple), `useReducer` (complex related state), `Context` (cross-cutting), `React Query` (server state).
- **Anti-Patterns:** Don't sync props to state, don't duplicate server data, don't create deeply nested state, don't store derived state.

**TanStack Start (docs/tanstack-start.md):**

- **Overview:** Full-stack React framework with TanStack Router, SSR, streaming, server functions.
- **Dependencies:** TanStack Router, Vite.
- **Router:** `src/router.tsx` dictates behavior, `routeTree.gen.ts` auto-generated for type safety.
- **Server Entry Point:** `src/server.ts` for SSR-related work.
- **Client Entry Point:** `src/client.tsx` for hydrating client-side JavaScript.
- **Root of Application:** `__root` route (`src/routes/__root.tsx`) for application shell and global logic.
- **Routes:** Defined with `createFileRoute`, code-split, lazy-loaded, critical data fetching via `loader`.
- **Navigation:** `Link` component, `useNavigate` hook, `useRouter` hook.
- **Server Functions (RPCs):** Created with `createServerFn`, run only on server, can be called from client/server, access request context, environment variables.
- **Mutations:** Use server functions, invalidate data on client (`router.invalidate()` or `queryClient.invalidateQueries()`).
- **Data Loading:** `loader` function in routes, isomorphic, cached on client.
- **Server Function Configuration:** `method` (`GET`/`POST`), `response` (`data`/`full`/`raw`).
- **Input Validation:** `validator` method (can use Zod).
- **Context:** Access server request context using utilities from `@tanstack/react-start/server`.
- **Returning Values:** Primitives, JSON-serializable objects, redirect errors, notFound errors, raw Response objects.
- **Error Handling:** Server functions throw errors (serialized to client with 500 status).
- **Cancellation:** Client-side server function calls can be canceled via `AbortSignal`.
- **Calling Server Functions:** From route lifecycles, hooks/components (`useServerFn`), other server functions.
- **No-JS Server Functions:** Form submission with `action={yourFn.url}`.
- **Static Server Functions:** Executed at build time, cached as static assets (`type: 'static'`).
- **Middleware:** Customize server function behavior (`createMiddleware`), for authentication, authorization, logging, context. Global middleware (`registerGlobalMiddleware`) and server function specific middleware.

**Teams Feature Documentation (docs/teams-feature.md):**

- **Status:** Complete (January 2025).
- **Database:** `teams`, `team_members` tables.
- **Features:** Create, manage, browse teams; member invitations and roles (`captain`, `coach`, `player`, `substitute`).
- **Server Functions:** Queries (`getTeam`, `listTeams`, `getTeamMembers`, `searchTeams`, `canUserManageTeam`), Mutations (`createTeam`, `updateTeam`, `addTeamMember`, `updateTeamMember`, `removeTeamMember`, `deactivateTeam`).
- **UI Components:** Routes for listing, creating, browsing, managing teams and members.
- **Permissions:** Any authenticated user with complete profile can create teams. Captains/Coaches manage.
- **TypeScript Workaround:** Type assertions (`as any`) due to TanStack Start type inference limitations.

**Teams Feature TypeScript Errors (docs/teams-typescript-errors.md):**

- **Issue:** False positive TypeScript errors due to TanStack Start's server function validator pattern limitations (GitHub Issue #2759).
- **Error Pattern:** "Object literal may only specify known properties, and 'X' does not exist in type 'OptionalFetcherDataOptions<undefined, (data: unknown) => ...>'".
- **Workaround:** Type assertions (`as any`) used temporarily.

**Testing Server Functions in Production (docs/testing-server-functions.md):**

- **Approaches:** Health Check Endpoints, Integration Tests (Playwright), Production Monitoring (APM like Sentry, New Relic), Synthetic Monitoring, Manual Testing Checklist, Database Query Monitoring, Load Testing (k6, Artillery), Feature Flags, Rollback Strategy, Production Debugging.
- **Key Recommendations:** Health checks, structured logging, monitor key metrics, test with production-like data, rollback plans, feature flags, document everything.

**UI Design Prompt (docs/ui-design-prompt.md):**

- **Project Summary:** Comprehensive registration and events management platform.
- **User Types:** Organization Admins, Team Logins, Individual Players.
- **Core Features:** Landing Page, User Dashboards (Admin, Team, Individual), Event Management Interface, Registration Flow.
- **UX Requirements:** Mobile-responsive, intuitive, clear visual hierarchy, accessibility, fast loading.
- **Brand Guidelines:** Color Palette (Red, Neutrals), Typography (Oswald, Montserrat, Roboto).
- **Design Priorities:** User-friendly, professional, efficient, flexible, secure.
- **Key UI Components:** Event cards, forms with validation, payment interfaces, user role management, data export/reporting, notifications, profile forms, team rosters, analytics dashboards.

**User Roles, Tags, and Permissions V2 (docs/user-roles-and-permissions-v2.md):**

- **System:** Hybrid of Roles (access control) and Tags (categorization). Membership Status tracked separately.
- **Roles:** Platform Admin (Global), Games Admin (Organization), Team Admin (Team-specific), Event Admin (Event-specific). Users can have multiple roles.
- **Tags:** Descriptive labels for searching/filtering (Official, Team, Player, Custom).
- **Database Schema:** `roles`, `user_roles`, `tags`, `user_tags` tables. Includes seed data.
- **Implementation:** Types/Interfaces (`Role`, `UserRole`, `Tag`, `UserTag`), `PermissionService` (e.g., `canUserAccessTeam`, `isGlobalAdmin`), `TagService` (e.g., `getUserTags`, `findUsersByTags`, `assignTag`).
- **Updated Auth Context:** `getCurrentUser` includes roles, tags, and active membership.
- **Search Implementation:** `searchUsers` server function filters by tags, roles, membership, team.
- **Usage Examples:** Assigning roles, checking permissions, managing tags, filtering UI elements.
- **Benefits:** Clear separation, flexible scoping, searchability, membership independence, extensibility, performance.
- **Migration Strategy:** Phase 1 (roles), Phase 2 (tags), Phase 3 (search/filtering), Phase 4 (admin UI), Phase 5 (automated tag management).
- **Immediate Tasks:** Create roles schema, update schema index, create `PermissionService`, update `getCurrentUser`, hide Reports tab, add role guards, create seed script, write tests for `PermissionService`.

## Added Memories

- **Forms Documentation (docs/FORMS.md):**
- **Location of Form Components:** `src/components/form-fields/` (e.g., `ValidatedInput`, `ValidatedSelect`, `FormSubmitButton`).
- **Validation Strategy:** Prefer Zod schemas for runtime validation and type inference. Avoid inline validation.
- **Server Function Validation:** Use `.validator(schema.parse)` for server functions.
- **Best Practices:** Schema-first validation, consistent error handling, loading state management, accessibility, performance optimization (debouncing).
- **Migration:** Guide provided for migrating from `useState` to TanStack Form.
