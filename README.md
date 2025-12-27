# Solstice

[![CI](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/soleilheaney/solstice/branch/main/graph/badge.svg)](https://codecov.io/gh/soleilheaney/solstice)
[![Deploy Preview](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml)

## Sports Registration Platform

Solstice is a **modern web platform for managing memberships, teams, and events**. Built with [TanStack Start](https://tanstack.com/start) and deployed on AWS via [SST](https://sst.dev/).

## Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React meta-framework)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) with PostgreSQL
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Build Tool**: [Vite 7](https://vite.dev/)
- **Environment Validation**: [@t3-oss/env-core](https://env.t3.gg/) with [Zod](https://zod.dev/)
- **Testing**: [Vitest](https://vitest.dev/) with coverage
- **Deployment**: [SST](https://sst.dev/) on AWS (Lambda + CloudFront)

## Prerequisites

- **Node.js**: v20.19.0+ (required for Vite 7)
- **pnpm**: v10+
- **PostgreSQL**: Database instance

## Environment Variables

Environment variables are validated at startup using Zod schemas. Create a `.env` file in the project root:

```env
# Database (required)
DATABASE_URL=postgresql://user:password@localhost:5432/solstice

# Application (only required in development)
VITE_BASE_URL=http://localhost:3000

# Auth (required for production)
BETTER_AUTH_SECRET=your-secret-key

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Feature Flags (optional)
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_POSTHOG_KEY=your_posthog_key
VITE_SENTRY_DSN=your_sentry_dsn
```

**Environment Validation**: The app validates all environment variables at startup and provides clear error messages for missing or invalid values. See `src/lib/env.server.ts` and `src/lib/env.client.ts` for the validation schemas.

## Project Structure

- `src/routes/` - File-based routing (pages and API endpoints)
- `src/lib/auth/` - Better Auth configuration and functions
- `src/lib/db/` - Drizzle database setup and schemas
- `src/lib/env.server.ts` - Server-side environment validation
- `src/lib/env.client.ts` - Client-side environment validation
- `src/components/ui/` - shadcn/ui components
- `src/shared/` - Shared utilities and hooks

## Development

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up the database:**

   ```bash
   pnpm db push
   ```

3. **Generate auth schemas:**

   ```bash
   pnpm auth:generate
   ```

4. **Run the development server:**
   ```bash
   pnpm dev
   ```

## Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Guidelines for Claude Code AI assistant
- **[TanStack Start Best Practices](./docs/TANSTACK-START-BEST-PRACTICES.md)** - Server functions and type safety patterns
- **[Database Connections](./docs/database-connections.md)** - Connection pooling and usage patterns
- **[Project Brief](./docs/project-brief.md)** - High-level project overview
- **[Development Backlog](./docs/development-backlog.md)** - Feature implementation roadmap

## Available Scripts

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality

- `pnpm lint` - Run ESLint
- `pnpm check-types` - Type checking with TypeScript
- `pnpm format` - Format code with Prettier

### Testing

- `pnpm test` - Run tests with Vitest
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage
- `pnpm test:watch` - Run tests in watch mode

### Database

- `pnpm db` - Run Drizzle Kit database commands
- `pnpm db:generate` - Generate database migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

### Utilities

- `pnpm auth:generate` - Generate auth schema from config
- `pnpm auth:secret` - Generate new auth secret
- `pnpm ui` - Add shadcn/ui components
- `pnpm deps` - Check for dependency updates with taze

## Dependency Management

Use [taze](https://github.com/antfu-collective/taze) to keep dependencies up to date:

```bash
# Check for updates interactively
pnpm dlx taze@latest --interactive --group

# Or use the shortcut
pnpm deps
```

Taze automatically detects your package manager and provides a safe, interactive way to update dependencies.

## Deployment

The application is deployed to AWS via SST:

```bash
# Login to AWS SSO
aws sso login --profile techprod

# Deploy to production (canonical stages)
AWS_PROFILE=techprod npx sst deploy --stage qc-prod
AWS_PROFILE=techprod npx sst deploy --stage sin-prod
```

- **Production URL**: https://d200ljtib0dq8n.cloudfront.net
- **Region**: `ca-central-1` (Canada) for PIPEDA compliance
- **Infrastructure**: Lambda + CloudFront + S3

See [SST Migration Plan](./docs/sin-rfp/sst-migration-plan.md) for deployment details and secrets configuration.

## CI/CD

GitHub Actions workflows handle:

- **Continuous Integration**: Linting, type checking, and testing on Node.js 20
- **Code Coverage**: Test coverage reports uploaded to Codecov

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

- `DATABASE_URL` - PostgreSQL connection string for CI tests
- `BETTER_AUTH_SECRET` - Auth secret key (generate with `pnpm auth:secret` locally)
- `CODECOV_TOKEN` - Codecov upload token (optional)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

## Overview and Purpose

The Solstice platform streamlines sports league management – initially serving **Quadball Canada** (the national quadball governing body) and eventually adaptable to other sports organizations. The platform enables athletes, team leaders, and administrators to handle all essential activities in one place.

**Key Features:**

- **Member Registration & Management:** User accounts, profiles, waivers, and annual memberships
- **Team Setup & Roster Management:** Team creation, player invitations, and roster management
- **Event Creation & Registration:** Tournament/league management with team/individual registration
- **Payments & Finance:** Integration with a payment platform for membership and event fees
- **Role-Based Access Control:** Admin, Team Lead, and Player permission layers
- **Communication & Notifications:** Email confirmations and announcements
- **Future Extensibility:** Multi-organization, multi-sport capability
