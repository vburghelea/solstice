# Rate Limiting Documentation

## Overview

The application implements rate limiting to protect against abuse and ensure fair usage of API endpoints. Rate limiting is applied at two levels:

1. **Authentication endpoints** - Stricter limits for sensitive operations
2. **API endpoints** - General limits for regular API calls

## Configuration

Rate limits are configured in `src/lib/security/config.ts`:

```typescript
rateLimit: {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
  },
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
}
```

## Protected Endpoints

### Authentication Endpoints (5 requests per 15 minutes)

- `/api/auth/sign-in`
- `/api/auth/sign-up`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/verify-email`

When the rate limit is exceeded, the server returns:

```json
{
  "error": "Too Many Requests",
  "message": "Too many requests, please try again later."
}
```

Status Code: 429

## Implementation Details

### Rate Limit Store

Currently uses an in-memory store suitable for development and single-instance deployments. For production with multiple instances, consider using:

- Upstash Redis
- DynamoDB
- CDN-level rate limiting (Netlify, Cloudflare)

### Client Identification

Rate limiting is based on client IP address, extracted from these headers (in order):

1. `x-forwarded-for`
2. `x-real-ip`
3. `cf-connecting-ip`
4. Falls back to "unknown" if no IP found

### Adding Rate Limiting to New Endpoints

To add rate limiting to server functions:

```typescript
import { rateLimitedHandler } from "~/lib/security/middleware/server-fn-rate-limit";

export const myServerFunction = createServerFn({ method: "POST" }).handler(
  rateLimitedHandler(
    "api", // or "auth" for stricter limits
    async ({ data }) => {
      // Your server function logic
    },
  ),
);
```

Note: Due to TanStack Start's type inference, you may need to use `@ts-expect-error` comments.

## Testing

Test rate limiting with curl:

```bash
# Test auth endpoint (limit: 5 requests)
for i in {1..7}; do
  curl -X POST -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test"}' \
    http://localhost:5173/api/auth/sign-in
done
```

## Future Improvements

1. **Distributed Rate Limiting**: Implement Redis-based store for multi-instance deployments
2. **User-based Limits**: Different limits for authenticated vs anonymous users
3. **Endpoint-specific Limits**: Custom limits for specific endpoints
4. **Rate Limit Headers**: Return `X-RateLimit-*` headers to inform clients
5. **Gradual Backoff**: Implement exponential backoff for repeated violations
