# SQL Workbench Guardrails + Audit Chain Evidence (2025-12-31)

## Guardrails Tests (Executor)

Command:

```bash
pnpm test --run src/features/bi/__tests__/sql-executor.test.ts
```

Output (excerpt):

```text
✓ src/features/bi/__tests__/sql-executor.test.ts (5 tests)
  ✓ executeSqlWorkbenchQuery > applies session settings and limits
  ✓ executeSqlWorkbenchQuery > rejects queries that exceed cost limits
  ✓ executeSqlWorkbenchQuery > defaults to UI row limits when maxRows is not provided
  ✓ executeSqlWorkbenchQuery > respects export row limits when provided
  ✓ executeSqlWorkbenchQuery > propagates concurrency guardrail errors
```

## Audit Chain Verification

Command:

```bash
set -a && source .env && set +a
npx tsx -e "import { verifyAuditChain } from './src/features/bi/governance/audit-logger'; const start = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7); const end = new Date(); const orgId = 'a0000000-0000-4000-8001-000000000001'; verifyAuditChain(orgId, start, end).then((result) => { console.log(JSON.stringify({ orgId, start: start.toISOString(), end: end.toISOString(), result }, null, 2)); }).catch((error) => { console.error(error); process.exit(1); });"
```

Output:

```json
{
  "orgId": "a0000000-0000-4000-8001-000000000001",
  "start": "2025-12-24T09:47:50.778Z",
  "end": "2025-12-31T09:47:50.778Z",
  "result": {
    "valid": true,
    "entriesChecked": 12,
    "firstBrokenEntry": null
  }
}
```
