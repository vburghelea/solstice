# SST-001: Upgrade SST to v3.17.29

**Status:** RESOLVED

## Summary

Need to upgrade SST from v3.17.25 to v3.17.29 to pull in a fix for range errors that mask real errors.

## Solution

Vendored the SST platform package locally:

```json
"sst": "file:vendor/sst"
```

The `vendor/sst/` directory contains the built SST platform package from v3.17.29.

**Target commit:** https://github.com/anomalyco/sst/commit/32b37a47a949f89b4b35832ae8e2ce77da9a9284
**Target release:** https://github.com/anomalyco/sst/releases/tag/v3.17.29

## Problem

SST v3.17.29 is not published to npm. The latest npm version is v3.17.25:

```
The latest release of sst is "3.17.25".

Other releases are:
  * rc: 2.0.0-rc.71
  * ion-snapshot: 0.0.0-1723579062
  * snapshot: 0.0.0-1750800256
  * two: 2.49.6
  * ion: 3.17.25
```

The anomalyco/sst GitHub repo (formerly sst/sst) has released v3.17.29 but only as binary artifacts on GitHub Releases.

## SST Architecture Context

SST has two components:

1. **Go CLI binary** (`sst`) - The actual CLI that runs `sst dev`, `sst deploy`, etc.
2. **npm package** (`sst`) - JavaScript SDK for imports like `import { Resource } from "sst"`

The npm package also includes a bin script that bootstraps/downloads the Go binary.

## Attempts Made

### 1. Update package.json to `^3.17.29`

**Result:** Failed - version doesn't exist on npm

```
ERR_PNPM_NO_MATCHING_VERSION  No matching version found for sst@^3.17.29
```

### 2. Install global binary via SST install script

**Command:** `curl -fsSL https://sst.dev/install | VERSION=3.17.29 bash`
**Result:** Success - installs to `~/.sst/bin/sst`

Running `sst version` outside the project shows v3.17.29. However, inside the project with a local package.json dependency, it defers to the local version.

### 3. Remove local SST dependency entirely

**Command:** `pnpm remove sst`
**Result:** Build fails - code imports from `sst` package

```
Rollup failed to resolve import "sst" from ".../imports.mutations.ts"
```

Files like `src/features/imports/imports.mutations.ts` use `import { Resource } from "sst"`.

### 4. Install from GitHub with monorepo reference

**Command:** `pnpm add -D sst@github:anomalyco/sst#v3.17.29`
**Result:** Installs entire monorepo, not the npm package

The GitHub repo is a monorepo. The actual npm package comes from `platform/` subdirectory. Installing the root gives:

```
node_modules/sst/
├── .air.toml
├── cmd/
├── examples/
├── go.mod
├── platform/   <-- actual npm package is here
├── sdk/
└── www/
```

Running `npx sst` fails:

```
npm error could not determine executable to run
```

### 5. Install from GitHub subdirectory

**Command:** `pnpm add -D "sst@github:anomalyco/sst/platform#v3.17.29"`
**Result:** Failed - pnpm doesn't support subdirectory syntax

```
anomalyco/sst/platform is not a valid repository name
```

### 6. Link to local SST clone

**Command:** `pnpm add -D "sst@link:/Users/austin/dev/_libraries/sst/platform"`
**Result:** Links successfully but missing bin script

The source `platform/` directory doesn't have `bin/sst.mjs` - that's generated during npm publishing.

- `sst version` → 3.17.29 (uses global binary)
- `npx sst version` → 3.17.25 (tries to use local bin, falls back)
- `sst deploy` → Build fails with Rollup import error

## Current State

- Global binary: v3.17.29 at `~/.sst/bin/sst`
- Local package: Linked to `~/dev/_libraries/sst/platform` (incomplete - no bin script)
- Build status: **BROKEN** - Rollup can't resolve `sst` imports

## Possible Solutions

### Option A: Build the platform package locally

1. In `~/dev/_libraries/sst/platform`, run the build script
2. This should generate `bin/sst.mjs` and other required files
3. Link to the built output

**Pros:** Uses exact v3.17.29 code
**Cons:** Need to understand SST build process, maintain local build

### Option B: Wait for npm publish

Monitor npm for v3.17.29 release, then simply update package.json.

**Pros:** Clean solution
**Cons:** Unknown timeline

### Option C: Use npm v3.17.25 for SDK + global v3.17.29 for CLI

1. `pnpm add -D sst@3.17.25` for JS imports
2. Use global v3.17.29 binary for CLI commands
3. Suppress the "local vs global" warning

**Pros:** Works immediately
**Cons:** Version mismatch risk (likely minimal for patch versions)

### Option D: Download and extract the release tarball

1. Download `sst-mac-arm64.tar.gz` from GitHub releases
2. Extract the platform package portion
3. Publish to a private npm registry or use as a local file dependency

**Pros:** Gets exact release artifacts
**Cons:** Complex, need to understand release structure

### Option E: Fork and publish to npm

1. Fork anomalyco/sst
2. Publish v3.17.29 to npm under a scoped package (e.g., `@solstice/sst`)
3. Update imports if package name changes

**Pros:** Full control
**Cons:** Maintenance burden, may need to update imports

## Files Affected

Files importing from `sst`:

- `src/features/imports/imports.mutations.ts`
- (likely others - need to grep for `from "sst"` or `from 'sst'`)

## References

- SST repo: https://github.com/anomalyco/sst
- Target release: https://github.com/anomalyco/sst/releases/tag/v3.17.29
- Target commit: https://github.com/anomalyco/sst/commit/32b37a47a949f89b4b35832ae8e2ce77da9a9284
- Local SST clone: `~/dev/_libraries/sst`
