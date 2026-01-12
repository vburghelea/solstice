# SST-001 workaround: global 3.17.29 CLI with vendored SDK

## Why this exists

SST v3.17.29 has not been published to npm, but the CLI binaries are available
via GitHub Releases. The Solstice codebase still needs the `sst` npm package for
runtime imports like `import("sst")`, so removing the dependency is not viable.

## What we changed

- Switched the `sst` devDependency to a local vendor copy (`vendor/sst`) so the
  SDK is resolvable during builds while reporting version `3.17.29`.
- Updated `vendor/sst/bin/sst.mjs` to prefer the global CLI at `~/.sst/bin/sst`
  when present.
- Updated `docker/import-batch.Dockerfile` to copy `vendor/sst` before running
  `pnpm install --frozen-lockfile`.

## Result

- `npx sst version` uses the global 3.17.29 binary when it exists.
- SST deploys no longer fail the CLI/package version mismatch check.

## Removal plan

When SST v3.17.29 is published to npm:

1. Update `sst` to `3.17.29` from npm.
2. Remove the `vendor/sst` dependency and delete the `vendor/sst` folder.
3. Reinstall dependencies.
