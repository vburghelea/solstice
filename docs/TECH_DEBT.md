# Tech Debt and Future Improvements

## Remaining TypeScript Errors

1. **Import path issues** - Several files still have incorrect import paths:

   - `DefaultCatchBoundary.tsx` and `NotFound.tsx` importing from `./ui/button` instead of `~/shared/ui/button`
   - `password-input.example.tsx` importing from non-existent paths
   - Missing `@tanstack/react-start/api` module

2. **Auth client type issues**:

   - Removed `twoFactor` and `admin` properties that don't exist in Better Auth
   - Test mocks need updating to match actual auth client structure

3. **Test setup issues**:
   - `tests/setup.ts` missing `vi` import from vitest
   - Mock types in auth tests need proper typing

## Tech Debt Created

### 1. ESLint Warnings (Non-blocking)

- **useTheme hook**: Still has warnings about setting state in useEffect (though functionally correct)
- **Array index keys**: Password input example uses array indices as keys (acceptable for static arrays)

### 2. Auth Guard File Extension

- Had to rename `useAuthGuard.ts` to `.tsx` because it uses JSX
- This is a minor inconsistency as hooks typically use `.ts`

### 3. Environment Variable Handling

- Created `.env.test` and `.env.production` files but actual secrets need to be configured in Netlify
- The local/test split might need refinement based on actual deployment needs

### 4. Database Connection Complexity

- The dual pooled/unpooled connection setup adds complexity
- May need to revisit if Neon changes their recommendations

### 5. Test Coverage

- Only created example tests, not comprehensive coverage
- Auth middleware tests are simplified due to TanStack Start's complex middleware structure

## Shortcuts Taken

### 1. Simplified Rate Limiting

- In-memory storage won't scale across multiple instances
- Should implement Redis-based rate limiting for production

### 2. Basic Password Validation

- Current implementation is good but could add:
  - Common password dictionary checking
  - Leaked password database integration (haveibeenpwned)

### 3. CSP Nonce Implementation

- Currently generates nonces per request
- Could optimize with a nonce pool or caching strategy

### 4. Feature Folder Migration

- Only migrated auth features
- Other features still need to be organized when created

## Recommended Next Steps

### High Priority

1. Fix remaining TypeScript errors
2. Configure all environment variables in Netlify
3. Add comprehensive test coverage
4. Implement proper error boundaries

### Medium Priority

1. Add API documentation (OpenAPI/Swagger)
2. Implement request/response logging
3. Add performance monitoring (Sentry, etc.)
4. Create data migration scripts

### Low Priority

1. Add Storybook for component documentation
2. Implement feature flags system
3. Add internationalization (i18n)
4. Create admin dashboard scaffolding

## Configuration Needed

Before deploying to production:

1. **Netlify Environment Variables** - Set all required variables in Netlify UI
2. **OAuth Apps** - Create GitHub and Google OAuth applications
3. **Database** - Ensure Neon database is properly configured
4. **Domain** - Configure custom domain and update VITE_BASE_URL
5. **Monitoring** - Set up error tracking and analytics

## Breaking Changes to Watch

1. **TanStack Start** - Still in beta, API may change
2. **Better Auth** - Version 1.x, check for updates
3. **Neon Database** - Connection string format may evolve

## Performance Considerations

1. **Bundle Size** - Monitor and implement code splitting as needed
2. **Database Queries** - Add query optimization and caching
3. **Static Assets** - Implement CDN and image optimization
4. **API Response Times** - Add response caching where appropriate

## Security Improvements

1. **2FA Implementation** - Better Auth supports it but not implemented
2. **Session Management** - Add session revocation UI
3. **Audit Logging** - Track security-relevant events
4. **Input Sanitization** - Add additional validation layers
