# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

### MCP Browser Access

- Use the Playwright MCP browser tool to open local or external sites when manual
  verification or UI capture is needed; it is available in this repo's toolchain.

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

## Internationalization (i18n) Guidelines

### Core Principles

- **Real Strings Only**: Always extract actual user-facing strings from the codebase, never create generic placeholder strings
- **Feature-Based Organization**: Structure translations to match `src/features/` directory structure
- **Type Safety**: Use TypeScript with Zod validation for all form inputs and server functions
- **User-Friendly Language**: Write clear, concise, action-oriented text that users understand

### String Extraction Process

1. **Audit Feature Files**: Read through actual component files in `src/features/[feature]/`
2. **Extract Real Strings**: Focus on UI text that users will see (buttons, labels, messages, errors, status)
3. **Organize by Component**: Group strings by component (e.g., `form.fields`, `card.actions`, `validation.errors`)
4. **Categorize by Type**: Separate into buttons, labels, messages, errors, status, descriptions
5. **Use Extracted Placeholders**: Keep original placeholder text from actual forms

### Implementation Pattern

```typescript
// ✅ CORRECT - Extract from actual code
const extractedStrings = {
  create_event: "Create New Event",
  email_placeholder: "Enter your email address",
  validation_required: "This field is required",
};

// ❌ AVOID - Generic placeholders
const genericStrings = {
  create_event: "Create Event",
  email_placeholder: "Email",
  validation_required: "Required",
};
```

### Required Namespaces

- **admin** - Admin dashboard, user management, insights, feature flags
- **campaigns** - Campaign creation, management, participation
- **events** - Event creation, management, attendance
- **games** - Game listings, details, reviews, applications, invitations
- **membership** - Membership plans, billing, subscriptions
- **settings** - User settings, preferences, account management
- **profile** - User profile management and preferences
- **teams** - Team creation and management
- **forms** - Form validation and input labels
- **errors** - Error messages and error pages
- **common** - Shared UI elements, buttons, status messages
- **navigation** - Navigation menus, breadcrumbs, links

### String Extraction Example

```typescript
// From src/features/events/components/event-create-form.tsx
export const extractedEventStrings = {
  create_title: "Create New Event",
  subtitle: "Fill in the details to create a new Roundup Games event",
  fields: {
    event_name: "Event Name",
    description: "Description",
    start_date: "Start Date",
    price: "Price ($)",
  },
  buttons: {
    create: "Create Event",
    saving: "Creating...",
  },
};
```

### Translation Usage

```typescript
import { useEventsTranslation } from "~/hooks/useTypedTranslation";

const { t } = useEventsTranslation();
const title = t("create_form.title"); // "Create New Event"
const error = t("validation.required"); // "This field is required"
```

### Testing Requirements

- **E2E Tests**: Include i18n testing in your E2E test suite
- **Locale Testing**: Test all supported languages
- **String Coverage**: Ensure all extracted strings have corresponding translations

### Documentation Updates

- Update `docs/i18n-feature-structure.md` with new namespaces
- Include extraction patterns and examples in `CLAUDE.md`
- Document any new string extraction processes

### Dynamic Type Generation

The project uses automatic type generation for translation keys to ensure type safety without manual maintenance:

```bash
# Generate TypeScript types from JSON translation files
pnpm i18n:generate-types
```

This command:

- Reads all JSON translation files from `src/lib/i18n/locales/en/`
- Generates TypeScript types in `src/lib/i18n/generated-types.ts`
- Creates 1,599+ type-safe translation keys automatically
- Updates `AllTranslationKeys` and namespace-specific types

**Type Generation Workflow:**

1. Add new translation keys to appropriate JSON files
2. Run `pnpm i18n:generate-types` to update types
3. Use auto-generated types in components with full IDE support
4. No manual type maintenance required

### Before Committing

1. **Generate Types**: Run `pnpm i18n:generate-types` after adding translation keys
2. **Check Types**: Run `pnpm check-types` to ensure type safety
3. **Test Translations**: Verify translation keys work correctly
4. **Update Documentation**: Keep docs synchronized with codebase changes
5. **Bulk Copy**: Run `cp -rf src/lib/i18n/locales/* public/locales/` to copy all locale files

This approach ensures authentic, meaningful translations that reflect the actual user experience across all languages with zero maintenance overhead for type definitions.

## Using Repomix for AI Context Management

Repomix helps create focused context bundles for AI assistants like Claude. The goal is to pack relevant files while staying under the 60,000 token limit.

### Quick Start

```bash
# Basic usage - pack specific files for a feature
npx repomix@latest --include "src/features/events/**,src/db/schema/events*" --output evt-context.xml

# Check token counts before generating
npx repomix@latest --token-count-tree 100 --include "src/features/events/**"

# Include git context for recent changes
npx repomix@latest --include "src/features/events/**" --include-diffs --include-logs --include-logs-count 20
```

### Token Optimization Strategies

1. **Start with token counting** to understand your budget:

   ```bash
   npx repomix@latest --token-count-tree --include "src/features/**/*.ts"
   ```

2. **Use targeted includes** rather than broad patterns:

   ```bash
   # Good: Specific to the task
   --include "src/features/events/*.ts,src/db/schema/events*,src/lib/payments/square*"

   # Bad: Too broad
   --include "src/**/*.ts"
   ```

3. **Remove noise** with compression and comment removal:

   ```bash
   npx repomix@latest --compress --remove-comments --include "src/features/events/**"
   ```

4. **Leverage configuration files** for complex setups:
   ```bash
   npx repomix@latest --init  # Creates repomix.config.json
   ```

### Ticket-Specific Context Bundles

For development tickets, create focused bundles that include:

- Core feature files
- Related schemas and types
- Relevant test files
- Dependencies (auth, database, utilities)
- Documentation snippets

See `repomix-configs/` directory for pre-configured bundles for each development ticket.

### Best Practices

1. **Always check token counts first** with `--token-count-tree`
2. **Include test files** for understanding expected behavior
3. **Add git context** when working on bug fixes or recent changes
4. **Use output formats wisely**:
   - XML (default): Best for Claude
   - Markdown: Human-readable documentation
   - JSON: Structured processing
5. **Keep bundles under 50k tokens** to leave room for conversation

### Example: Creating Context for Event Cancellation (EVT-1)

```bash
# First, check what we're including
npx repomix@latest \
  --token-count-tree \
  --include "src/features/events/**/*.ts" \
  --include "src/db/schema/events*.ts,src/db/schema/teams*.ts,src/db/schema/membership*.ts" \
  --include "src/lib/payments/square*.ts" \
  --include "src/lib/server/auth.ts,src/lib/server/fn-utils.ts"

# If under 60k tokens, generate the bundle
npx repomix@latest \
  --include "src/features/events/**/*.ts" \
  --include "src/db/schema/events*.ts,src/db/schema/teams*.ts,src/db/schema/membership*.ts" \
  --include "src/lib/payments/square*.ts" \
  --include "src/lib/server/auth.ts,src/lib/server/fn-utils.ts" \
  --include-diffs \
  --output repomix-evt1.xml
```

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
- `pnpm i18n:generate-types` - Generate TypeScript types from translation JSON files
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

This is a tabletop and board game management platform built with TanStack Start (full-stack React framework) and deployed to Netlify. The application uses:

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

- `src/app/` - Application-level code (providers, router setup)
- `src/features/` - Feature modules organized by domain
  - `auth/` - Authentication feature (components, hooks, API, tests)
  - `profile/` - User profile management (components, server functions, guards)
  - `layouts/` - Admin and public layout components
  - Future features will follow the same pattern
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
- `src/lib/` - Core infrastructure
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
- **E2E Testing**: Playwright for end-to-end testing

### CI/CD Pipeline

- **GitHub Actions**: Automated testing, linting, and type checking
- **Netlify Deploy Previews**: Automatic preview deployments for PRs
- **Pre-commit Hooks**: Husky + lint-staged for code quality
- **Multi-version Testing**: Tests run on Node.js 18 and 20

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

### E2E Testing with Playwright

**IMPORTANT**: Add E2E tests for all new features to ensure they work correctly from the user's perspective.

1. **Test Structure**:
   - Tests are organized by authentication requirement
   - `e2e/tests/authenticated/` - Tests requiring login
   - `e2e/tests/unauthenticated/` - Tests without login
   - Use descriptive file names: `feature.auth.spec.ts` or `feature.unauth.spec.ts`

2. **Test Data Management (CRITICAL)**:
   - **Always clean up before and after tests** to ensure isolation
   - Use cleanup utilities from `e2e/utils/cleanup.ts`
   - Example:

     ```typescript
     import { clearUserTeams } from "../../utils/cleanup";

     test.beforeEach(async ({ page }) => {
       await clearUserTeams(page, process.env.E2E_TEST_EMAIL!);
     });

     test.afterEach(async ({ page }) => {
       try {
         await clearUserTeams(page, process.env.E2E_TEST_EMAIL!);
       } catch (error) {
         console.warn("Cleanup failed:", error);
       }
     });
     ```

3. **Writing Tests**:

   ```typescript
   import { test, expect } from "@playwright/test";

   test("should display user dashboard", async ({ page }) => {
     await page.goto("/player");
     await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
   });
   ```

4. **Using Playwright MCP for Verification**:
   - Before using Playwright MCP:
     - Check if dev server is running: `curl -s http://localhost:5173/api/health`
     - If browser already in use, close it first: `mcp__playwright__browser_close`
   - Use MCP to verify UI behavior before writing/updating E2E tests
   - This ensures tests match actual application behavior

5. **Best Practices**:
   - Use Playwright's recommended locators: `getByRole`, `getByLabel`, `getByText`
   - Avoid arbitrary waits - use proper wait conditions
   - Keep tests isolated and independent
   - Test user journeys, not implementation details
   - **Clean up test data** - don't leave data that affects other tests
   - Use dedicated test users for different scenarios
   - Handle known issues (like redirect parameter stripping) pragmatically

6. **Running Tests**:
   - `pnpm test:e2e:setup` - **Run this first** to seed clean test data
   - `pnpm test:e2e` - Run all E2E tests
   - `pnpm test:e2e:ui` - Interactive UI mode for debugging
   - `pnpm test:e2e --project=chromium-auth` - Run specific test suite

7. **Authentication in Tests**:
   - Shared auth state is configured in `e2e/auth.setup.ts`
   - Tests automatically use authenticated state when in `authenticated/` folder
   - Test user credentials are in `.env.e2e`
   - For tests needing fresh auth: `test.use({ storageState: undefined });`

8. **Test Users**:
   - `test@example.com` - General authenticated tests
   - `teamcreator@example.com` - Team creation (no existing teams)
   - `profile-edit@example.com` - Profile editing tests
   - See `scripts/seed-e2e-data.ts` for all test users

9. **See Also**: `docs/E2E-BEST-PRACTICES.md` for comprehensive testing guidelines

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
  2. Use `.validator(schema.parse)` in the server function
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
├── CLAUDE.md
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
│   │   │   └── middleware
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

## Before using Playwright MCP

1. Check if dev server is running: `curl -s http://localhost:5173/api/health`
2. If MCP shows error about browser already in use, close it first: `mcp__playwright__browser_close`
3. Then navigate to the page you need

## Before rerunning E2E tests

Always use Playwright MCP to manually verify the expected behavior before running E2E tests. This helps ensure tests match the actual UI behavior.

## Dev server

Assume the dev server is running on 5173 or 8888 for every session, and check via playwright or curl

## Rules
Always read .cursor/rules/*

## Docs
Read /docs/roundup-games-plan/* as appropriate

## Development Roadmap
See /docs/development-backlog.md for prioritized feature implementation tickets
```
