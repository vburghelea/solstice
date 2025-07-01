# Issue: OAuth Login Buttons Not Working - No Click Events Firing

## Problem Description

OAuth login buttons (Google & GitHub) on the login page do not respond to clicks. No console logs, network requests, or any JavaScript events are triggered when buttons are clicked.

## Environment

- **URL**: http://localhost:8888/login (Netlify Dev)
- **Server**: Netlify Dev proxying Vite dev server
- **Framework**: TanStack Start with React
- **OAuth Library**: Better Auth

## Root Cause

The client-side JavaScript bundle is not being loaded, preventing React hydration. The `<Scripts />` component in `__root.tsx` renders an empty `<script></script>` tag instead of loading the client bundle.

### Evidence

1. Server-side rendered HTML loads correctly
2. Console shows "LoginForm component mounted" indicating server-side rendering works
3. No click handlers work - even basic HTML buttons with inline onClick
4. HTML inspection shows empty `<script></script>` tag where client bundle should be
5. No script tags with `src` attributes are present in the HTML

## Technical Details

### What's Working

- Server-side rendering (SSR) is functioning
- OAuth credentials are loaded (verified in server logs)
- Auth configuration is correct
- CSP headers are properly configured with nonces

### What's Not Working

- Client-side hydration is not happening
- Vite HMR/client modules are not being loaded through Netlify Dev
- The `<Scripts />` component from TanStack Start is not injecting the client bundle

### Configuration Files Checked

- `/src/routes/__root.tsx` - Has `<Scripts />` component correctly placed
- `/vite.config.ts` - Configured with `target: "netlify"`
- `/netlify/edge-functions/security-headers.ts` - CSP allows nonce-based scripts
- `/src/lib/auth/index.ts` - OAuth providers configured correctly
- `/src/features/auth/components/login.tsx` - Click handlers properly defined

## Attempted Solutions

1. ✅ Verified OAuth credentials are loaded
2. ✅ Updated VITE_BASE_URL to correct port (8888)
3. ✅ Added debug logging to components
4. ✅ Tested with simple HTML buttons
5. ✅ Checked for TypeScript errors
6. ✅ Verified CSP headers
7. ❌ Client-side JavaScript still not loading

## Potential Solutions to Try

1. **Access via Vite directly**: Try http://localhost:5173 instead of Netlify Dev
2. **Check Netlify Dev proxy**: Ensure it's properly forwarding Vite's module requests
3. **Disable CSP temporarily**: Comment out edge function to test
4. **Check for build mode issues**: Ensure Vite is in development mode
5. **Verify TanStack Start setup**: Compare with official template

## Related Code Locations

- Login component: `/src/features/auth/components/login.tsx`
- Root route: `/src/routes/__root.tsx`
- Auth config: `/src/lib/auth/index.ts`
- Vite config: `/vite.config.ts`
- Edge functions: `/netlify/edge-functions/security-headers.ts`

## Console Output

```
Auth client created with baseURL: http://localhost:8888
LoginForm component mounted
Environment: { baseUrl: 'http://localhost:8888' }
```

## Next Steps

1. Test if the issue occurs when accessing Vite dev server directly (port 5173)
2. Investigate Netlify Dev's handling of Vite module requests
3. Check TanStack Start documentation for Netlify-specific deployment issues
4. Consider temporarily removing the `target: "netlify"` from Vite config for local development
