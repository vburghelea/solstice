# Production Testing Notes - Membership System

## Current Production State

### What I Know for Certain

1. **Database Migration Status**
   - Migration file exists: `src/db/migrations/0001_add_membership_tables.sql`
   - Tables created: `membership_types` and `memberships`
   - Seed data: Annual Player Membership 2025 ($45)
   - **Status**: NOT applied to production database
   - **Evidence**: No confirmation of migration run, health check would fail if tables missing

2. **Environment Variables**
   - From `netlify env:list`, production has:
     - `DATABASE_URL` ✓
     - `GOOGLE_CLIENT_ID` ✓
     - `GOOGLE_CLIENT_SECRET` ✓
     - `NETLIFY_DATABASE_URL` ✓
     - `NETLIFY_DATABASE_URL_UNPOOLED` ✓
     - `NODE_ENV` ✓
   - **Missing**:
     - `BETTER_AUTH_SECRET` - Critical for auth sessions
     - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - For GitHub OAuth
     - `VITE_BASE_URL` - Not needed (Netlify provides `URL`)

3. **API Routes Issue**
   - `/api/health` returns HTML instead of JSON in production
   - TanStack Start API routes don't work on Netlify by default
   - Server functions via `createServerFn()` should work (different mechanism)
   - **Evidence**: `curl https://snazzy-twilight-39e1e9.netlify.app/api/health` returns HTML

4. **Authentication State**
   - User was able to log in manually in production
   - Created test user `prodtest@example.com`
   - Email verification is required in production (blocked automated login)
   - **Implication**: Basic auth works, but `BETTER_AUTH_SECRET` might be using a default

5. **Deployment Configuration**
   - Using Netlify with automatic deployments
   - Edge functions for security headers are configured
   - Build succeeded and site is accessible
   - Routes like `/dashboard` work correctly

## Assumptions I'm Making

1. **Database Assumptions**
   - Production uses Neon PostgreSQL (based on `NETLIFY_DATABASE_URL` pattern)
   - Connection pooling is properly configured by Netlify
   - Database has basic auth tables but not membership tables
   - Migrations need to be run manually in production

2. **Payment Flow Assumptions**
   - Mock payment service will work once database is set up
   - Base URL detection will work correctly using Netlify env vars
   - Checkout redirect URLs will use production domain
   - No CORS issues with same-origin redirects

3. **Server Function Assumptions**
   - TanStack Start server functions work differently than API routes
   - They should work in production without additional config
   - Type inference issues are compile-time only, not runtime
   - Database queries will work if tables exist

## Questions for You

### Critical Questions

1. **Have you run the database migration in production?**
   - If not, do you have access to run `pnpm db:push` or `pnpm db:migrate`?
   - Do you need help setting up the migration command?

2. **Is `BETTER_AUTH_SECRET` set in production?**
   - If not set, auth might be using an insecure default
   - Should we generate a secure secret now?

3. **Do you need the health check endpoint working?**
   - Current `/api/health` doesn't work due to TanStack/Netlify incompatibility
   - We could create a Netlify Function alternative

### Setup Questions

4. **GitHub OAuth Setup**
   - Do you have GitHub OAuth app credentials for production?
   - Are the callback URLs configured for the production domain?

5. **Email Verification**
   - Should email verification be disabled for testing?
   - Or do you have email sending configured?

### Testing Questions

6. **What's your testing priority?**
   - Database setup and migration first?
   - Full membership purchase flow?
   - Multi-user concurrent testing?
   - Error handling and edge cases?

## What Should Be Investigated

### High Priority Investigations

1. **Database Migration Method**

   ```bash
   # Need to determine which command works:
   pnpm db:push          # Direct push (risky for production)
   pnpm db:migrate       # Safe migration approach
   pnpm drizzle-kit push # Direct Drizzle command
   ```

2. **Server Function Behavior**
   - Test if `listMembershipTypes()` works at `/dashboard/membership`
   - Check browser DevTools Network tab for server function calls
   - Verify response format and error handling

3. **Environment Variable Usage**
   ```typescript
   // Check if these patterns work in production:
   process.env["VITE_BASE_URL"];
   env.URL || env.SITE_URL; // Netlify-provided
   ```

### Medium Priority Investigations

4. **Session Persistence**
   - How long do sessions last without `BETTER_AUTH_SECRET`?
   - Do sessions survive server restarts?
   - Are sessions shared across subdomains?

5. **Mock Payment Flow**
   - Does the checkout URL generation work with production domain?
   - Can users complete the mock purchase flow?
   - Is the membership properly recorded in database?

6. **Performance Under Load**
   - How many concurrent users can the membership page handle?
   - Are database connections properly pooled?
   - Any timeout issues with server functions?

### Low Priority Investigations

7. **Edge Cases**
   - What happens if user refreshes during checkout?
   - Double-click purchase button behavior
   - Back button after purchase completion
   - Expired membership renewal flow

8. **Error States**
   - Network failure during purchase
   - Database connection timeout
   - Invalid membership type ID
   - Concurrent purchase attempts

## Recommended Testing Sequence

### Phase 1: Infrastructure Setup

1. Verify/set `BETTER_AUTH_SECRET` environment variable
2. Apply database migration to create membership tables
3. Verify tables exist and seed data is present
4. Test basic database connectivity

### Phase 2: Basic Functionality

1. Log in as existing user
2. Navigate to `/dashboard/membership`
3. Verify membership types load from database
4. Test mock purchase flow
5. Verify membership status updates

### Phase 3: Edge Cases

1. Test with incomplete profile (should redirect)
2. Test multiple concurrent purchases
3. Test renewal of existing membership
4. Test error handling scenarios

### Phase 4: Production Monitoring

1. Set up error tracking (Sentry/similar)
2. Monitor database connection pool usage
3. Track server function performance
4. Watch for auth session issues

## Known Limitations & Workarounds

### API Routes Don't Work

- **Issue**: TanStack Start API routes return HTML on Netlify
- **Workaround**: Use server functions instead of API routes
- **Alternative**: Create Netlify Functions in `netlify/functions/`

### Type Inference Errors

- **Issue**: TanStack Start server functions have type issues
- **Workaround**: Using `@ts-expect-error` comments
- **Impact**: Development annoyance only, no runtime effect

### Email Verification Required

- **Issue**: Production requires email verification
- **Workaround**: Manually verify in database or disable in Better Auth config
- **Long-term**: Implement SendGrid integration (P1-2)

## Next Steps

1. **Immediate**: Confirm database migration status
2. **Immediate**: Set `BETTER_AUTH_SECRET` if missing
3. **Then**: Test full membership purchase flow
4. **Finally**: Document any new issues discovered

---

_Last Updated: Current conversation context_
_Purpose: Track production deployment issues and testing requirements for membership system_
