# DEPLOY-001: Netlify Builds Failing Due to Corepack Signature Verification

## Status

**BLOCKING** - Production deployments are failing

## Summary

Netlify builds have been failing since commit `49d42e1` (Dec 21, 2025) due to a Corepack signature verification error when installing pnpm@10.12.4. The last successful deployment was commit `1708e68`.

## Impact

- **Production site is running stale code** from Dec 21, 08:52 UTC
- The deployed code references `is_public` column which was removed in migration `0008`
- Database has the migration applied, causing query errors for some users
- New features and fixes from commits `7bcff32`, `71bab63`, `e1db778` are not deployed

## Root Cause

Corepack (Node.js package manager installer) fails to verify the signature of pnpm@10.12.4:

```
Error: Cannot find matching keyid: {
  "signatures": [{"keyid": "SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U"}],
  "keys": [{"keyid": "SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA"}]
}
```

The pnpm package was signed with a key (`DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U`) that Netlify's Corepack doesn't recognize. This is a known issue when pnpm rotates signing keys faster than Corepack/Netlify updates.

## Failed Deploys

| Commit    | Title                                     | Time              | Error              |
| --------- | ----------------------------------------- | ----------------- | ------------------ |
| `e1db778` | Fix root redirect hydration               | Dec 22, 01:33 UTC | Corepack signature |
| `71bab63` | Address MCP review fixes                  | Dec 22, 01:17 UTC | Corepack signature |
| `7bcff32` | Remove public pages and move event routes | Dec 21, 20:28 UTC | Corepack signature |
| `49d42e1` | production readiness improvements         | Dec 21, 08:54 UTC | Corepack signature |

## Solution Options

### Option 1: Disable Corepack Strict Mode (Quick Fix)

Add to all environment contexts in `netlify.toml`:

```toml
COREPACK_ENABLE_STRICT = "0"
```

**Pros:** Quick, simple fix
**Cons:** Disables signature verification (minor security trade-off)

### Option 2: Downgrade pnpm to 9.x

Update `package.json`:

```json
"packageManager": "pnpm@9.15.0"
```

**Pros:** Uses stable, verified version
**Cons:** May require lockfile regeneration, potential compatibility issues

### Option 3: Wait for Netlify/Corepack Update

Wait for Netlify to update their build image with newer Corepack that recognizes the new pnpm signing key.

**Pros:** No code changes needed
**Cons:** Unknown timeline, production stays broken

## Recommended Action

**Option 1** - Add `COREPACK_ENABLE_STRICT = "0"` to `netlify.toml`

This is the standard workaround recommended by the Node.js and pnpm communities for this issue. The signature verification is a defense-in-depth measure, and disabling it in CI/CD is acceptable.

## Implementation

1. Edit `netlify.toml` and add `COREPACK_ENABLE_STRICT = "0"` to:
   - `[build.environment]`
   - `[context.production.environment]`
   - `[context.deploy-preview.environment]`
   - `[context.branch-deploy.environment]`

2. Commit and push to trigger new deploy

3. Verify deploy succeeds and production site works

## Verification

After fix is deployed:

- [ ] Netlify build completes successfully
- [ ] Production site loads without errors
- [ ] No `is_public` database errors in Safari/other browsers
- [ ] Latest features from `7bcff32` are live

## References

- [Corepack signature verification issue](https://github.com/nodejs/corepack/issues/612)
- [Netlify build logs](https://app.netlify.com/projects/snazzy-twilight-39e1e9/deploys/69489fe050c7ce000714bfa3)
- [pnpm signing key rotation](https://github.com/pnpm/pnpm/discussions/8635)
