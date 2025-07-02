# OAuth Buttons Not Working

## Summary

The social sign-in buttons (GitHub, Google) are not working. When a button is clicked, the application makes a `POST` request to `http://localhost:8888/api/auth/sign-in/social` but receives a `404 Not Found` response.

## What We Know

1.  **The Failure Point is the Netlify Dev Proxy:** The browser correctly sends the request to the Netlify Dev server on port `8888`. However, this server fails to proxy the request to the Vite dev server on port `5173`, where the API route lives.
2.  **The API Route is Live:** We have confirmed via `curl` that the Vite server on `:5173` responds to requests at `/api/auth/sign-in/social` (it returns a `400`, which is expected without a payload).
3.  **The Client-Side URL is Correct:** The `auth-client` correctly uses the browser's origin (`http://localhost:8888`) for its requests.

## What We've Ruled Out

A number of initial issues have been identified and fixed, but did not resolve the core 404 error:

**The Application Itself:** The application works correctly when accessed directly via the Vite dev server on `http://localhost:5173`. Social logins succeed. This confirms the issue is isolated to the Netlify Dev proxy.

1.  **`process is not defined` Errors:** We fixed several server-crashing memory leaks caused by server-side code being evaluated on the client. This was resolved by splitting environment variables into `env.server.ts` and `env.client.ts` and using lazy initialization for auth and database modules.
2.  **Content Security Policy (CSP) Violations:** We updated `netlify/edge-functions/security-headers.ts` to allow the necessary inline scripts (via hash) and connections to `localhost` during development.
3.  **CORS Errors:** We fixed CORS issues by ensuring the client-side `auth-client` dynamically uses `window.location.origin` as its `baseURL`.
4.  **TanStack Start Route Registration:** We confirmed the server routes for Better Auth are defined correctly in `src/routes/api/auth/`. We even added a more specific route file to handle the `sign-in/social` path. This seems to be a proxy issue, not a route registration issue.
5.  **`netlify.toml` Configuration:** We have tried multiple proxy configurations (`[[redirects]]` and `[[dev.proxy]]`) according to the [Netlify docs](https://docs.netlify.com/llms.txt). The current configuration uses the recommended `[[redirects]]` block with `force = true`, but it is still not working as expected.

## Documentation Referenced

- [Netlify TanStack Start Docs](https://docs.netlify.com/frameworks/tanstack-start/)
- [TanStack Start Hosting Docs](https://tanstack.com/start/latest/docs/framework/react/hosting)
- [Better Auth Usage Docs](https://www.better-auth.com/llms.txt)

## Next Steps

The core of the problem lies in why the Netlify Dev server is not respecting the `[[redirects]]` rule in `netlify.toml` for API requests. We need to investigate the Netlify Dev server's behavior and configuration more deeply.
