# Solstice

[![CI](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/soleilheaney/solstice/branch/main/graph/badge.svg)](https://codecov.io/gh/soleilheaney/solstice)
[![Deploy Preview](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml/badge.svg)](https://github.com/soleilheaney/solstice/actions/workflows/deploy-preview.yml)

## Sports Registration Platform

Solstice is a **modern web platform for managing memberships, teams, and events**. Built with [TanStack Start](https://tanstack.com/start) and deployed on [Netlify](https://www.netlify.com/).

## Prerequisites

- Node.js (v18+ or v20+)
- pnpm (v9+)
- PostgreSQL database

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/solstice

# Application
VITE_BASE_URL=http://localhost:3000

# OAuth Providers (optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Project Structure

- `src/routes/` - File-based routing (pages and API endpoints)
- `src/lib/auth/` - Better Auth configuration and functions
- `src/lib/db/` - Drizzle database setup and schemas
- `src/lib/server/` - Server-side database schemas
- `src/components/ui/` - shadcn/ui components

## Development

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up the database:

   ```bash
   pnpm db push
   ```

3. Generate auth schemas:

   ```bash
   pnpm auth:generate
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm check-types` - Type checking with TypeScript
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm test:coverage` - Run tests with coverage
- `pnpm db` - Run Drizzle Kit database commands
- `pnpm auth:generate` - Generate auth schema from config

## Deployment

The application is automatically deployed to Netlify:

- **Production**: Pushes to `main` branch trigger production deployments
- **Preview**: Pull requests get automatic preview deployments

## CI/CD

GitHub Actions workflows handle:

- **Continuous Integration**: Linting, type checking, and testing on Node.js 18 and 20
- **Deploy Previews**: Automatic Netlify preview deployments for pull requests
- **Code Coverage**: Test coverage reports uploaded to Codecov

### Required GitHub Secrets

Configure these secrets in your GitHub repository settings:

- `DATABASE_URL` - PostgreSQL connection string for CI tests
- `VITE_BASE_URL` - Base URL for the application
- `NETLIFY_AUTH_TOKEN` - Netlify authentication token
- `NETLIFY_SITE_ID` - Netlify site ID
- `CODECOV_TOKEN` - Codecov upload token (optional)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

Solstice is a **modern web platform for managing memberships, teams, and events**. It leverages a cutting-edge tech stack to deliver fast, dynamic user experiences while being highly extensible.

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
