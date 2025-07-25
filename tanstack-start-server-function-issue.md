# TanStack Start Server Function Module Extraction Issue

## Summary

Server functions that import modules containing server-only code (like environment variables) are not being properly extracted from the client bundle, causing runtime errors in the browser.

## Expected Behavior

According to the TanStack Start documentation:

> "On the client, server functions will be removed; they exist only on the server. Any calls to the server function on the client will be replaced with a fetch request to the server to execute the server function, and send the response back to the client."

This should mean that any imports used within a server function handler should be automatically excluded from the client bundle.

## Actual Behavior

When importing a module that accesses server environment variables at the top level of a file containing server functions, the module is included in the client bundle and executes, causing errors like:

```
ReferenceError: process is not defined
    at createClientRpc (http://localhost:5173/node_modules/.vite/deps/@tanstack_react-start_server-functions-client.js?v=078e1e33:114:41)
```

## Reproduction

### 1. Create a server-only module that accesses environment variables:

```typescript
// src/lib/payments/square.ts
import { getBaseUrl } from "~/lib/env.server"; // This imports server env vars

export class SquarePaymentService {
  async createCheckoutSession(...) {
    const baseUrl = getBaseUrl(); // Uses process.env
    // ...
  }
}

export const squarePaymentService = new SquarePaymentService();
```

### 2. Import and use it in a server function:

```typescript
// src/features/membership/membership.mutations.ts
import { createServerFn } from "@tanstack/react-start";
import { squarePaymentService } from "~/lib/payments/square"; // This import causes the issue

export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    // Server function handler - should only run on server
    const checkoutSession = await squarePaymentService.createCheckoutSession(...);
    return { checkoutUrl: checkoutSession.checkoutUrl };
  }
);
```

### 3. Result:

The `square.ts` module is evaluated on the client, attempting to access `process.env`, which doesn't exist in the browser.

## Current Workaround

Moving the import inside the server function handler prevents client-side evaluation:

```typescript
export const createCheckoutSession = createServerFn({ method: "POST" }).handler(
  async ({ data }) => {
    // Dynamic import inside handler works
    const { squarePaymentService } = await import("~/lib/payments/square");
    const checkoutSession = await squarePaymentService.createCheckoutSession(...);
    return { checkoutUrl: checkoutSession.checkoutUrl };
  }
);
```

## Why This Should Work

Based on the documentation about how server functions are compiled:

1. "createServerFn is found in a file"
2. "The inner function is checked for a use server directive"
3. "On the client, the inner function is extracted out of the client bundle"
4. "The client-side server function is replaced with a proxy function"

The extraction process should include all dependencies of the server function handler, not just the handler itself.

## Impact

This forces developers to use dynamic imports as a workaround, which:

- Feels like a hack when TanStack Start should handle this automatically
- Makes the code less readable
- Could lead to confusion about what code runs where
- Prevents proper static analysis and tree-shaking

## Environment

- TanStack Start version: [check package.json]
- Vite version: [check package.json]
- Node version: [check your version]

## Related Documentation

- Server Functions: https://tanstack.com/start/latest/docs/server-functions
- Specifically the "How are server functions compiled?" section
