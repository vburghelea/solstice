# AGENTS.md - Coding Agent Guidelines for Solstice

# Immediately read and follow the root-level CLAUDE.md

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
- Always run `pnpm lint` and `pnpm check-types` before completing long tasks (not in regular conversation)

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
