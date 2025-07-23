# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server (Vite on port 5173)
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

**IMPORTANT**: Before committing any code changes, you MUST run the following commands to ensure code quality:

1. `pnpm lint` - Run ESLint to check for code style issues
2. `pnpm check-types` - Run TypeScript type checking
3. `pnpm test` - Run all tests to ensure nothing is broken

All three commands must pass successfully before committing. If any errors are found, fix them before proceeding with the commit.

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
- `VITE_BASE_URL` - Application base URL (use http://localhost:8888 for Netlify Dev, http://localhost:5173 for Vite)
- `GITHUB_CLIENT_ID/SECRET` - GitHub OAuth (required for OAuth login)
- `GOOGLE_CLIENT_ID/SECRET` - Google OAuth (required for OAuth login)
- `BETTER_AUTH_SECRET` - Secret key for Better Auth sessions

Netlify automatically provides:

- `NETLIFY_DATABASE_URL` - Pooled Neon database URL
- `NETLIFY_DATABASE_URL_UNPOOLED` - Direct Neon database URL

### Local Development Setup

1. **Environment Files**:
   - `.env` - Main environment file
   - `.env.local` - Local overrides (git-ignored)
   - Netlify Dev will inject values from Netlify project settings

2. **OAuth Setup**:
   - OAuth credentials must be valid (not placeholders) for routes to work
   - Configure redirect URLs for local development:
     - Google: `http://localhost:8888/api/auth/callback/google`
     - GitHub: `http://localhost:8888/api/auth/callback/github`

3. **Development Servers**:
   - `pnpm dev` - Vite dev server only (port 5173)
   - `netlify dev` - Full Netlify environment with edge functions (port 8888, recommended)

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

### Authentication Flow

1. **Login Methods**:
   - Email/password via `auth.signIn.email()`
   - OAuth via `auth.signInWithOAuth()` (Google, GitHub)
2. **Protected Routes**:
   - Auth guard middleware redirects unauthenticated users
   - User state cached in React Query
3. **API Routes**:
   - All auth endpoints under `/api/auth/*`
   - Handled by Better Auth via catch-all route

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

### Common Tasks

- **Add a new page**: Create file in `src/routes/`
- **Add auth to a route**: Use auth guard in route's `beforeLoad`
- **Access user data**: Use `useRouteContext()` to get user from context
- **Make API calls**: Use React Query with proper error handling
- **Add UI components**: Check `src/shared/ui/` for existing components first
- **Update documentation**: Run `pnpm docs:all` after significant changes

### User added context:

You can see the netlify production variables via `netlify env:list`
Which include:
| DATABASE_URL | ****\*\*****\*\*****\*\*****\*\*****\*\*****\*\*****\*\***** \***\* | All |
| GOOGLE_CLIENT_ID | **\*\*****\*\*****\*\*****\*\*\*\*****\*\*****\*\*****\*\***** \***\* | All |
| GOOGLE_CLIENT_SECRET | **\*\*****\*\*****\*\*****\*\*\*\*****\*\*****\*\*****\*\***** \***\* | All |
| NETLIFY_DATABASE_URL | **\*\*****\*\*****\*\*****\*\*\*\*****\*\*****\*\*****\*\***** \***\* | All |
| NETLIFY_DATABASE_URL_UNPOOLED | **\*\*****\*\*****\*\*****\*\*\*\*****\*\*****\*\*****\*\***** \***\* | All |
| NODE_ENV | **\*\*****\*\*****\*\*****\*\*\*\*****\*\*****\*\*****\*\*****
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
│   ├── quadball-plan
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

Always use your playwright tool to navigate to localhost:8888 to test changes before finishing

## Dev server

Assume the dev server is running on 8888 for every session, and check via playwright or curl

## Rules
Always read .cursor/rules/*

## Docs
Read /docs/quadball-plan/* as appropriate

## Development Roadmap
See /docs/development-backlog.md for prioritized feature implementation tickets
```
