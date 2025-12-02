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

### Server Function Tests (TanStack Start)

Server functions created with `createServerFn` are automatically mocked in the test environment.
The mock bypasses the 'use server' pragma check and runs validation + handler logic directly.

```ts
import { describe, it, expect, vi } from "vitest";
import { myServerFn } from "~/features/example/example.queries";

describe("Server Function", () => {
  it("returns data for valid input", async () => {
    // Mock any dependencies the handler uses
    vi.mock("~/db/server-helpers", () => ({
      getDb: vi.fn().mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: "1", name: "Test" }]),
      }),
    }));

    // Call the server function like a regular async function
    const result = await myServerFn({ data: { id: "123" } });

    expect(result).toMatchObject({
      success: true,
      data: expect.any(Object),
    });
  });

  it("validates input with Zod schema", async () => {
    // Invalid input should throw validation error
    await expect(
      myServerFn({ data: { id: "" } }), // Empty ID fails validation
    ).rejects.toThrow();
  });
});
```

**Key points:**

- Import server functions directly - the mock handles the rest
- Validation runs automatically if `.inputValidator()` was used
- Mock database/auth dependencies inside the test
- The mock provides an empty `context` object (middleware is skipped)

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
