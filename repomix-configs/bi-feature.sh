#!/bin/bash
# BI Feature Bundle (~55k tokens)
# Covers: BI platform core, governance, semantic layer, components, routes

npx repomix@latest --token-count-tree 50 --include "\
src/features/bi/**/*.ts,\
src/features/bi/**/*.tsx,\
src/db/schema/bi.schema.ts,\
src/routes/dashboard/sin/analytics.tsx,\
src/routes/dashboard/admin/sin/analytics.tsx" \
--ignore "**/__fixtures__/**,**/docs/**,**/__tests__/**,**/*.test.ts"
