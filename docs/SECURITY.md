# Security Configuration

This document outlines the security measures implemented in the Solstice application.

## Overview

The application implements multiple layers of security:

1. **Security Headers** - Applied via CloudFront Response Headers Policy (SST/AWS)
2. **Secure Cookie Configuration** - Enhanced Better Auth settings
3. **Rate Limiting** - Protection against brute force attacks
4. **Password Validation** - Strong password requirements
5. **Content Security Policy (CSP)** - Protection against XSS attacks

## Security Headers

Security headers are applied at the CDN layer via a CloudFront Response Headers
Policy configured in `sst.config.ts`. Local development responses (Vite on
localhost) do not include these headers.

### Applied Headers:

- **Content-Security-Policy**: Static policy applied at CloudFront. Currently allows
  `unsafe-inline` for scripts/styles; follow-up work should tighten this with a
  nonce-based policy.
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **Referrer-Policy**: strict-origin-when-cross-origin - Controls referrer information
- **Frame-Ancestors**: `'none'` (via CSP) - Blocks embedding in iframes
- **Permissions-Policy**: Restricts browser features
- **Strict-Transport-Security**: Enforces HTTPS with preloading

## Cookie Configuration

Better Auth cookies are configured with enhanced security settings:

```typescript
{
  secure: true,              // HTTPS only in production
  sameSite: "lax",          // CSRF protection
  httpOnly: true,           // No JavaScript access
  path: "/",                // Available site-wide
  domain: process.env.COOKIE_DOMAIN // Optional domain restriction
}
```

## Rate Limiting

The application implements both client-side (TanStack Pacer) and server-side
rate limiting for sensitive endpoints. Server-side limits use Redis-backed
sliding windows with fallback to in-memory limits when Redis is unavailable.

### Auth Endpoints

- **Window**: 15 minutes
- **Max Requests**: 5 per window
- **Endpoints**: Login, registration, password reset, MFA verification

### API Endpoints

- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Endpoints**: All API routes

### Export + Admin Endpoints

- **Exports**: BI and audit exports (stricter window, lower max)
- **Admin**: Role assignment, membership changes, delegated access

Usage example (server-side):

```typescript
import { enforceRateLimit } from "~/lib/security";

await enforceRateLimit({
  bucket: "auth",
  route: "auth:sign-in",
  userId,
});
```

### Redis Behavior

- **Client**: Uses node-redis (`redis` package) with TLS and auth token support.
- **Fail-open default**: If Redis is unavailable, rate limits fall back to in-memory
  counters and caches return uncached data.
- **Fail-closed option**: Set `REDIS_REQUIRED=true` (prod/perf defaults) to return 429s
  when Redis is down; the app logs a `rate_limit_unavailable` security event.
- **Key isolation**: `REDIS_PREFIX` scopes keys by stage to avoid cross-environment
  collisions.

## Password Requirements

Strong password validation is enforced:

- **Minimum Length**: 8 characters
- **Required**: Uppercase, lowercase, numbers, and special characters
- **Strength Meter**: 0-5 scale for user feedback

Usage example:

```typescript
import { validatePassword, getPasswordStrength } from "~/lib/security";

const result = validatePassword(password);
if (!result.isValid) {
  // Show errors to user
  console.error(result.errors);
}

const strength = getPasswordStrength(password);
// Display strength indicator
```

## Content Security Policy (CSP)

The CSP is configured to:

- Allow self-hosted resources by default
- Allow inline scripts/styles temporarily (`unsafe-inline`) until nonce support lands
- Explicitly block embedding via `frame-ancestors 'none'`
- Allow only the external origins required for Square
- Prevent object/embed elements
- Enforce HTTPS upgrades
- CSP reporting is not yet enabled

### Nonce-Based CSP (Planned)

Nonce-based CSP is not implemented yet. The router already reads a nonce when
it is present in the document, but the app does not currently generate or inject
one. To move to a strict CSP, we will need per-request nonce generation and a
server-side injection path (for example via Lambda@Edge or app-level HTML
templating).

## Environment Variables

Add these optional security-related environment variables:

```env
# Cookie domain restriction (optional)
COOKIE_DOMAIN=.yourdomain.com

# OAuth allowed email domains (comma-separated)
OAUTH_ALLOWED_DOMAINS=yourdomain.com,trusted-partner.com
```

When `OAUTH_ALLOWED_DOMAINS` is set, Google OAuth sign-ins are limited to the specified domains. Users attempting to authenticate with an email outside the allowlist receive a friendly error explaining that an approved organizational address is required. Leave this variable unset (the parser returns an empty array) to allow OAuth sign-ins from any domain during testing.

## Development vs Production

Security features that differ between environments:

### Development

- Cookies use HTTP (not HTTPS-only)
- Email verification not required
- CSP may be more permissive
- CloudFront security headers are not applied to localhost

### Production

- Cookies are HTTPS-only
- Email verification required
- CSP enforced at the CDN layer
- HSTS header with preloading

## Testing Security

1. **Headers**: Use browser dev tools or `curl -I https://yoursite.com`
2. **CSP**: Check browser console for violations
3. **Cookies**: Inspect in browser dev tools
4. **Rate Limiting**: Test with rapid requests
5. **Password Validation**: Test with various password combinations

## Future Enhancements

Consider implementing:

1. **Web Application Firewall (WAF)** - Additional protection layer
2. **Security Monitoring** - Log and alert on security events
3. **2FA/MFA** - Two-factor authentication
4. **CORP for Signed Downloads** - Apply CORP headers to signed S3 downloads
5. **API Key Management** - For service-to-service auth
