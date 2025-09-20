# Testing Guide

This directory contains the testing infrastructure for Solstice, using Vitest as the test runner.

## Running Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## Test Structure

- `setup.ts` - Global test setup and configuration
- `utils.tsx` - Common test utilities and custom render functions
- `mocks/` - Shared mocks for testing

## Writing Tests

### Component Tests

Use the custom `render` function from `~/tests/utils` which includes providers:

```tsx
import { render, screen } from "~/tests/utils";
import { Button } from "~/components/ui/button";

describe("Button", () => {
  it("renders correctly", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button")).toHaveText("Click me");
  });
});
```

### Testing with Auth

Use the auth mocks for testing authenticated features:

```tsx
import { createAuthMocks } from "~/tests/mocks/auth";

const { mockUser, mockSession } = createAuthMocks();
```

### Server Function Tests

Test server-side logic in isolation:

```ts
import { describe, it, expect } from "vitest";

describe("Server Function", () => {
  it("processes data correctly", () => {
    const result = myServerFunction(input);
    expect(result).toEqual(expected);
  });
});
```

## Test Environment

- Environment: jsdom (for browser-like testing)
- Test framework: Vitest
- Testing libraries: @testing-library/react, @testing-library/user-event
- Assertion library: @testing-library/jest-dom

## Coverage

Coverage reports are generated in the `coverage/` directory. View the HTML report by opening `coverage/index.html` in your browser.

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock external dependencies and API calls
3. **User-centric**: Test from the user's perspective using Testing Library queries
4. **Async handling**: Use `waitFor` for async operations
5. **Cleanup**: Tests automatically cleanup after each test via the setup file
