# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server
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

## Architecture Overview

This is **Solstice**, a sports league management platform built with TanStack Start (full-stack React framework) and deployed to Netlify. The application uses:

- **TanStack Router** for file-based routing with type safety
- **Better Auth** for authentication (email/password + OAuth via GitHub/Google)
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
  - Future features will follow the same pattern
- `src/shared/` - Shared resources across features
  - `ui/` - shadcn/ui components and icons
  - `hooks/` - Shared React hooks (useTheme, etc.)
  - `lib/` - Utilities and helpers
  - `types/` - Shared TypeScript types
- `src/db/` - Database layer
  - `schema/` - Drizzle schema definitions (single source of truth)
  - `migrations/` - Database migrations
- `src/routes/` - Thin route files that import from features
- `src/lib/` - Core infrastructure
  - `auth/` - Better Auth configuration
  - `env.ts` - Environment variable management
  - `security/` - Security utilities and middleware
- `src/tests/` - Test utilities and global test setup

### Environment Requirements

- `DATABASE_URL` - PostgreSQL connection string (pooled URL for serverless)
- `DATABASE_URL_UNPOOLED` - Direct connection URL for migrations (optional)
- `VITE_BASE_URL` - Application base URL
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth

Netlify automatically provides:

- `NETLIFY_DATABASE_URL` - Pooled Neon database URL
- `NETLIFY_DATABASE_URL_UNPOOLED` - Direct Neon database URL

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
- **Environment Config**: Type-safe environment variable access
