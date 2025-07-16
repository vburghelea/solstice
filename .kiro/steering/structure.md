# Project Structure

## Root Directory Organization

```
├── src/                    # Source code
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── public/                 # Static assets
├── netlify/                # Netlify-specific files
├── coverage/               # Test coverage reports
└── dist/                   # Build output
```

## Source Code Structure (`src/`)

### Core Application

- `src/app/` - App-level providers and configuration
- `src/router.tsx` - TanStack Router configuration
- `src/routeTree.gen.ts` - Auto-generated route tree (do not edit)

### Routing & Pages

- `src/routes/` - File-based routing structure
  - Route files follow TanStack Router conventions
  - API routes and page components co-located

### Database Layer

- `src/db/` - Database configuration and schemas
  - `connections.ts` - Database connection setup
  - `schema/` - Drizzle ORM schemas
  - `migrations/` - Database migration files

### Authentication & Security

- `src/lib/auth/` - Better Auth configuration
  - `index.ts` - Main auth configuration
  - `middleware/` - Auth middleware (guards, etc.)
  - `types.ts` - Auth-related TypeScript types

### Core Libraries

- `src/lib/` - Core utilities and configurations
  - `env.server.ts` - Server-side environment validation
  - `env.client.ts` - Client-side environment validation
  - `form.ts` - Form utilities and validation
  - `auth-client.ts` - Client-side auth utilities
  - `security/` - Security utilities and middleware

### Feature Organization

- `src/features/` - Feature-based organization
  - Each feature contains: components, hooks, types
  - Example: `src/features/auth/components/`

### Shared Resources

- `src/shared/` - Shared utilities across features
  - `ui/` - shadcn/ui components
  - `hooks/` - Reusable React hooks
  - `lib/` - Shared utility functions

### Components

- `src/components/` - Global/shared components
  - `form-fields/` - Reusable form components
  - `auth/` - Authentication-related components

### Testing

- `src/tests/` - Test configuration and utilities
  - `setup.ts` - Test environment setup
  - `utils.tsx` - Test utilities
  - `mocks/` - Mock data and functions

## Key Conventions

### File Naming

- **Components**: PascalCase (e.g., `UserProfile.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase with `.types.ts` suffix
- **Tests**: `*.test.tsx` or `*.spec.tsx`

### Import Paths

- Use `~/` alias for src directory imports
- Prefer absolute imports over relative for better maintainability
- Group imports: external libraries, internal modules, relative imports

### Component Organization

- Co-locate related files (component, styles, tests)
- Use index files for clean exports
- Separate concerns: UI components vs. business logic

### Database Schema

- Use snake_case for database columns (configured in Drizzle)
- Schema files in `src/db/schema/`
- Export all schemas from `src/db/schema/index.ts`

### Route Structure

- Follow TanStack Router file-based routing
- API routes in `src/routes/api/`
- Page components in route files
- Use route groups for organization

### Environment Configuration

- Server-only variables in `env.server.ts`
- Client-safe variables (VITE\_ prefix) in `env.client.ts`
- Validate all environment variables with Zod schemas

### Testing Structure

- Unit tests co-located with components
- Integration tests in `__tests__` directories
- Test utilities in `src/tests/`
- Mock data centralized in `src/tests/mocks/`
- Use Vitest + React Testing Library pattern
- Test user behavior, not implementation details

## Development Workflow

### Feature Development Process

1. **Read project docs** in `docs/quadball-plan/` for context
2. **Update documentation** when implementing new features
3. **Follow development backlog** priorities in `docs/development-backlog.md`
4. **Run documentation automation** after significant changes:
   - `pnpm docs:reference` after `src/lib/` changes
   - `pnpm docs:erd` after database schema updates
   - `pnpm docs:all` for complete documentation update

### Database Development

- **Connection types**: Use `db()` by default, `pooledDb()` for API routes, `unpooledDb()` for migrations
- **Schema location**: `src/db/schema/` with exports from `index.ts`
- **Migration workflow**: `pnpm db:generate` → `pnpm db:migrate`
- **Connection priority**: Custom overrides → Netlify auto → DATABASE_URL fallback

### Security Implementation

- **Rate limiting**: Apply to auth endpoints (5/15min) and API routes (100/15min)
- **Password validation**: 8+ chars with mixed requirements and strength meter
- **Headers**: Automatic via Netlify Edge Functions with CSP nonces
- **Cookies**: Secure configuration in production (HTTPS-only, HttpOnly, SameSite)

### Form Development Pattern

- **Centralized hook**: Use `useAppForm` from `src/lib/form.ts`
- **Type inference**: Provide `defaultValues`, avoid explicit generics
- **Reusable components**: `ValidatedInput`, `ValidatedSelect` etc.
- **Validation**: Zod schemas in `validators` option
- **Construction**: `form.AppField` with render props

### Development Servers

- **Vite dev**: `pnpm dev` (port 5173) - basic development
- **Netlify dev**: `netlify dev` (port 8888) - recommended with edge functions
- **OAuth setup**: Configure redirect URLs for local development environment
