# Tech Stack

## Core Framework & Build System

- **Framework**: TanStack Start (React meta-framework)
- **Build Tool**: Vite 7 (requires Node.js v20.19.0+)
- **Package Manager**: pnpm v10+
- **TypeScript**: Strict configuration with exact optional property types
- **Target**: Netlify deployment

## Frontend Stack

- **UI Framework**: React 19 with React Compiler
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Icons**: Lucide React
- **Routing**: TanStack Router with file-based routing
- **State Management**: TanStack Query for server state
- **Forms**: TanStack React Form with Zod validation

## Backend & Database

- **Database**: PostgreSQL with Drizzle ORM
- **Database Providers**: Neon, Vercel Postgres support
- **Authentication**: Better Auth with OAuth (Google) and email/password
- **Environment Validation**: @t3-oss/env-core with Zod schemas

## Development Tools

- **Linting**: ESLint with TypeScript, React, and TanStack plugins
- **Formatting**: Prettier with import organization and Tailwind class sorting
- **Testing**: Vitest with jsdom, React Testing Library, coverage reports
- **Git Hooks**: Husky with lint-staged for pre-commit checks
- **Documentation**: TypeDoc for API docs, Mermaid for ERDs

## Common Commands

```bash
# Development
pnpm dev              # Start Vite dev server (port 5173)
netlify dev           # Start Netlify Dev with edge functions (port 8888)
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm check-types      # TypeScript type checking
pnpm format           # Format with Prettier

# Testing
pnpm test             # Run tests
pnpm test:coverage    # Run tests with coverage
pnpm test:watch       # Watch mode
pnpm test path/to/file.test.tsx  # Run single test file
pnpm test -t "test name"         # Run tests matching pattern

# Database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio

# Auth & UI
pnpm auth:generate    # Generate auth schema
pnpm auth:secret      # Generate auth secret
pnpm ui               # Add shadcn/ui components

# Documentation
pnpm docs:reference   # Generate TypeDoc API docs
pnpm docs:erd         # Generate database ERD diagrams
pnpm docs:all         # Update all automated documentation

# Dependencies
pnpm deps             # Interactive dependency updates (taze)
```

## Environment Variables

All environment variables are validated at startup using Zod schemas:

- **Server-side**: `src/lib/env.server.ts` (DATABASE_URL, BETTER_AUTH_SECRET, etc.)
- **Client-side**: `src/lib/env.client.ts` (VITE\_ prefixed variables only)
- **Required**: DATABASE_URL, VITE_BASE_URL, BETTER_AUTH_SECRET (production)

## Code Style Conventions

- **Imports**: Auto-organized with prettier-plugin-organize-imports
- **Quotes**: Double quotes, semicolons required
- **Line Length**: 90 characters
- **Trailing Commas**: Always
- **Path Aliases**: `~/` and `@/` for src directory
- **TypeScript**: Strict mode, no `any` types, use type inference
- **Components**: Function components only, PascalCase naming
- **Files**: kebab-case for files, camelCase for functions/variables

## Form Development Guidelines

Follow the centralized form pattern using TanStack Form:

1. **Use `useAppForm` hook** from `src/lib/form.ts` (configured with `createFormHook`)
2. **Type safety via inference** - provide strongly-typed `defaultValues`, avoid explicit generics
3. **Reusable field components** - use `ValidatedInput`, `ValidatedSelect` etc. from form hook
4. **Zod validation** - pass Zod schemas to `validators` option for consistent validation
5. **Form construction** - use `form.AppField` with `name` prop and render prop pattern

## Database Connection Patterns

- **Use `db()` by default** - automatically selects pooled/unpooled based on environment
- **Use `pooledDb()` explicitly** - for API routes and serverless functions (< 30 seconds)
- **Use `unpooledDb()` explicitly** - for migrations and long-running operations (> 30 seconds)
- **Connection priority**: Custom overrides → Netlify auto-setup → fallback to DATABASE_URL

## Security Requirements

- **Rate limiting** on auth endpoints (5 requests/15min) and API routes (100 requests/15min)
- **Strong password validation** with strength meter (8+ chars, mixed case, numbers, symbols)
- **Secure cookies** in production (HTTPS-only, HttpOnly, SameSite=lax)
- **CSP headers** with nonce-based script validation via Netlify Edge Functions
- **PIPEDA compliance** for Canadian privacy laws

## Documentation Automation

- **After significant `src/lib/` changes**: Run `pnpm docs:reference` to update API docs
- **After database schema updates**: Run `pnpm docs:erd` to regenerate ERD diagrams
- **Use `pnpm docs:all`** to update all automated documentation
- **Update project docs** in `docs/quadball-plan/` when implementing new features

## Key Resources

When working with core technologies, reference these URLs:

- **Better Auth**: https://www.better-auth.com/llms.txt
- **TanStack Start**: https://tanstack.com/start/latest/docs/framework/react/overview
- **Netlify**: https://docs.netlify.com/llms.txt
- **Vite**: https://vite.dev/llms.txt
