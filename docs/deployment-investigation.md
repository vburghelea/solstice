# Deployment investigation: event registration page

## Goal

Deliver the new event registration form (Square + e-transfer options, terms checkboxes, “Complete Registration” button) on `https://snazzy-twilight-39e1e9.netlify.app/events/e2e-open-showcase/register`, as introduced in commit `93fd1a8`.

## What we changed locally

- Ran `pnpm db:migrate` and committed the new payment-session schema + front-end form (`chore: apply event payment migrations`, 93fd1a8).
- Added the missing CSP hash to `netlify/edge-functions/security-headers.ts` so the inline module loader is allowed (`fix: update security headers…`, 045fbee).

## Deploy attempts

- Triggered multiple Netlify deploys (including “Clear cache and deploy”).
- Latest production deploy shows SHA `main@HEAD` (post-CSP fix).

## Observations in production

- The JS asset served at `/_slug.register-DHkfY7sG.js` is the new bundle; it contains `Register for {event.name}`, payment radio markup, and “Complete Registration”.
- Despite the correct client bundle, the rendered page still shows the old summary view:
  - DOM/innerText only includes the `Event Details` / `Registration` cards and a `Register Now` link.
  - No payment radios, checkboxes, or submit button are present.
- Hydration doesn’t replace the HTML, indicating the SSR output being sent by Netlify is still the legacy markup.
- CSP warnings are gone; no runtime JS errors.

## Evidence

- `curl -s https://snazzy-twilight-39e1e9.netlify.app/assets/_slug.register-DHkfY7sG.js | rg "Register for"` → matches found.
- `document.body.innerText` on the live page has only the old content.
- Query client shows the seeded event data (`allowEtransfer: false`), so the client is fetching correctly.

## Conclusion

The client bundle is updated, but the server-rendered HTML (and cached response) is stale. We need Netlify to rebuild the SSR/HTML portion so the new markup is sent.

## Suggested next steps

1. Confirm the production deploy’s build log is using commit `93fd1a8`.
2. Run `pnpm build` locally and inspect the generated SSR output (`dist`) to ensure it contains the new registration form.
3. If local build is correct, deploy that bundle directly (`netlify deploy --prod --dir=dist`) or otherwise ensure Netlify rebuilds SSR output from the new commit.
4. After deploy, purge/force-refresh the URL to invalidate any cached HTML.

Once the SSR is refreshed, re-test: the page should hydrate to the new form and allow full Square/e-transfer flows.
