# Security Configuration

This document outlines the security measures implemented in the Roundup Games application.

## Overview

The application implements multiple layers of security:

1. **Security Headers** - Applied via Netlify Edge Functions
2. **Secure Cookie Configuration** - Enhanced Better Auth settings
3. **Rate Limiting** - Protection against brute force attacks
4. **Password Validation** - Strong password requirements
5. **Content Security Policy (CSP)** - Protection against XSS attacks

## Security Headers

Security headers are automatically applied to all responses via a Netlify Edge Function located at `netlify/edge-functions/security-headers.ts`.

### Applied Headers:

- **Content-Security-Policy**: Restricts resource loading with nonce-based script validation
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **Referrer-Policy**: strict-origin-when-cross-origin - Controls referrer information
- **X-XSS-Protection**: 1; mode=block - Legacy XSS protection
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

The application implements rate limiting for sensitive endpoints:

### Auth Endpoints

- **Window**: 15 minutes
- **Max Requests**: 5 per window
- **Endpoints**: Login, registration, password reset

### API Endpoints

- **Window**: 15 minutes
- **Max Requests**: 100 per window
- **Endpoints**: All API routes

Usage example:

```typescript
import { rateLimit, getClientIp } from "~/lib/security";

// In your API route
const clientIp = getClientIp(request.headers);
await rateLimit("auth", clientIp);
```

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
- Use nonces for inline scripts
- Allow specific external resources (Google Fonts, OAuth providers)
- Block unsafe inline styles (except where necessary)
- Prevent object/embed elements
- Enforce HTTPS upgrades

### Nonce Implementation

The edge function automatically:

1. Generates a unique nonce for each request
2. Injects the nonce into all script tags
3. Includes the nonce in the CSP header

## Environment Variables

Add these optional security-related environment variables:

```env
# Cookie domain restriction (optional)
COOKIE_DOMAIN=.yourdomain.com

# OAuth allowed email domains (comma-separated)
OAUTH_ALLOWED_DOMAINS=yourdomain.com,trusted-partner.com
```

## Development vs Production

Security features that differ between environments:

### Development

- Cookies use HTTP (not HTTPS-only)
- Email verification not required
- CSP may be more permissive

### Production

- Cookies are HTTPS-only
- Email verification required
- Strict CSP enforcement
- HSTS header with preloading

## Testing Security

1. **Headers**: Use browser dev tools or `curl -I https://yoursite.com`
2. **CSP**: Check browser console for violations
3. **Cookies**: Inspect in browser dev tools
4. **Rate Limiting**: Test with rapid requests
5. **Password Validation**: Test with various password combinations

## Future Enhancements

Consider implementing:

1. **Redis-based Rate Limiting** - For distributed deployments
2. **Web Application Firewall (WAF)** - Additional protection layer
3. **Security Monitoring** - Log and alert on security events
4. **2FA/MFA** - Two-factor authentication
5. **API Key Management** - For service-to-service auth
