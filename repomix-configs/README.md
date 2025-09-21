# Repomix Configuration Bundles

This directory contains pre-configured Repomix bundles for each development ticket in the backlog. These configurations are optimized to stay under the 60,000 token limit while providing comprehensive context for AI assistants.

## Quick Usage

Run any script to generate a context bundle:

```bash
./evt-1-cancellation.sh    # Event cancellation flow (~40-50k tokens)
./evt-2-pricing-tests.sh   # Pricing tests (~20-30k tokens)
./evt-3-utilities.sh       # Utility refactoring (~15-20k tokens)
./app-1-router-types.sh    # Router types (~10-15k tokens)
./doc-1-alignment.sh       # Documentation (~5-10k tokens)
```

## Configuration Overview

### EVT-1: Event Cancellation (P0 - Critical)

- **Files**: Event features, payment services, database schemas
- **Token Range**: 40-50k
- **Includes**: Git diffs and recent logs for context
- **Purpose**: Implementing cascading cancellation with refunds

### EVT-2: Registration Pricing Tests (P1 - High)

- **Files**: Event mutations, test utilities, mocks
- **Token Range**: 20-30k
- **Compression**: Enabled for test code
- **Purpose**: Adding comprehensive test coverage for pricing logic

### EVT-3: Time & Metadata Utilities (P1 - High)

- **Files**: Event mutations and types, server utilities
- **Token Range**: 15-20k
- **Optimization**: Comments and empty lines removed
- **Purpose**: Refactoring duplicate utility code

### APP-1: Router Type Coverage (P2 - Medium)

- **Files**: Client entry, router configuration, TypeScript config
- **Token Range**: 10-15k
- **Purpose**: Adding TypeScript declarations for router events

### DOC-1: Documentation Alignment (P2 - Medium)

- **Files**: Documentation files, environment configs
- **Token Range**: 5-10k
- **Purpose**: Updating and aligning documentation

## Manual Token Counting

Check token usage before generating:

```bash
# Check specific config
npx repomix@latest --config ./evt-1-cancellation.json --token-count-tree

# Check with threshold (only show files >100 tokens)
npx repomix@latest --config ./evt-2-pricing-tests.json --token-count-tree 100

# Quick check with pattern
npx repomix@latest --include "src/features/events/**" --token-count-tree
```

## Custom Bundles

Create a custom bundle by copying a JSON config and modifying:

```json
{
  "output": {
    "filePath": "custom-bundle.xml",
    "style": "xml"
  },
  "include": ["src/features/your-feature/**", "src/db/schema/related-schema.ts"],
  "ignore": ["**/*.test.ts", "**/node_modules/**"]
}
```

Then run:

```bash
npx repomix@latest --config ./your-config.json
```

## Token Optimization Tips

1. **Use compression** for code-heavy bundles: `--compress`
2. **Remove comments** when focusing on structure: `--remove-comments`
3. **Limit git logs** to recent changes: `--include-logs-count 20`
4. **Use targeted patterns** instead of wildcards
5. **Check token tree** before generating to identify large files

## Output Files

Generated bundles are saved in `repomix-configs/outputs/`:

- `outputs/evt1-cancellation.xml`
- `outputs/evt2-pricing-tests.xml`
- `outputs/evt3-utilities.xml`
- `outputs/app1-router-types.xml`
- `outputs/doc1-alignment.xml`

These XML files can be directly pasted into Claude or other AI assistants for context-aware assistance.

The outputs directory is gitignored to prevent committing generated bundles.
