# Environment Configuration

This project uses a layered environment configuration system that supports different environments (development, test, production) with proper secret management.

## Environment Files

The following environment files are supported (loaded in priority order):

1. `.env` - Base configuration shared across all environments
2. `.env.{NODE_ENV}` - Environment-specific configuration (e.g., `.env.test`, `.env.production`)
3. `.env.local` - Local overrides (not loaded in test environment)
4. `.env.{NODE_ENV}.local` - Local environment-specific overrides

Files are loaded in order, with later files overriding earlier ones. Process environment variables have the highest priority.

## Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your local development values

3. For production deployment on Netlify, set sensitive environment variables in the Netlify dashboard

## Available Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `VITE_BASE_URL` - Application base URL
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `BETTER_AUTH_SECRET` - Secret for Better Auth sessions
- `VITE_ENABLE_ANALYTICS` - Enable analytics (true/false)
- `VITE_ENABLE_SENTRY` - Enable Sentry error tracking (true/false)
- `VITE_POSTHOG_KEY` - PostHog analytics key
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking

## Using Environment Variables in Code

```typescript
import { env, getDbUrl, getBaseUrl, isAnalyticsEnabled } from "@/lib/env";

// Get required variables (throws if not set)
const dbUrl = getDbUrl();
const baseUrl = getBaseUrl();

// Get optional variables
const githubClientId = env.get("GITHUB_CLIENT_ID");

// Check environment
if (env.isProduction()) {
  // Production-specific code
}

// Check feature flags
if (isAnalyticsEnabled()) {
  // Initialize analytics
}
```

## Netlify Deployment

The `netlify.toml` file is configured to set the appropriate `NODE_ENV` for different deployment contexts:

- **Production** (main branch): `NODE_ENV=production`
- **Branch deploys**: `NODE_ENV=test`
- **Deploy previews** (PRs): `NODE_ENV=test`

This ensures the correct environment files are loaded for each deployment type.
