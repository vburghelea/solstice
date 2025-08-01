# E2E Testing

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── auth.setup.ts                    # Authentication setup (runs before tests)
├── tests/
│   ├── unauthenticated/            # Tests that run without authentication
│   │   ├── auth-pages.unauth.spec.ts
│   │   ├── auth-validation.unauth.spec.ts
│   │   └── auth-flow.unauth.spec.ts
│   └── authenticated/              # Tests that require authentication
│       ├── dashboard.auth.spec.ts
│       ├── profile.auth.spec.ts
│       ├── teams.auth.spec.ts
│       ├── navigation.auth.spec.ts
│       └── logout.auth.spec.ts
└── .auth/                          # Auth state storage (gitignored)
```

## Running Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Run only unauthenticated tests
pnpm test:e2e --project=chromium-no-auth

# Run only authenticated tests
pnpm test:e2e --project=chromium-auth

# Run specific test file
pnpm test:e2e dashboard.auth.spec.ts

# Run with UI mode
pnpm test:e2e:ui

# Run headed (see browser)
pnpm test:e2e --headed
```

## Test Data Setup

Before running tests, ensure test data is seeded:

```bash
# Clean and seed test data
pnpm tsx scripts/clean-test-users.ts && pnpm test:e2e:setup
```

## Environment Configuration

E2E tests use `.env.e2e` for configuration. Copy `.env.e2e.example` to `.env.e2e` and update as needed.

## Writing Tests

### Naming Convention

- `*.unauth.spec.ts` - Tests that must run without authentication
- `*.auth.spec.ts` - Tests that require authentication
- Feature-specific names assume authentication (e.g., `dashboard.spec.ts`)

### Best Practices

1. Use Playwright's recommended locators (getByRole, getByLabel, getByText)
2. Avoid arbitrary timeouts - use proper wait conditions
3. Keep tests isolated and independent
4. Use descriptive test names

## Authentication

The test suite uses Better Auth's password hashing. Test users are created with:

- Email: `test@example.com`
- Password: `testpassword123`

Authentication state is shared across authenticated tests for efficiency.

## CI/CD

E2E tests run automatically on GitHub Actions for every pull request. The workflow:

- Sets up test database
- Seeds test data
- Runs all E2E tests
- Uploads test results as artifacts
