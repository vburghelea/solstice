# Tech Debt and Future Improvements

## Current Status (Updated)

### ✅ Resolved Issues

1. **TypeScript Errors** - All linting errors have been resolved

   - Fixed import path issues in test files
   - Added proper eslint-disable comments for test mocks
   - Resolved auth middleware type issues

2. **ESLint Warnings** - Addressed all warnings
   - Fixed `useTheme` hook state updates in useEffect
   - Removed array index keys in password input example

### 🟥 P0 - Critical Issues (Must Fix)

#### 1. Security Hardening

- **Cookie Security in Previews**: `NODE_ENV` is "test" in Netlify previews, making cookies insecure
  - Action: Force `secure = true` when `VITE_BASE_URL` starts with `https://`
- **Environment Files**: `.env.test` and `.env.production` contain real connection strings
  - Action: Replace with example.com hostnames
- **BetterAuth Secret**: Manual generation is error-prone
  - Action: Add postinstall script for secret generation

#### 2. Repository Structure

- **Incomplete Feature Migration**: `src/app/` still contains route-centric files
  - Action: Create thin `src/app/providers.tsx` for global providers only
  - Action: Move utilities to `src/shared/`
- **Test Organization**: Tests scattered across different patterns
  - Action: Co-locate tests with code (`foo.test.ts` next to `foo.ts`)

### 🟧 P1 - High Priority

#### 1. Production Stability

- **Rate Limiting**: In-memory storage won't scale
  - Action: Create adapter interface with Redis implementation
  - Use `@upstash/redis` with `REDIS_URL` env var
- **CSP Nonce Performance**: Rebuilds entire HTML on every request
  - Action: Only process HTML files < 256KB
- **Connection Pooling**: No leak prevention tests
  - Action: Add test for 500 parallel queries

#### 2. Testing Gaps

- **No API Contract Tests**: Server routes untested
  - Action: Use supertest with `createStartAPIHandler`
- **No E2E Tests**: Missing end-to-end coverage
  - Action: Add Playwright tests against preview URLs

### 🟨 P2 - Medium Priority

#### 1. Developer Experience

- **VS Code Config**: No shared extensions config
  - Action: Add `.vscode/extensions.json`
- **Storybook**: No component documentation
  - Action: Set up Storybook 8 for `shared/ui`
- **React 19 Compiler**: Not configured for dev/prod only
  - Action: Exclude from test builds

#### 2. CI/CD Improvements

- **Build Order**: Build doesn't depend on tests
  - Action: Make build depend on test success
- **Migration Caching**: Drizzle migrations not cached
  - Action: Cache migration artifacts
- **Dependency Updates**: No automated tracking
  - Action: Add dependabot.yml

## Code Duplication to Fix

1. **Auth Client**: Duplicated in `src/lib/auth-client.ts` and `lib/auth/auth-client.ts`
   - Action: Remove deep copy, use barrel export
2. **Database Connections**: Split between `neon.ts` and `connections.ts`
   - Action: Consolidate into single `connections.ts`
3. **Security Exports**: Long import paths
   - Action: Export everything from index.ts

## TypeScript Strictness Improvements

Add to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "skipLibCheck": false // After fixing all errors
  }
}
```

## Migration & Seeds Strategy

1. **CI Migrations**: Add step after install:

   ```yaml
   - name: Compile & apply drizzle migrations
     run: pnpm db push
     env:
       DATABASE_URL: postgresql://postgres:postgres@localhost:5432/solstice_test
   ```

2. **Seed Data**: Create `src/db/seeds/*.ts` for deterministic test data

## Security Testing

Add invariant tests:

- Critical headers presence
- Cookie security settings
- Rate limit effectiveness
- CSP policy validation

## Recommended Action Order

1. **Immediate (This Week)**

   - Fix cookie security in previews
   - Replace real connection strings
   - Add BetterAuth secret generation
   - Complete feature folder migration

2. **Next Sprint**

   - Implement Redis rate limiting
   - Add API contract tests
   - Set up connection leak tests
   - Consolidate duplicate code

3. **Following Sprint**
   - Add Playwright E2E tests
   - Set up Storybook
   - Configure VS Code extensions
   - Optimize CI/CD pipeline

## Metrics to Track

- TypeScript strict mode violations: 0
- Test coverage: Target 80%
- Build time: < 2 minutes
- Security header score: A+
- Lighthouse score: > 90

## Breaking Changes to Watch

1. **React 19 GA**: Currently on RC, watch for breaking changes
2. **TanStack Start**: Still in beta, API may change
3. **Better Auth**: Version 1.x, check for updates
4. **Neon Database**: Connection string format may evolve

## Long-term Architecture Goals

1. **Zero-downtime deployments**: Implement blue-green deployments
2. **Multi-region support**: Prepare for edge deployment
3. **Observability**: Full APM integration (Sentry, DataDog)
4. **Feature flags**: Runtime feature toggling
5. **A/B testing**: Built-in experimentation framework
