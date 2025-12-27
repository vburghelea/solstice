# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Overarching instructions

- If you run into an issue that you can't solve after trying the best practices to solve it, return and let the user know _unless you have been instructed to push through obstacles and try the next thing_.
  - This includes any time you are tempted to patch something with a workaround, or log-in or the dev server isn't working.
  - If you must do a workaround, you must document the workaround and your reasoning in an external markdown file that you share with the user when you return so they can reason about the technical debt.

## Quick Reference

- **Playwright MCP**: Use for UI verification; see "Playwright MCP" section at end
- **Server Functions**: Always use `.inputValidator(schema.parse)` with Zod schemas
- **Imports**: Avoid `@tanstack/react-start/server` in client code; use dynamic imports or `serverOnly()`
- **Package**: Use `@tanstack/react-start` (not `@tanstack/start`)
- **Type Safety**: Never use `@ts-expect-error` as first solution; see "Best Practices for Type Safety" section

### Square Payments Checklist

- Use `~/features/membership/membership.finalize.ts` whenever a Square payment session should create or
  reuse a membership. This helper ensures membership + payment session updates happen in a single
  transaction and stays idempotent.
- Client redirects expect plain query params (`success=true`, `payment_id=<id>`, `session=<checkout>`).
  The React hook `usePaymentReturn` already handles JSON-encoded values produced by TanStack.
- The Square callback (`src/routes/api/payments/square/callback.ts`) is the source of truth: it verifies
  the payment, writes metadata, finalizes memberships, and sends the receipt email once. Avoid adding
  duplicate email logic elsewhere.
- Production verification (2025‑09‑19): checkout `LUJO45SIIB655EEP`, payment `Hd3J4zVKfMdLXNXalzSO94b6upOZY`.
  Use this as a baseline when debugging future regressions.

## Repomix

For creating AI context bundles, see `repomix-configs/README.md`. Pre-configured bundles exist for each development ticket.

## Development Commands

- `pnpm dev` - Start development server (Vite on port 5173)
- `npx sst dev --stage qc-dev` - Start SST dev mode with live Lambda (QC)
- `npx sst dev --stage sin-dev` - Start SST dev mode with live Lambda (viaSport)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Type checking with TypeScript
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run Vitest tests
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Generate test coverage report
- `pnpm test:e2e` - Run Playwright E2E tests (automatically runs test:e2e:setup first)
- `pnpm test:e2e:ui` - Run E2E tests with UI mode
- `pnpm test:e2e:setup` - Seed database with E2E test data (automatically run before test:e2e)
- **Pre-commit E2E Testing**: Before committing changes to main, run Chromium E2E tests:
  ```bash
  pnpm test:e2e --reporter=html --output=e2e-test-results --workers 1 --project=chromium-unauthenticated --project=chromium-authenticated
  ```
  This ensures all browser tests pass before merging. Use `--workers 1` for consistent execution.
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
3. **Tests** - `pnpm test --run` to ensure nothing is broken

All checks must pass before the commit is allowed. The pre-commit hook matches what GitHub Actions CI runs, ensuring no surprises after pushing.

## Architecture Overview

This is **Solstice**, a sports league management platform built with TanStack Start (full-stack React framework) and deployed to AWS via SST (Serverless Stack). The application uses:

- **TanStack Router** for file-based routing with type safety
- **Better Auth** for authentication (email/password + Google OAuth)
- **Drizzle ORM** with PostgreSQL for database operations
- **TanStack Query** for server state management and caching
- **Tailwind CSS** for styling with shadcn/ui components

### Key Architectural Patterns

**Full-Stack React with TanStack Start**: The app uses TanStack Start's server-side rendering and API routes. Server-only code is isolated using `serverOnly()` wrapper.

**Database & Auth Integration**: Better Auth uses Drizzle adapter for seamless integration. Auth schemas are auto-generated with `pnpm auth:generate` command.

**File-Based Routing**: Routes follow TanStack Router conventions in `src/routes/`. Route tree is auto-generated in `routeTree.gen.ts`.

**Server State Management**: React Query handles caching and synchronization. User authentication state is cached at the root level and passed through context.

### Key Directories (Features-Based Architecture)

- `src/app/` - Application-level code (providers, router setup)
- `src/features/` - Feature modules organized by domain (auth, profile, events, teams, membership, dashboard, layouts, organizations, roles, forms, imports, notifications, reporting, etc.)
- `src/shared/` - Shared resources across features
  - `hooks/` - Shared React hooks (useTheme, etc.)
  - `lib/` - Utilities and helpers
- `src/components/` - Application-specific components
  - `ui/` - shadcn/ui components (auto-installed here via components.json)
  - `form-fields/` - Reusable form components (ValidatedInput, ValidatedSelect, etc.)
- `src/db/` - Database layer
  - `schema/` - Drizzle schema definitions (single source of truth)
  - `migrations/` - Database migrations
- `src/routes/` - Thin route files that import from features
- `src/lib/` - Core infrastructure
  - `auth/` - Better Auth configuration
  - `pacer/` - Rate limiting utilities
  - `security/` - Security utilities and middleware
- `src/tests/` - Test utilities and global test setup
- `src/tenant/` - Multi-tenant configuration

### Environment Requirements

**Local Development** (`.env` file):

- `DATABASE_URL` - PostgreSQL connection string (pooled URL for serverless)
- `DATABASE_URL_UNPOOLED` - Direct connection URL for migrations (optional)
- `VITE_BASE_URL` - Application base URL (use http://localhost:5173 for local dev)
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth (required for OAuth login)
- `BETTER_AUTH_SECRET` - Secret key for Better Auth sessions

**Production** (SST Secrets in AWS):
SST manages secrets via AWS Secrets Manager. Set secrets with:

```bash
npx sst secret set <SecretName> "<value>" --stage qc-prod
npx sst secret set <SecretName> "<value>" --stage sin-prod
```

Required SST secrets:

- `DatabaseUrl` - PostgreSQL connection string
- `BetterAuthSecret` - Auth session secret
- `GoogleClientId` / `GoogleClientSecret` - Google OAuth
- `BaseUrl` - Production URL (CloudFront distribution)
- `SquareEnv`, `SquareApplicationId`, `SquareAccessToken`, `SquareLocationId`, `SquareWebhookSignatureKey` - Square payments
- `SendgridApiKey`, `SendgridFromEmail` - Email service

### Local Development Setup

1. **Environment Files**:
   - `.env` - Main environment file
   - `.env.local` - Local overrides (git-ignored)

2. **OAuth Setup**:
   - OAuth credentials must be valid (not placeholders) for routes to work

3. **Development Servers**:
   - `AWS_PROFILE=techdev npx sst dev --stage qc-dev --mode mono` - SST dev mode (QC)
   - `AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono` - SST dev mode (viaSport)

### Database Connections

The app uses AWS RDS PostgreSQL (deployed via SST) with RDS Proxy for connection pooling:

- **Pooled connections** (`pooledDb`): For API routes and serverless functions (via RDS Proxy)
- **Unpooled connections** (`unpooledDb`): For migrations and long operations
- **Auto-detection** (`getDb`): Automatically selects based on environment

See `docs/database-connections.md` for detailed usage guide.

#### SST Tunnel Setup (Required for Dev/Prod Database Access)

The RDS databases are in a private VPC. To access them locally, you need the SST tunnel:

```bash
# One-time installation (requires sudo)
sudo npx sst tunnel install

# Start tunnel to dev database (keep running in a terminal)
AWS_PROFILE=techdev npx sst tunnel --stage qc-dev
AWS_PROFILE=techdev npx sst tunnel --stage sin-dev

# Start tunnel to production database
AWS_PROFILE=techprod npx sst tunnel --stage qc-prod
AWS_PROFILE=techprod npx sst tunnel --stage sin-prod
```

#### Accessing the Dev Database

With the tunnel running, you can:

Use `sin-dev` instead of `qc-dev` for viaSport environments.

1. **Get connection details** from SST:

   ```bash
   AWS_PROFILE=techdev npx sst shell --stage qc-dev -- printenv | grep SST_RESOURCE_Database
   ```

2. **Connect via psql**:

   ```bash
   PGPASSWORD="<password>" psql -h solstice-qc-dev-databaseproxy-<id>.proxy-<region>.rds.amazonaws.com -U postgres -d solstice
   ```

3. **Push schema changes**:

   ```bash
   AWS_PROFILE=techdev npx sst shell --stage qc-dev -- npx drizzle-kit push --force
   ```

4. **Run seed scripts** (see Database Seeding section below for which script to use)

#### Local Development with Dev Database

To use the dev RDS database for local development:

1. Start the SST tunnel (keep running):

   ```bash
   AWS_PROFILE=techdev npx sst tunnel --stage qc-dev
   ```

2. Update `.env` and `.env.e2e` with the dev database URL:

   ```
   DATABASE_URL="postgresql://postgres:<password>@solstice-qc-dev-databaseproxy-<id>.proxy-cx20ui4g0b7v.ca-central-1.rds.amazonaws.com:5432/solstice?sslmode=require"
   ```

3. Run local dev server:
   ```bash
   pnpm dev
   ```

#### Common Database Commands

```bash
# List tables
PGPASSWORD="<pass>" psql -h <host> -U postgres -d solstice -c "\dt"

# Show table schema
PGPASSWORD="<pass>" psql -h <host> -U postgres -d solstice -c "\d events"

# List columns for a table
PGPASSWORD="<pass>" psql -h <host> -U postgres -d solstice -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'events'"
```

#### Database Seeding

There are two seed scripts with different purposes:

1. **`scripts/seed-global-admins.ts`** - Creates roles and assigns admin access
   - Tenant-aware (creates viaSport Admin for sin-_, Quadball Canada Admin for qc-_)
   - Does NOT delete existing data - safe to run on any environment
   - Creates: `Solstice Admin`, tenant-specific admin, `Team Admin`, `Event Admin`
   - **Note**: This script uses Vite imports and may fail with tsx directly. Use raw SQL via SST shell instead:

   ```bash
   # Create roles directly via SST shell + psql
   AWS_PROFILE=techdev npx sst shell --stage sin-dev -- bash -c 'PGPASSWORD="$( echo $SST_RESOURCE_Database | python3 -c "import sys,json; print(json.load(sys.stdin)[\"password\"])" )" PGHOST="$( echo $SST_RESOURCE_Database | python3 -c "import sys,json; print(json.load(sys.stdin)[\"host\"])" )" psql -U postgres -d solstice -c "
   INSERT INTO roles (id, name, description, permissions, created_at, updated_at) VALUES
     ('"'"'solstice-admin'"'"', '"'"'Solstice Admin'"'"', '"'"'Platform admin'"'"', '"'"'{\"system:*\": true}'"'"', NOW(), NOW()),
     ('"'"'viasport-admin'"'"', '"'"'viaSport Admin'"'"', '"'"'viaSport admin'"'"', '"'"'{\"viasport:*\": true}'"'"', NOW(), NOW())
   ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();"'
   ```

2. **`scripts/seed-e2e-data.ts`** - Creates E2E test data (QC-specific)
   - **DELETES ALL EXISTING DATA** - only use for E2E test environments
   - Creates QC-specific: test users, teams, events, memberships
   - Use for `qc-dev` E2E testing, NOT for `sin-dev` (viaSport)

   ```bash
   # For QC E2E testing only (requires tunnel or SST dev running)
   npx tsx scripts/seed-e2e-data.ts
   ```

#### Running drizzle-kit via SST Dev Mode

The most reliable way to run database operations is through SST dev mode (which handles the tunnel automatically):

```bash
# Start SST dev (tunnel is automatic)
AWS_PROFILE=techdev npx sst dev --stage sin-dev --mode mono

# In another terminal, push schema through SST shell
AWS_PROFILE=techdev npx sst shell --stage sin-dev -- npx drizzle-kit push --force
```

### Security Features

- **CSP Headers**: Content Security Policy with nonce-based script validation
- **Secure Cookies**: HTTPS-only, HttpOnly, SameSite protection in production
- **Rate Limiting**: Configurable rate limits for auth and API endpoints
- **Password Validation**: Strong password requirements enforced
- **Security Headers**: Full suite via application middleware
- **Data Residency**: All production data in AWS `ca-central-1` (Canada) for PIPEDA compliance

### Testing Infrastructure

- **Vitest**: Modern test runner with jsdom environment
- **Testing Library**: React component testing utilities
- **Coverage**: Code coverage reporting with c8
- **Mocks**: Auth and router mocks for isolated testing
- **E2E Testing**: Playwright for end-to-end testing

### CI/CD Pipeline

- **GitHub Actions**: Automated testing, linting, and type checking
- **SST Deployments**: Deploy via `npx sst deploy --stage qc-dev|sin-dev|qc-perf|sin-perf|qc-prod|sin-prod`
- **AWS Profiles**: `techdev` for `dev`/`perf` (synthetic data), `techprod` for `production`
- **SSO Login Required**: Run `aws sso login --profile techdev` or
  `aws sso login --profile techprod` before deploying
- **Cost Control**: Any `perf` or `production` deploy requires explicit double-approval
- **Pre-commit Hooks**: Husky + lint-staged for code quality
- **Multi-version Testing**: Tests run on Node.js 18 and 20

#### Debugging Deployments with CLI Tools

```bash
# GitHub Actions CI status
gh run list --limit 5

# SST deployment status
npx sst state --stage qc-prod
npx sst state --stage sin-prod

# List AWS resources
AWS_PROFILE=techprod aws lambda list-functions --region ca-central-1
AWS_PROFILE=techprod aws cloudfront list-distributions

# Check deployment URL
curl -s https://d200ljtib0dq8n.cloudfront.net/api/health
```

### Code Organization Patterns

- **Auth Facade**: Clean API wrapper around Better Auth client
- **Theme Hook**: Reactive theme management with system preference support
- **Centralized Icons**: Reusable icon components in components/ui/icons
- **Auth Guards**: Flexible authentication protection for routes
- **Profile Guards**: Ensure users complete profile before accessing features
- **Environment Config**: Type-safe environment variable access
- **Form Components**: Reusable ValidatedInput, ValidatedSelect, etc. with TanStack Form

### Authentication Flow

1. **Login Methods**:
   - Email/password via `auth.signIn.email()`
   - OAuth via `auth.signInWithOAuth()` (Google)
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
  - Source: `docs/quadball-plan/database/schema-overview.md`
  - Output: `docs/reference/database/schema-erd.{svg,png}`
  - Uses system Chrome via `puppeteer.config.json`

### TanStack Start Server Functions

Server functions are defined using `createServerFn()` from `@tanstack/react-start` and called from React components.

> **Note**: As of v1 RC (November 2025), the package is `@tanstack/react-start`, not `@tanstack/start`.

1. **Best Practice - Use Zod Validation** (ALWAYS PREFER THIS):

```typescript
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Define schema first
const myInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

// Use .inputValidator() with schema.parse
export const myServerFn = createServerFn({ method: "POST" })
  .inputValidator(myInputSchema.parse)
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

8. **Error Handling & Redirects**:

   ```typescript
   import { redirect, notFound } from "@tanstack/react-router";

   export const protectedAction = createServerFn({ method: "POST" })
     .inputValidator(schema.parse)
     .handler(async ({ data }) => {
       const user = await getCurrentUser();
       if (!user) {
         throw redirect({ to: "/auth/login" });
       }
       const item = await db.items.find(data.id);
       if (!item) {
         throw notFound();
       }
       return item;
     });
   ```

### TanStack Start Patterns

For middleware, server routes, and data loading patterns, see:

- **Project-specific**: `docs/TANSTACK-START-2025-UPDATES.md`
- **Official docs**: [TanStack Start Documentation](https://tanstack.com/start/latest)
- **Global middleware**: Defined in `src/start.ts`

### Best Practices for Type Safety

1. **Avoid @ts-expect-error**:
   - NEVER use `@ts-expect-error` as a first solution
   - Always try proper type definitions or validation first
   - If you must use it, add a detailed comment explaining why

2. **Server Function Type Safety Checklist**:
   - ✅ Create Zod schema for input validation
   - ✅ Use `.inputValidator(schema.parse)` on server functions
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

### E2E Testing with Playwright

**IMPORTANT**: Add E2E tests for all new features.

- **Test locations**: `e2e/tests/authenticated/` and `e2e/tests/unauthenticated/`
- **Running tests**: `pnpm test:e2e` (automatically runs `test:e2e:setup` first)
- **Test credentials**: See `.env.e2e` and `scripts/seed-e2e-data.ts`
- **Cleanup utilities**: Use `e2e/utils/cleanup.ts` for test isolation
- **Full guide**: See `docs/E2E-BEST-PRACTICES.md` for comprehensive testing guidelines

### Common Tasks

- **Add a new page**: Create file in `src/routes/`
- **Add auth to a route**: Use auth guard in route's `beforeLoad`
- **Add profile completion guard**: Use `requireCompleteProfile()` from profile feature
- **Access user data**: Use `useRouteContext()` to get user from context
- **Make API calls**: Use React Query with proper error handling
- **Add UI components**: Check `src/components/ui/` for existing components first
- **Install shadcn components**: `npx shadcn@latest add <component>` (installs to `src/components/ui/`)
- **Update documentation**: Run `pnpm docs:all` after significant changes
- **Add a new server function**:
  1. Create schema in `[feature].schemas.ts`
  2. Use `.inputValidator(schema.parse)` in the server function
  3. Define proper return types
  4. Handle errors with typed error responses
- **Add E2E tests for new features**:
  1. Add tests in `e2e/tests/authenticated/` or `e2e/tests/unauthenticated/`
  2. Use `.auth.spec.ts` suffix for tests requiring authentication
  3. Use `.unauth.spec.ts` suffix for tests without authentication
  4. Run `pnpm test:e2e` to execute tests locally
- **Add client-side rate limiting to server functions**:
  1. Import `useRateLimitedServerFn` from `~/lib/pacer/hooks`
  2. Wrap your server function: `const rateLimited = useRateLimitedServerFn(serverFn, { type: "api" })`
  3. Use types: "auth" (5/15min), "api" (100/1min), "search" (10/10s), "mutation" (20/1min)
  4. See `docs/rate-limiting-with-pacer.md` for full guide

### AWS CLI Profiles

For deploying to AWS, configure your AWS CLI with SSO profiles:

```bash
# Login to AWS SSO
aws sso login --profile techprod

# Deploy to production
AWS_PROFILE=techprod npx sst deploy --stage qc-prod
AWS_PROFILE=techprod npx sst deploy --stage sin-prod

# Set secrets
AWS_PROFILE=techprod npx sst secret set DatabaseUrl "..." --stage qc-prod
AWS_PROFILE=techprod npx sst secret set DatabaseUrl "..." --stage sin-prod
```

See `~/.aws/config` for profile configuration.

---

## Playwright MCP

Use Playwright to verify UI changes on localhost:5173.

1. Check if dev server is running: `curl -s http://localhost:5173/api/health`
   - If not running, start with `AWS_PROFILE=techdev npx sst dev --stage qc-dev --mode mono`
2. If browser already in use, close first: `mcp__playwright__browser_close`
3. Always verify UI behavior with MCP before writing/updating E2E tests

## Additional Resources

- **Project docs**: `docs/quadball-plan/*`
- **Development backlog**: `docs/development-backlog.md`
